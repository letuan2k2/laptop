import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, type PrismaMock } from "./helpers";

vi.mock("../src/lib/prisma", async () => ({ prisma: (await import("./helpers")).createPrismaMock() }));

import { prisma as realPrisma } from "../src/lib/prisma";
import { phoneKey } from "../src/routes/service";

const prisma = realPrisma as unknown as PrismaMock;

const order = (overrides: Record<string, unknown> = {}) => ({
  id: "a1b2c3d4-0000-0000-0000-000000000000",
  status: "COMPLETED",
  paymentMethod: "COD",
  paymentStatus: "PAID",
  trackingCode: "GHN123",
  shippingName: "Nguyễn Văn A",
  shippingPhone: "0987 654 321",
  shippingAddress: "Hà Nội",
  subTotal: 20000000,
  discountAmount: 0,
  totalPayment: 20000000,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date(),
  items: [{ quantity: 1, priceAtPurchase: 20000000, product: { id: "p1", name: "Laptop A", sku: "ASU-001", warrantyMonths: 24 } }],
  ...overrides,
});

describe("Tra cứu đơn hàng / bảo hành", () => {
  beforeEach(() => vi.clearAllMocks());

  it("phoneKey bỏ qua khoảng trắng / dấu chấm khi so khớp", () => {
    expect(phoneKey("0987 654 321")).toBe(phoneKey("0987.654.321"));
  });

  it("tìm thấy đơn khi khớp mã và số điện thoại", async () => {
    prisma.order.findMany.mockResolvedValue([order()]);
    const res = await (await api()).post("/api/service/order-lookup").send({ code: "#A1B2C3D4", phone: "0987654321" });
    expect(res.body.success).toBe(true);
    expect(res.body.order.code).toBe("A1B2C3D4");
    expect(prisma.order.findMany.mock.calls[0][0].where).toEqual({ id: { startsWith: "a1b2c3d4" } });
  });

  it("sai số điện thoại thì không trả thông tin đơn", async () => {
    prisma.order.findMany.mockResolvedValue([order()]);
    const res = await (await api()).post("/api/service/order-lookup").send({ code: "A1B2C3D4", phone: "0911111111" });
    expect(res.body.success).toBe(false);
    expect(res.body.order).toBeUndefined();
  });

  it("mã đơn quá ngắn thì không truy vấn", async () => {
    const res = await (await api()).post("/api/service/order-lookup").send({ code: "A1B2", phone: "0987654321" });
    expect(res.body.success).toBe(false);
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it("bảo hành đang hiệu lực khi đơn đã hoàn tất", async () => {
    prisma.order.findMany.mockResolvedValue([order()]);
    const res = await (await api()).post("/api/service/warranty-lookup").send({ code: "A1B2C3D4", phone: "0987654321" });
    expect(res.body.items[0].state).toBe("ACTIVE");
    expect(res.body.items[0].warrantyMonths).toBe(24);
  });

  it("đơn chưa hoàn tất thì bảo hành chưa kích hoạt", async () => {
    prisma.order.findMany.mockResolvedValue([order({ status: "SHIPPING" })]);
    const res = await (await api()).post("/api/service/warranty-lookup").send({ code: "A1B2C3D4", phone: "0987654321" });
    expect(res.body.items[0].state).toBe("NOT_ACTIVATED");
  });
});

describe("POST /api/feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("bắt buộc họ tên, số điện thoại, nội dung", async () => {
    const res = await (await api()).post("/api/feedback").send({ name: "A" });
    expect(res.status).toBe(400);
  });

  it("nội dung phải từ 10 ký tự", async () => {
    const res = await (await api()).post("/api/feedback").send({ name: "A", phone: "0987654321", content: "ngắn" });
    expect(res.status).toBe(400);
    expect(prisma.feedback.create).not.toHaveBeenCalled();
  });

  it("lưu góp ý, loại không hợp lệ thì về SUGGESTION", async () => {
    const res = await (await api())
      .post("/api/feedback")
      .send({ name: "A", phone: "0987654321", content: "Giao hàng hơi chậm", type: "HACK", orderCode: "#a1b2c3d4" });
    expect(res.status).toBe(201);
    expect(prisma.feedback.create.mock.calls[0][0].data).toMatchObject({ type: "SUGGESTION", orderCode: "A1B2C3D4", userId: null });
  });
});

describe("Số điện thoại phải bắt đầu bằng 0", () => {
  beforeEach(() => vi.clearAllMocks());

  it("tra cứu đơn với số không bắt đầu bằng 0 bị từ chối, không truy vấn CSDL", async () => {
    for (const phone of ["+84987654321", "987654321", "1987654321", "0987", "09876543210123"]) {
      const res = await (await api()).post("/api/service/order-lookup").send({ code: "A1B2C3D4", phone });
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("bắt đầu bằng số 0");
    }
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it("góp ý với số sai bị từ chối; số đúng được lưu dạng gọn", async () => {
    const bad = await (await api()).post("/api/feedback").send({ name: "A", phone: "84987654321", content: "Nội dung đủ dài để gửi" });
    expect(bad.status).toBe(400);
    const good = await (await api()).post("/api/feedback").send({ name: "A", phone: "0987 654 321", content: "Nội dung đủ dài để gửi" });
    expect(good.status).toBe(201);
    expect(prisma.feedback.create.mock.calls[0][0].data.phone).toBe("0987654321");
  });
});
