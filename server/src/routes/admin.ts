import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { FeedbackStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";
import { bool, int, isUniqueError, str } from "../lib/http";
import { createNotification } from "../lib/notify";
import { OrderError, adminUpdateOrderStatus } from "../lib/orders";
import { MAX_UPLOAD_BYTES, UPLOAD_DIR, UPLOAD_URL_PREFIX, detectImageType, newUploadName } from "../lib/uploads";
import { formatVND } from "../../../shared/format";
import { ORDER_STATUSES, type OrderStatusName } from "../../../shared/site";

// Toàn bộ API quản trị – bắt buộc role ADMIN
export const adminRouter = Router();
adminRouter.use(requireAdmin);

const DAY = 24 * 60 * 60 * 1000;

// ───────────── Tổng quan ─────────────

// GET /api/admin/dashboard
adminRouter.get("/dashboard", async (_req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 6 * DAY);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [revenueAll, revenueMonth, userCount, productCount, orderCount, pendingCount, lowStock, recentOrders, weekOrders, topItems] =
    await Promise.all([
      prisma.order.aggregate({ where: { status: "COMPLETED" }, _sum: { totalPayment: true } }),
      prisma.order.aggregate({ where: { status: "COMPLETED", updatedAt: { gte: startOfMonth } }, _sum: { totalPayment: true } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.product.findMany({
        where: { stockQuantity: { lt: 5 } },
        orderBy: { stockQuantity: "asc" },
        take: 6,
        select: { id: true, name: true, stockQuantity: true },
      }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } }),
      prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo }, status: { not: "CANCELLED" } },
        select: { createdAt: true, totalPayment: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: { status: { not: "CANCELLED" } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

  const topProducts = await prisma.product.findMany({
    where: { id: { in: topItems.map((t) => t.productId) } },
    select: { id: true, name: true },
  });

  // Doanh số đặt hàng 7 ngày gần nhất (không tính đơn hủy)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo.getTime() + i * DAY);
    const total = weekOrders
      .filter((o) => o.createdAt.toDateString() === d.toDateString())
      .reduce((sum, o) => sum + Number(o.totalPayment), 0);
    return { label: `${d.getDate()}/${d.getMonth() + 1}`, total };
  });

  res.json({
    revenueAll: Number(revenueAll._sum.totalPayment ?? 0),
    revenueMonth: Number(revenueMonth._sum.totalPayment ?? 0),
    userCount,
    productCount,
    orderCount,
    pendingCount,
    lowStock,
    recentOrders,
    days,
    topProducts: topItems.map((t) => ({
      id: t.productId,
      name: topProducts.find((p) => p.id === t.productId)?.name ?? "",
      quantity: t._sum.quantity ?? 0,
    })),
  });
});

// ───────────── Đơn hàng ─────────────

