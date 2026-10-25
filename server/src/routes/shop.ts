import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { computeVoucherDiscount } from "../lib/voucher-calc";
import { createNotification } from "../lib/notify";
import { shortOrderId } from "../../../shared/format";
import { MAX_QTY_PER_ITEM } from "../../../shared/site";
import { PHONE_ERROR, isValidPhone, normalizePhone } from "../../../shared/validate";

export const shopRouter = Router();

const PAYMENT_METHODS = ["COD", "VNPAY", "MOMO"] as const;

// Lỗi khi tạo đơn (hết hàng, hết lượt voucher) – báo nguyên văn cho khách
class CheckoutError extends Error {}

// GET /api/vouchers/active – mã giảm giá đang hiệu lực (trang chủ, checkout)
shopRouter.get("/vouchers/active", async (_req, res) => {
  const vouchers = await prisma.voucher.findMany({
    where: { isActive: true, OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] },
    include: { products: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(vouchers);
});

// POST /api/vouchers/validate – kiểm tra voucher cho giỏ hàng; giá luôn lấy từ CSDL
shopRouter.post("/vouchers/validate", async (req, res) => {
  const code = String(req.body?.code || "").trim().toUpperCase();
  const cartItems: unknown[] = Array.isArray(req.body?.items) ? req.body.items : [];

  const voucher = code
    ? await prisma.voucher.findUnique({ where: { code }, include: { products: { select: { id: true } } } })
    : null;
  if (!voucher) {
    res.json({ success: false, error: "voucher.notFound" });
    return;
  }

  const requested = cartItems
    .map((i) => i as { id?: unknown; quantity?: unknown })
    .filter((i): i is { id: string; quantity: unknown } => typeof i.id === "string");
  const products = await prisma.product.findMany({
    where: { id: { in: requested.map((i) => i.id) } },
    select: { id: true, price: true },
  });
  const items = requested.flatMap((i) => {
    const product = products.find((p) => p.id === i.id);
    const quantity = Math.min(MAX_QTY_PER_ITEM, Math.max(1, Math.floor(Number(i.quantity) || 1)));
    return product ? [{ id: i.id, price: Number(product.price), quantity }] : [];
  });

  const user = req.user ? await prisma.user.findUnique({ where: { id: req.user.id }, select: { rank: true } }) : null;
  const result = computeVoucherDiscount(voucher, items, user?.rank);
  if (!result.ok) {
    res.json({ success: false, error: result.error, params: result.params });
    return;
  }

  res.json({
    success: true,
    voucherId: voucher.id,
    code: voucher.code,
    discountAmount: result.discount,
    description: voucher.description,
  });
});

// POST /api/checkout – đặt hàng
shopRouter.post("/checkout", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { items, paymentMethod, voucherCode, shippingInfo, note } = req.body ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Giỏ hàng trống" });
    return;
  }

  const method = PAYMENT_METHODS.includes(paymentMethod) ? (paymentMethod as (typeof PAYMENT_METHODS)[number]) : "COD";

  const name = String(shippingInfo?.name || "").trim();
  const phone = String(shippingInfo?.phone || "").trim();
  const address = String(shippingInfo?.address || "").trim();
  if (!name || !phone || !address) {
    res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin nhận hàng" });
    return;
  }
  if (!isValidPhone(phone)) {
    res.status(400).json({ error: PHONE_ERROR });
    return;
  }

  // 1. Chỉ tin id + số lượng từ client, giá và tồn kho lấy từ CSDL
  const requested = new Map<string, number>();
  for (const item of items) {
    const qty = Number(item?.quantity);
    if (typeof item?.id !== "string" || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
      res.status(400).json({ error: `Số lượng mỗi sản phẩm phải từ 1 đến ${MAX_QTY_PER_ITEM} máy` });
      return;
    }
    requested.set(item.id, (requested.get(item.id) || 0) + qty);
  }

  const products = await prisma.product.findMany({ where: { id: { in: [...requested.keys()] } } });

  const lines: { id: string; name: string; price: number; quantity: number }[] = [];
  for (const [id, quantity] of requested) {
    const product = products.find((p) => p.id === id);
    if (!product) {
      res.status(400).json({ error: "Có sản phẩm không còn tồn tại, vui lòng kiểm tra lại giỏ hàng" });
      return;
    }
    if (product.stockQuantity < quantity) {
      res.status(400).json({ error: `"${product.name}" chỉ còn ${product.stockQuantity} sản phẩm` });
      return;
    }
    lines.push({ id, name: product.name, price: Number(product.price), quantity });
  }

  const subTotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  // 2. Voucher
  let discountAmount = 0;
  let voucherId: string | null = null;
  if (voucherCode) {
    const voucher = await prisma.voucher.findUnique({
      where: { code: String(voucherCode).toUpperCase() },
      include: { products: { select: { id: true } } },
    });
    if (!voucher) {
      res.status(400).json({ error: "Mã giảm giá không tồn tại" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { rank: true } });
    const result = computeVoucherDiscount(voucher, lines, user?.rank);
    if (!result.ok) {
      res.status(400).json({ error: "Mã giảm giá không áp dụng được cho đơn hàng này" });
      return;
    }
    discountAmount = result.discount;
    voucherId = voucher.id;
  }

  const totalPayment = subTotal - discountAmount;

  // 3. Tạo đơn trong transaction, trừ kho có điều kiện để tránh bán vượt tồn kho
  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const updated = await tx.product.updateMany({
          where: { id: line.id, stockQuantity: { gte: line.quantity } },
          data: { stockQuantity: { decrement: line.quantity } },
        });
        if (updated.count === 0) throw new CheckoutError(`"${line.name}" vừa hết hàng, vui lòng thử lại`);
      }

      if (voucherId) {
        const used = await tx.voucher.updateMany({
          where: { id: voucherId, usedCount: { lt: prisma.voucher.fields.usageLimit } },
          data: { usedCount: { increment: 1 } },
        });
        if (used.count === 0) throw new CheckoutError("Mã giảm giá đã hết lượt sử dụng");
      }

      const created = await tx.order.create({
        data: {
          userId,
          subTotal,
          discountAmount,
          totalPayment,
          paymentMethod: method,
          // Cổng VNPAY/MoMo đang ở chế độ mô phỏng: coi như thanh toán thành công
          paymentStatus: method === "COD" ? "PENDING" : "PAID",
          voucherId,
          shippingName: name,
          shippingPhone: normalizePhone(phone),
          shippingAddress: address,
          note: note ? String(note).slice(0, 500) : null,
          items: {
            create: lines.map((l) => ({ productId: l.id, quantity: l.quantity, priceAtPurchase: l.price })),
          },
        },
      });

      await createNotification(
        {
          userId,
          title: "Đặt hàng thành công",
          message: `Đơn hàng #${shortOrderId(created.id)} đã được ghi nhận và đang chờ cửa hàng xác nhận.`,
          type: "ORDER",
          link: "/buyer/orders",
        },
        tx
      );

      return created;
    });

    res.json({ message: "Đặt hàng thành công", orderId: order.id });
  } catch (error) {
    if (error instanceof CheckoutError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Đã có lỗi xảy ra khi thanh toán" });
  }
});
