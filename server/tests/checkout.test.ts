import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, CUSTOMER, type PrismaMock } from "./helpers";

vi.mock("../src/lib/prisma", async () => ({ prisma: (await import("./helpers")).createPrismaMock() }));

import { prisma as realPrisma } from "../src/lib/prisma";

const prisma = realPrisma as unknown as PrismaMock;
const SHIPPING = { name: "Nguyễn Văn A", phone: "0987654321", address: "Hà Nội" };

const laptop = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  name: "ASUS Vivobook 15",
  price: 15000000,
  stockQuantity: 5,
  ...overrides,
});

const voucher = (overrides: Record<string, unknown> = {}) => ({
  id: "v1",
  isActive: true,
  expiryDate: null,
  usedCount: 0,
  usageLimit: 10,
  minOrderAmount: 10000000,
  maxDiscount: null,
  discountType: "FIXED_AMOUNT",
  discountValue: 500000,
  minRank: "BRONZE",
  products: [],
  ...overrides,
});

async function checkout(body: unknown, cookie = CUSTOMER) {
  return (await api()).post("/api/checkout").set("Cookie", cookie).send(body as object);
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.product.updateMany.mockResolvedValue({ count: 1 });
    prisma.voucher.updateMany.mockResolvedValue({ count: 1 });
    prisma.order.create.mockResolvedValue({ id: "order-123" });
  });

  it("chưa đăng nhập thì trả 401", async () => {
    const res = await (await api()).post("/api/checkout").send({ items: [{ id: "p1", quantity: 1 }], shippingInfo: SHIPPING });
    expect(res.status).toBe(401);
  });

  it("giỏ hàng trống thì trả 400", async () => {
    const res = await checkout({ items: [], shippingInfo: SHIPPING });
    expect(res.status).toBe(400);
  });

  it("số điện thoại nhận hàng không bắt đầu bằng 0 bị từ chối", async () => {
    const res = await checkout({ items: [{ id: "p1", quantity: 1 }], shippingInfo: { ...SHIPPING, phone: "84987654321" } });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("bắt đầu bằng số 0");
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("thiếu thông tin nhận hàng thì trả 400", async () => {
    const res = await checkout({ items: [{ id: "p1", quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("thông tin nhận hàng");
  });

  it("từ chối số lượng không hợp lệ", async () => {
    for (const quantity of [0, -1, 1.5, 99]) {
      const res = await checkout({ items: [{ id: "p1", quantity }], shippingInfo: SHIPPING });
      expect(res.status).toBe(400);
    }
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("sản phẩm không tồn tại thì trả 400", async () => {
    prisma.product.findMany.mockResolvedValue([]);
    const res = await checkout({ items: [{ id: "ghost", quantity: 1 }], shippingInfo: SHIPPING });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("không còn tồn tại");
  });

  it("không đủ tồn kho thì trả 400", async () => {
    prisma.product.findMany.mockResolvedValue([laptop({ stockQuantity: 1 })]);
    const res = await checkout({ items: [{ id: "p1", quantity: 2 }], shippingInfo: SHIPPING });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("chỉ còn 1");
  });

  it("dùng giá trong CSDL, bỏ qua giá client gửi lên, trừ kho có điều kiện", async () => {
    prisma.product.findMany.mockResolvedValue([laptop()]);
    const res = await checkout({ items: [{ id: "p1", quantity: 2, price: 1 }], paymentMethod: "COD", shippingInfo: SHIPPING });

    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe("order-123");
    const created = prisma.order.create.mock.calls[0][0].data;
    expect(created.userId).toBe("user1");
    expect(created.subTotal).toBe(30000000);
    expect(created.totalPayment).toBe(30000000);
    expect(created.paymentStatus).toBe("PENDING");
    expect(created.items.create[0]).toEqual({ productId: "p1", quantity: 2, priceAtPurchase: 15000000 });
    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: "p1", stockQuantity: { gte: 2 } },
      data: { stockQuantity: { decrement: 2 } },
    });
  });

  it("áp dụng voucher hợp lệ", async () => {
    prisma.product.findMany.mockResolvedValue([laptop()]);
    prisma.user.findUnique.mockResolvedValue({ rank: "BRONZE" });
    prisma.voucher.findUnique.mockResolvedValue(voucher());

    const res = await checkout({
      items: [{ id: "p1", quantity: 1 }],
      paymentMethod: "VNPAY",
      voucherCode: "laptop500k",
      shippingInfo: SHIPPING,
    });

    expect(res.status).toBe(200);
    const created = prisma.order.create.mock.calls[0][0].data;
    expect(created.discountAmount).toBe(500000);
    expect(created.totalPayment).toBe(14500000);
    expect(created.paymentStatus).toBe("PAID");
    expect(prisma.voucher.updateMany).toHaveBeenCalled();
  });

  it("từ chối voucher không đủ hạng thành viên", async () => {
    prisma.product.findMany.mockResolvedValue([laptop({ price: 30000000 })]);
    prisma.user.findUnique.mockResolvedValue({ rank: "BRONZE" });
    prisma.voucher.findUnique.mockResolvedValue(voucher({ minRank: "GOLD", minOrderAmount: 0 }));

    const res = await checkout({ items: [{ id: "p1", quantity: 1 }], voucherCode: "VIPGOLD10", shippingInfo: SHIPPING });
    expect(res.status).toBe(400);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it("hàng vừa bị người khác mua hết trong lúc đặt thì báo lỗi rõ ràng", async () => {
    prisma.product.findMany.mockResolvedValue([laptop()]);
    prisma.product.updateMany.mockResolvedValue({ count: 0 });

    const res = await checkout({ items: [{ id: "p1", quantity: 1 }], shippingInfo: SHIPPING });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("vừa hết hàng");
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it("voucher hết lượt trong lúc đặt thì không tạo đơn", async () => {
    prisma.product.findMany.mockResolvedValue([laptop()]);
    prisma.user.findUnique.mockResolvedValue({ rank: "BRONZE" });
    prisma.voucher.findUnique.mockResolvedValue(voucher());
    prisma.voucher.updateMany.mockResolvedValue({ count: 0 });

    const res = await checkout({ items: [{ id: "p1", quantity: 1 }], voucherCode: "LAPTOP500K", shippingInfo: SHIPPING });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Mã giảm giá đã hết lượt sử dụng");
  });
});

describe("POST /api/vouchers/validate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mã không tồn tại", async () => {
    prisma.voucher.findUnique.mockResolvedValue(null);
    const res = await (await api()).post("/api/vouchers/validate").send({ code: "XYZ", items: [] });
    expect(res.body).toEqual({ success: false, error: "voucher.notFound" });
  });

  it("tính tiền giảm theo giá CSDL", async () => {
    prisma.voucher.findUnique.mockResolvedValue(voucher());
    prisma.product.findMany.mockResolvedValue([{ id: "p1", price: 15000000 }]);
    const res = await (await api())
      .post("/api/vouchers/validate")
      .send({ code: "laptop500k", items: [{ id: "p1", quantity: 1, price: 1 }] });
    expect(res.body).toMatchObject({ success: true, discountAmount: 500000 });
  });
});
