import { Router, type Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { str } from "../lib/http";
import { PHONE_ERROR, isValidPhone, normalizePhone } from "../../../shared/validate";
import { OrderError, customerCancelOrder, customerConfirmReceived } from "../lib/orders";

// Các API cần đăng nhập; mọi truy vấn đều lọc theo req.user.id, không nhận userId từ client
export const accountRouter = Router();
accountRouter.use(
  ["/orders", "/reviews", "/favorites", "/notes", "/notifications", "/account", "/addresses"],
  requireAuth
);

function sendOrderError(res: Response, error: unknown) {
  if (error instanceof OrderError) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }
  throw error;
}

// ───────────── Đơn hàng ─────────────

// GET /api/orders – đơn hàng của tôi
accountRouter.get("/orders", async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: {
      items: { include: { product: { select: { id: true, name: true, brand: true, imageUrl: true } } } },
      reviews: { select: { productId: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// GET /api/orders/:id – chi tiết đơn (trang đặt hàng thành công, hóa đơn). Chủ đơn hoặc admin mới xem được
accountRouter.get("/orders/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true, sku: true, warrantyMonths: true } } } },
      voucher: { select: { code: true } },
    },
  });
  if (!order || (req.user!.role !== "ADMIN" && order.userId !== req.user!.id)) {
    res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    return;
  }
  res.json(order);
});

// POST /api/orders/:id/cancel – khách hủy đơn khi cửa hàng chưa đóng gói
accountRouter.post("/orders/:id/cancel", async (req, res) => {
  try {
    await customerCancelOrder(req.user!.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    sendOrderError(res, error);
  }
});

// POST /api/orders/:id/confirm – khách xác nhận đã nhận hàng
accountRouter.post("/orders/:id/confirm", async (req, res) => {
  try {
    await customerConfirmReceived(req.user!.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    sendOrderError(res, error);
  }
});

// POST /api/reviews – đánh giá sản phẩm trong đơn đã hoàn tất
accountRouter.post("/reviews", async (req, res) => {
  const userId = req.user!.id;
  const orderId = str(req.body, "orderId") || "";
  const productId = str(req.body, "productId") || "";
  const stars = Math.round(Number(req.body?.rating));
  const comment = str(req.body, "comment");

  if (!(stars >= 1 && stars <= 5)) {
    res.status(400).json({ success: false, error: "Số sao không hợp lệ" });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { select: { productId: true } } },
  });
  if (!order || order.userId !== userId) {
    res.status(400).json({ success: false, error: "Đơn hàng không tồn tại" });
    return;
  }
  if (order.status !== "COMPLETED") {
    res.status(400).json({ success: false, error: "Chỉ có thể đánh giá sau khi đã nhận hàng thành công." });
    return;
  }
  if (!order.items.some((i) => i.productId === productId)) {
    res.status(400).json({ success: false, error: "Sản phẩm không thuộc đơn hàng này" });
    return;
  }

  const existing = await prisma.review.findUnique({ where: { orderId_productId: { orderId, productId } } });
  if (existing) {
    res.status(400).json({ success: false, error: "Bạn đã đánh giá sản phẩm này rồi." });
    return;
  }

  await prisma.review.create({
    data: { orderId, productId, userId, rating: stars, comment: comment?.slice(0, 2000) ?? null },
  });
  res.json({ success: true });
});

// ───────────── Yêu thích & ghi chú ─────────────

// GET /api/favorites
accountRouter.get("/favorites", async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    include: { product: { include: { reviews: { select: { rating: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(favorites.map((f) => f.product));
});

// POST /api/favorites/:productId/toggle
accountRouter.post("/favorites/:productId/toggle", async (req, res) => {
  const userId = req.user!.id;
  const { productId } = req.params;

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    res.status(404).json({ success: false, error: "Sản phẩm không tồn tại" });
    return;
  }

  const existing = await prisma.favorite.findUnique({ where: { userId_productId: { userId, productId } } });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId, productId } });
  }
  res.json({ success: true, isFavorite: !existing });
});

// PUT /api/notes/:productId – ghi chú riêng cho sản phẩm (để trống = xóa)
accountRouter.put("/notes/:productId", async (req, res) => {
  const userId = req.user!.id;
  const { productId } = req.params;
  const content = String(req.body?.content ?? "").slice(0, 2000);

  if (!content.trim()) {
    await prisma.privateNote.deleteMany({ where: { userId, productId } });
  } else {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      res.status(404).json({ success: false, error: "Sản phẩm không tồn tại" });
      return;
    }
    await prisma.privateNote.upsert({
      where: { userId_productId: { userId, productId } },
      update: { content },
      create: { userId, productId, content },
    });
  }
  res.json({ success: true });
});

// ───────────── Thông báo ─────────────

// GET /api/notifications
accountRouter.get("/notifications", async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(notifications);
});