// GET /api/admin/orders?status=&q=
adminRouter.get("/orders", async (req, res) => {
  const statusParam = typeof req.query.status === "string" ? req.query.status : "";
  const status = ORDER_STATUSES.includes(statusParam as OrderStatusName) ? (statusParam as OrderStatusName) : undefined;
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(query
          ? {
              OR: [
                { id: { startsWith: query.toLowerCase() } },
                { shippingName: { contains: query } },
                { shippingPhone: { contains: query } },
                { user: { email: { contains: query } } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  res.json({ orders, counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])) });
});

// PATCH /api/admin/orders/:id/status { status, trackingCode? }
adminRouter.patch("/orders/:id/status", async (req, res) => {
  try {
    await adminUpdateOrderStatus(req.params.id, String(req.body?.status ?? ""), str(req.body, "trackingCode"));
    res.json({ success: true });
  } catch (error) {
    if (error instanceof OrderError) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    throw error;
  }
});

// ───────────── Sản phẩm ─────────────

type ProductInput = Omit<Prisma.ProductUncheckedCreateInput, "id">;

// Đọc và kiểm tra dữ liệu form sản phẩm
function parseProduct(body: Record<string, unknown> | undefined): { error: string } | { data: ProductInput } {
  const name = str(body, "name");
  const sku = str(body, "sku");
  const brand = str(body, "brand");
  const cpu = str(body, "cpu");
  const ram = str(body, "ram");
  const storage = str(body, "storage");
  const gpu = str(body, "gpu");
  const display = str(body, "display");

  if (!name || !sku || !brand) return { error: "Tên, mã SKU và hãng là bắt buộc" };
  if (!cpu || !ram || !storage || !gpu || !display) {
    return { error: "Vui lòng nhập đủ CPU, RAM, ổ cứng, card đồ họa và màn hình" };
  }

  const price = int(body, "price");
  const originalPrice = int(body, "originalPrice");
  const stockQuantity = int(body, "stockQuantity");
  const ramGb = int(body, "ramGb");
  const storageGb = int(body, "storageGb");
  const warrantyMonths = int(body, "warrantyMonths");

  if (price === null || Number.isNaN(price) || price <= 0) return { error: "Giá bán không hợp lệ" };
  if (originalPrice !== null && (Number.isNaN(originalPrice) || originalPrice < price)) {
    return { error: "Giá niêm yết phải lớn hơn hoặc bằng giá bán" };
  }
  if (stockQuantity === null || Number.isNaN(stockQuantity) || stockQuantity < 0) return { error: "Số lượng tồn kho không hợp lệ" };
  if (!ramGb || Number.isNaN(ramGb) || ramGb <= 0) return { error: "Dung lượng RAM (GB) không hợp lệ" };
  if (!storageGb || Number.isNaN(storageGb) || storageGb <= 0) return { error: "Dung lượng ổ cứng (GB) không hợp lệ" };
  if (warrantyMonths !== null && (Number.isNaN(warrantyMonths) || warrantyMonths < 0 || warrantyMonths > 120)) {
    return { error: "Bảo hành phải từ 0 đến 120 tháng" };
  }

  // Ảnh: file có sẵn trong /images/products, ảnh đã tải lên /uploads/products hoặc link http(s)
  const imageUrl = str(body, "imageUrl");
  if (imageUrl && !/^(https?:\/\/|\/images\/products\/|\/uploads\/products\/)/.test(imageUrl)) {
    return { error: "Link ảnh không hợp lệ" };
  }

  return {
    data: {
      name,
      sku: sku.toUpperCase(),
      brand,
      price,
      originalPrice,
      stockQuantity,
      categoryId: str(body, "categoryId"),
      cpu,
      ram,
      ramGb,
      storage,
      storageGb,
      gpu,
      display,
      battery: str(body, "battery"),
      weight: str(body, "weight"),
      os: str(body, "os"),
      ports: str(body, "ports"),
      connectivity: str(body, "connectivity"),
      color: str(body, "color"),
      warrantyMonths: warrantyMonths ?? 12,
      isFeatured: bool(body, "isFeatured"),
      description: str(body, "description"),
      imageUrl,
    },
  };
}

// GET /api/admin/products?q=&brand=&stock=low|out
adminRouter.get("/products", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const brand = typeof req.query.brand === "string" ? req.query.brand : "";
  const stock = req.query.stock;

  const [products, categories, allStats] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...(q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] } : {}),
        ...(brand ? { brand } : {}),
        ...(stock === "out" ? { stockQuantity: 0 } : stock === "low" ? { stockQuantity: { gt: 0, lt: 5 } } : {}),
      },
      orderBy: [{ brand: "asc" }, { price: "asc" }],
      include: { category: { select: { name: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ select: { brand: true, price: true, stockQuantity: true } }),
  ]);

  res.json({
    products,
    categories,
    brands: [...new Set(allStats.map((p) => p.brand))].sort(),
    stats: {
      total: allStats.length,
      low: allStats.filter((p) => p.stockQuantity > 0 && p.stockQuantity < 5).length,
      out: allStats.filter((p) => p.stockQuantity === 0).length,
      inventoryValue: allStats.reduce((sum, p) => sum + Number(p.price) * p.stockQuantity, 0),
    },
  });
});

