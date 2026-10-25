import { Router } from "express";
import { prisma } from "../lib/prisma";
import { str } from "../lib/http";
import { shortOrderId } from "../../../shared/format";
import { PHONE_ERROR, isValidPhone, normalizePhone } from "../../../shared/validate";

// Dịch vụ khách hàng – không cần đăng nhập
export const serviceRouter = Router();

const NOT_FOUND = "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại đặt hàng.";

// So khớp số điện thoại theo 9 chữ số cuối để "0987..." và "+84987..." được coi là một
export function phoneKey(phone: string) {
  return phone.replace(/\D/g, "").slice(-9);
}

async function findOrderByCodeAndPhone(code: string, phone: string) {
  const orderCode = code.trim().replace(/^#/, "").toLowerCase();
  const key = phoneKey(phone);
  if (orderCode.length < 8 || key.length < 9) return null;

  const candidates = await prisma.order.findMany({
    where: { id: { startsWith: orderCode } },
    include: {
      items: { include: { product: { select: { id: true, name: true, sku: true, warrantyMonths: true } } } },
    },
    take: 5,
  });

  // Bắt buộc khớp số điện thoại nhận hàng để người khác không xem được đơn
  return candidates.find((o) => o.shippingPhone && phoneKey(o.shippingPhone) === key) ?? null;
}

// POST /api/service/order-lookup { code, phone }
serviceRouter.post("/service/order-lookup", async (req, res) => {
  if (!isValidPhone(String(req.body?.phone ?? ""))) {
    res.json({ success: false, error: PHONE_ERROR });
    return;
  }
  const order = await findOrderByCodeAndPhone(String(req.body?.code ?? ""), String(req.body?.phone ?? ""));
  if (!order) {
    res.json({ success: false, error: NOT_FOUND });
    return;
  }

  res.json({
    success: true,
    order: {
      code: shortOrderId(order.id),
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      trackingCode: order.trackingCode,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingName: order.shippingName,
      shippingAddress: order.shippingAddress,
      subTotal: Number(order.subTotal),
      discountAmount: Number(order.discountAmount),
      totalPayment: Number(order.totalPayment),
      items: order.items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        price: Number(i.priceAtPurchase),
      })),
    },
  });
});

// POST /api/service/warranty-lookup { code, phone }
serviceRouter.post("/service/warranty-lookup", async (req, res) => {
  if (!isValidPhone(String(req.body?.phone ?? ""))) {
    res.json({ success: false, error: PHONE_ERROR });
    return;
  }
  const order = await findOrderByCodeAndPhone(String(req.body?.code ?? ""), String(req.body?.phone ?? ""));
  if (!order) {
    res.json({ success: false, error: NOT_FOUND });
    return;
  }

  // Bảo hành tính từ ngày đơn hoàn tất (lần cập nhật cuối của đơn COMPLETED)
  const start = order.status === "COMPLETED" ? order.updatedAt : null;

  res.json({
    success: true,
    code: shortOrderId(order.id),
    orderStatus: order.status,
    items: order.items.map((i) => {
      let end: Date | null = null;
      if (start) {
        end = new Date(start);
        end.setMonth(end.getMonth() + i.product.warrantyMonths);
      }
      return {
        name: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        warrantyMonths: i.product.warrantyMonths,
        startDate: start?.toISOString() ?? null,
        endDate: end?.toISOString() ?? null,
        state: !start || !end ? "NOT_ACTIVATED" : end >= new Date() ? "ACTIVE" : "EXPIRED",
      };
    }),
  });
});

const FEEDBACK_TYPES = ["SUGGESTION", "COMPLAINT", "WARRANTY"] as const;
type FeedbackType = (typeof FEEDBACK_TYPES)[number];

// POST /api/feedback – góp ý, khiếu nại
serviceRouter.post("/feedback", async (req, res) => {
  const name = str(req.body, "name");
  const phone = str(req.body, "phone");
  const email = str(req.body, "email");
  const orderCode = str(req.body, "orderCode")?.replace(/^#/, "").toUpperCase() ?? null;
  const typeRaw = str(req.body, "type");
  const content = str(req.body, "content");

  if (!name || !phone || !content) {
    res.status(400).json({ success: false, error: "Vui lòng nhập họ tên, số điện thoại và nội dung" });
    return;
  }
  if (!isValidPhone(phone)) {
    res.status(400).json({ success: false, error: PHONE_ERROR });
    return;
  }
  if (content.length < 10) {
    res.status(400).json({ success: false, error: "Nội dung cần ít nhất 10 ký tự" });
    return;
  }

  const type: FeedbackType = FEEDBACK_TYPES.includes(typeRaw as FeedbackType) ? (typeRaw as FeedbackType) : "SUGGESTION";

  await prisma.feedback.create({
    data: {
      userId: req.user?.id ?? null,
      name: name.slice(0, 100),
      phone: normalizePhone(phone),
      email: email?.slice(0, 120) ?? null,
      orderCode: orderCode?.slice(0, 20) ?? null,
      type,
      content: content.slice(0, 2000),
    },
  });
  res.status(201).json({ success: true });
});