// GET /api/notifications/unread-count
accountRouter.get("/notifications/unread-count", async (req, res) => {
  const count = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });
  res.json({ count });
});

// POST /api/notifications/read-all
accountRouter.post("/notifications/read-all", async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
  res.json({ success: true });
});

// POST /api/notifications/:id/read
accountRouter.post("/notifications/:id/read", async (req, res) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: { isRead: true } });
  res.json({ success: true });
});

// ───────────── Hồ sơ ─────────────

// GET /api/account/profile
accountRouter.get("/account/profile", async (req, res) => {
  const profile = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { name: true, email: true, phoneNumber: true, address: true, points: true, rank: true },
  });
  res.json(profile);
});

// PUT /api/account/profile
accountRouter.put("/account/profile", async (req, res) => {
  const name = str(req.body, "name");
  if (!name) {
    res.status(400).json({ success: false, error: "Tên không được để trống" });
    return;
  }
  const phoneNumber = str(req.body, "phoneNumber");
  if (phoneNumber && !isValidPhone(phoneNumber)) {
    res.status(400).json({ success: false, error: PHONE_ERROR });
    return;
  }
  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      name: name.slice(0, 100),
      phoneNumber: phoneNumber ? normalizePhone(phoneNumber) : null,
      address: str(req.body, "address")?.slice(0, 300) ?? null,
    },
  });
  res.json({ success: true });
});

// ───────────── Sổ địa chỉ ─────────────

function readAddress(body: Record<string, unknown> | undefined) {
  const name = str(body, "name");
  const phone = str(body, "phone");
  const address = str(body, "address");
  if (!name || !phone || !address) return { error: "Vui lòng nhập đủ tên, số điện thoại và địa chỉ" };
  if (!isValidPhone(phone)) return { error: PHONE_ERROR };
  return {
    data: {
      title: str(body, "title")?.slice(0, 50) ?? null,
      name: name.slice(0, 100),
      phone: normalizePhone(phone),
      address: address.slice(0, 300),
      isDefault: body?.isDefault === true,
    },
  };
}

// GET /api/addresses
accountRouter.get("/addresses", async (req, res) => {
  const addresses = await prisma.userAddress.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(addresses);
});

// POST /api/addresses
accountRouter.post("/addresses", async (req, res) => {
  const userId = req.user!.id;
  const parsed = readAddress(req.body);
  if ("error" in parsed) {
    res.status(400).json({ success: false, error: parsed.error });
    return;
  }
  const data = parsed.data;

  // Địa chỉ đầu tiên luôn là mặc định
  const count = await prisma.userAddress.count({ where: { userId } });
  const isDefault = count === 0 || data.isDefault;

  const created = await prisma.$transaction(async (tx) => {
    if (isDefault) await tx.userAddress.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    return tx.userAddress.create({ data: { ...data, userId, isDefault } });
  });
  res.status(201).json({ success: true, data: created });
});

// PUT /api/addresses/:id
accountRouter.put("/addresses/:id", async (req, res) => {
  const userId = req.user!.id;
  const parsed = readAddress(req.body);
  if ("error" in parsed) {
    res.status(400).json({ success: false, error: parsed.error });
    return;
  }
  const data = parsed.data;

  const owned = await prisma.userAddress.findFirst({ where: { id: req.params.id, userId } });
  if (!owned) {
    res.status(404).json({ success: false, error: "Không tìm thấy địa chỉ" });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (data.isDefault) await tx.userAddress.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    // Không cho bỏ mặc định của địa chỉ đang là mặc định (luôn phải có một địa chỉ mặc định)
    return tx.userAddress.update({ where: { id: owned.id }, data: { ...data, isDefault: data.isDefault || owned.isDefault } });
  });
  res.json({ success: true, data: updated });
});

// DELETE /api/addresses/:id
accountRouter.delete("/addresses/:id", async (req, res) => {
  const userId = req.user!.id;
  const address = await prisma.userAddress.findFirst({ where: { id: req.params.id, userId } });
  if (!address) {
    res.status(404).json({ success: false, error: "Không tìm thấy địa chỉ" });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.userAddress.delete({ where: { id: address.id } });
    // Xóa địa chỉ mặc định thì chọn địa chỉ khác làm mặc định
    if (address.isDefault) {
      const next = await tx.userAddress.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
      if (next) await tx.userAddress.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  res.json({ success: true });
});

// POST /api/addresses/:id/default
accountRouter.post("/addresses/:id/default", async (req, res) => {
  const userId = req.user!.id;
  const address = await prisma.userAddress.findFirst({ where: { id: req.params.id, userId } });
  if (!address) {
    res.status(404).json({ success: false, error: "Không tìm thấy địa chỉ" });
    return;
  }
  await prisma.$transaction([
    prisma.userAddress.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
    prisma.userAddress.update({ where: { id: address.id }, data: { isDefault: true } }),
  ]);
  res.json({ success: true });
});