// POST /api/admin/products
adminRouter.post("/products", async (req, res) => {
  const parsed = parseProduct(req.body);
  if ("error" in parsed) {
    res.status(400).json({ success: false, error: parsed.error });
    return;
  }
  try {
    const product = await prisma.product.create({ data: parsed.data });
    await prisma.priceHistory.create({ data: { productId: product.id, price: parsed.data.price } });
    res.status(201).json({ success: true, id: product.id });
  } catch (error) {
    if (isUniqueError(error)) {
      res.status(400).json({ success: false, error: "Mã SKU đã tồn tại" });
      return;
    }
    throw error;
  }
});

// PUT /api/admin/products/:id – ghi lịch sử giá, báo giảm giá cho khách đã yêu thích
adminRouter.put("/products/:id", async (req, res) => {
  const id = req.params.id;
  const parsed = parseProduct(req.body);
  if ("error" in parsed) {
    res.status(400).json({ success: false, error: parsed.error });
    return;
  }

  const before = await prisma.product.findUnique({ where: { id } });
  if (!before) {
    res.status(404).json({ success: false, error: "Sản phẩm không tồn tại" });
    return;
  }

  try {
    await prisma.product.update({ where: { id }, data: parsed.data });
  } catch (error) {
    if (isUniqueError(error)) {
      res.status(400).json({ success: false, error: "Mã SKU đã tồn tại" });
      return;
    }
    throw error;
  }

  const oldPrice = Number(before.price);
  const newPrice = Number(parsed.data.price);
  if (oldPrice !== newPrice) {
    await prisma.priceHistory.create({ data: { productId: id, price: newPrice } });

    if (newPrice < oldPrice) {
      const favorites = await prisma.favorite.findMany({ where: { productId: id }, select: { userId: true } });
      for (const fav of favorites) {
        await createNotification({
          userId: fav.userId,
          title: "Sản phẩm yêu thích vừa giảm giá",
          message: `"${parsed.data.name}" giảm từ ${formatVND(oldPrice)} xuống còn ${formatVND(newPrice)}.`,
          type: "PRICE_DROP",
          link: `/products/${id}`,
        });
      }
    }
  }

  res.json({ success: true });
});

// DELETE /api/admin/products/:id – không xóa được sản phẩm đã có trong đơn
adminRouter.delete("/products/:id", async (req, res) => {
  const ordered = await prisma.orderItem.count({ where: { productId: req.params.id } });
  if (ordered > 0) {
    res.status(400).json({
      success: false,
      error: "Sản phẩm đã có trong đơn hàng nên không thể xóa. Hãy đặt tồn kho về 0 để ngừng bán.",
    });
    return;
  }
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// POST /api/admin/upload – tải ảnh sản phẩm (JPG/PNG/WEBP ≤ 5MB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });

function singleImage(req: Request, res: Response, next: NextFunction) {
  upload.single("file")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      res.status(400).json({ error: error.code === "LIMIT_FILE_SIZE" ? "Ảnh phải nhỏ hơn 5MB" : "Dữ liệu tải lên không hợp lệ" });
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
}

adminRouter.post("/upload", singleImage, async (req, res) => {
  const file = req.file;
  if (!file || file.size === 0) {
    res.status(400).json({ error: "Chưa chọn ảnh" });
    return;
  }

  // Nhận diện theo chữ ký đầu file, không tin phần mở rộng hay MIME do trình duyệt gửi
  const ext = detectImageType(new Uint8Array(file.buffer));
  if (!ext) {
    res.status(400).json({ error: "Chỉ nhận ảnh JPG, PNG hoặc WEBP" });
    return;
  }

  const name = newUploadName(ext);
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  res.json({ url: `${UPLOAD_URL_PREFIX}${name}` });
});

// ───────────── Danh mục ─────────────

function toSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^0-9a-z-\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/admin/categories
adminRouter.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } } },
  });
  res.json(categories);
});

// POST /api/admin/categories { name }
adminRouter.post("/categories", async (req, res) => {
  const name = str(req.body, "name");
  if (!name) {
    res.status(400).json({ error: "Tên danh mục không được để trống" });
    return;
  }
  try {
    await prisma.category.create({ data: { name, slug: toSlug(name) } });
    res.status(201).json({ success: true });
  } catch (error) {
    if (isUniqueError(error)) {
      res.status(400).json({ error: "Tên danh mục hoặc slug đã tồn tại" });
      return;
    }
    throw error;
  }
});

// PUT /api/admin/categories/:id { name } – giữ nguyên slug để không hỏng các link đã chia sẻ
adminRouter.put("/categories/:id", async (req, res) => {
  const name = str(req.body, "name");
  if (!name) {
    res.status(400).json({ error: "Tên danh mục không được để trống" });
    return;
  }
  try {
    await prisma.category.update({ where: { id: req.params.id }, data: { name } });
    res.json({ success: true });
  } catch (error) {
    if (isUniqueError(error)) {
      res.status(400).json({ error: "Tên danh mục đã tồn tại" });
      return;
    }
    throw error;
  }
});

// DELETE /api/admin/categories/:id – sản phẩm thuộc danh mục chuyển về "Chưa phân loại"
adminRouter.delete("/categories/:id", async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// POST /api/admin/categories/seed – tạo 5 danh mục mặc định
adminRouter.post("/categories/seed", async (_req, res) => {
  const defaults = [
    { name: "Laptop Gaming", slug: "gaming" },
    { name: "Laptop Văn phòng - Học tập", slug: "van-phong" },
    { name: "Laptop Đồ họa - Kỹ thuật", slug: "do-hoa" },
    { name: "Laptop Mỏng nhẹ", slug: "mong-nhe" },
    { name: "Laptop Doanh nhân", slug: "doanh-nhan" },
  ];
  for (const cat of defaults) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  res.json({ success: true });
});

// ───────────── Khách hàng ─────────────

// GET /api/admin/users
adminRouter.get("/users", async (_req, res) => {
  const [users, spending] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        points: true,
        rank: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.order.groupBy({ by: ["userId"], where: { status: "COMPLETED" }, _sum: { totalPayment: true } }),
  ]);
  const spentBy = new Map(spending.map((s) => [s.userId, Number(s._sum.totalPayment ?? 0)]));
  res.json({
    users: users.map((u) => ({ ...u, spent: spentBy.get(u.id) ?? 0 })),
    buyers: spending.length,
  });
});

// ───────────── Đánh giá ─────────────

// GET /api/admin/reviews
adminRouter.get("/reviews", async (_req, res) => {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, id: true } },
      user: { select: { name: true, email: true } },
      _count: { select: { replies: true } },
    },
  });
  res.json(reviews);
});

// DELETE /api/admin/reviews/:id
adminRouter.delete("/reviews/:id", async (req, res) => {
  await prisma.review.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// POST /api/admin/reviews/:id/reply { content } – cửa hàng phản hồi đánh giá
adminRouter.post("/reviews/:id/reply", async (req, res) => {
  const content = str(req.body, "content");
  if (!content) {
    res.status(400).json({ success: false, error: "Nội dung phản hồi không được để trống" });
    return;
  }
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) {
    res.status(404).json({ success: false, error: "Đánh giá không tồn tại" });
    return;
  }
  const reply = await prisma.reviewReply.create({
    data: { reviewId: review.id, userId: req.user!.id, content: content.slice(0, 2000) },
    include: { user: { select: { name: true, role: true } } },
  });
  res.status(201).json({ success: true, reply });
});

// ───────────── Góp ý ─────────────

const FEEDBACK_STATUSES = ["NEW", "PROCESSING", "RESOLVED"] as const;

// GET /api/admin/feedback?status=
adminRouter.get("/feedback", async (req, res) => {
  const statusParam = String(req.query.status ?? "");
  const status = FEEDBACK_STATUSES.includes(statusParam as FeedbackStatus) ? (statusParam as FeedbackStatus) : undefined;
  const [feedbacks, counts] = await Promise.all([
    prisma.feedback.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" } }),
    prisma.feedback.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  res.json({ feedbacks, counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])) });
});

// PATCH /api/admin/feedback/:id { status, adminNote }
adminRouter.patch("/feedback/:id", async (req, res) => {
  const status = String(req.body?.status ?? "");
  if (!FEEDBACK_STATUSES.includes(status as FeedbackStatus)) {
    res.status(400).json({ success: false, error: "Trạng thái không hợp lệ" });
    return;
  }
  await prisma.feedback.update({
    where: { id: req.params.id },
    data: { status: status as FeedbackStatus, adminNote: str(req.body, "adminNote")?.slice(0, 2000) ?? null },
  });
  res.json({ success: true });
});

// ───────────── Mã giảm giá ─────────────

// GET /api/admin/vouchers
adminRouter.get("/vouchers", async (_req, res) => {
  const vouchers = await prisma.voucher.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } } },
  });
  res.json(vouchers);
});

// POST /api/admin/vouchers
adminRouter.post("/vouchers", async (req, res) => {
  const body = req.body ?? {};
  const code = str(body, "code")?.toUpperCase();
  const discountType = body.discountType === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE";
  const discountValue = Number(body.discountValue);
  const minRanks = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

  if (!code || !/^[A-Z0-9_-]{3,30}$/.test(code)) {
    res.status(400).json({ success: false, error: "Mã giảm giá chỉ gồm chữ, số, - hoặc _ (3–30 ký tự)" });
    return;
  }
  if (!(discountValue > 0) || (discountType === "PERCENTAGE" && discountValue > 100)) {
    res.status(400).json({ success: false, error: "Giá trị giảm không hợp lệ" });
    return;
  }

  // Ô bỏ trống = không áp điều kiện; đã nhập thì không được âm
  const optionalNumber = (value: unknown) => (value === undefined || value === null || value === "" ? null : Number(value));
  const minOrderAmount = optionalNumber(body.minOrderAmount);
  const maxDiscount = optionalNumber(body.maxDiscount);
  const usageLimit = optionalNumber(body.usageLimit);
  if (minOrderAmount !== null && !(minOrderAmount >= 0)) {
    res.status(400).json({ success: false, error: "Đơn tối thiểu không được âm" });
    return;
  }
  if (maxDiscount !== null && !(maxDiscount > 0)) {
    res.status(400).json({ success: false, error: "Mức giảm tối đa phải lớn hơn 0" });
    return;
  }
  if (usageLimit !== null && !(Number.isInteger(usageLimit) && usageLimit >= 1)) {
    res.status(400).json({ success: false, error: "Lượt sử dụng tối đa phải là số nguyên từ 1 trở lên" });
    return;
  }
  const expiryDate = body.expiryDate ? new Date(String(body.expiryDate)) : null;
  if (expiryDate && Number.isNaN(expiryDate.getTime())) {
    res.status(400).json({ success: false, error: "Ngày hết hạn không hợp lệ" });
    return;
  }

  try {
    const voucher = await prisma.voucher.create({
      data: {
        code,
        description: str(body, "description"),
        discountType,
        discountValue,
        minOrderAmount: minOrderAmount ?? 0,
        maxDiscount,
        usageLimit: usageLimit ?? 100,
        expiryDate,
        minRank: minRanks.includes(body.minRank) ? body.minRank : "BRONZE",
      },
    });
    res.status(201).json({ success: true, voucher });
  } catch (error) {
    if (isUniqueError(error)) {
      res.status(400).json({ success: false, error: "Mã giảm giá đã tồn tại" });
      return;
    }
    throw error;
  }
});

// PATCH /api/admin/vouchers/:id { isActive }
adminRouter.patch("/vouchers/:id", async (req, res) => {
  await prisma.voucher.update({ where: { id: req.params.id }, data: { isActive: req.body?.isActive === true } });
  res.json({ success: true });
});

// DELETE /api/admin/vouchers/:id – mã đã dùng trong đơn thì chỉ được tắt
adminRouter.delete("/vouchers/:id", async (req, res) => {
  const used = await prisma.order.count({ where: { voucherId: req.params.id } });
  if (used > 0) {
    res.status(400).json({ success: false, error: "Mã đã được dùng trong đơn hàng, hãy tắt kích hoạt thay vì xóa" });
    return;
  }
  await prisma.voucher.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});
