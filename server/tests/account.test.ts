import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ADMIN, CUSTOMER, type PrismaMock } from "./helpers";

vi.mock("../src/lib/prisma", async () => ({ prisma: (await import("./helpers")).createPrismaMock() }));

import { prisma as realPrisma } from "../src/lib/prisma";

const prisma = realPrisma as unknown as PrismaMock;

describe("Đơn hàng của khách", () => {
  beforeEach(() => vi.clearAllMocks());

  it("các API tài khoản yêu cầu đăng nhập", async () => {
    const client = await api();
    for (const path of ["/api/orders", "/api/favorites", "/api/notifications", "/api/addresses", "/api/account/profile"]) {
      expect((await client.get(path)).status).toBe(401);
    }
  });

  it("chỉ lấy đơn của chính mình", async () => {
    prisma.order.findMany.mockResolvedValue([]);
    await (await api()).get("/api/orders").set("Cookie", CUSTOMER);
    expect(prisma.order.findMany.mock.calls[0][0].where).toEqual({ userId: "user1" });
  });

  it("không xem được đơn của người khác, admin thì xem được", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "nguoi-khac" });
    const client = await api();
    expect((await client.get("/api/orders/o1").set("Cookie", CUSTOMER)).status).toBe(404);
    expect((await client.get("/api/orders/o1").set("Cookie", ADMIN)).status).toBe(200);
  });

  it("không hủy được đơn đã đóng gói", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "user1", status: "PACKED" });
    const res = await (await api()).post("/api/orders/o1/cancel").set("Cookie", CUSTOMER);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("chưa đóng gói");
  });

  it("hủy đơn thì hoàn kho, trả lượt voucher và hoàn tiền nếu đã thanh toán", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "user1", status: "PENDING" });
    prisma.order.findUniqueOrThrow.mockResolvedValue({
      id: "o1",
      paymentStatus: "PAID",
      voucherId: "v1",
      items: [{ productId: "p1", quantity: 2 }],
    });
    const res = await (await api()).post("/api/orders/o1/cancel").set("Cookie", CUSTOMER);

    expect(res.body.success).toBe(true);
    expect(prisma.order.update.mock.calls[0][0].data).toEqual({ status: "CANCELLED", paymentStatus: "REFUNDED" });
    expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { stockQuantity: { increment: 2 } } });
    expect(prisma.voucher.updateMany).toHaveBeenCalled();
  });

  it("xác nhận đã nhận hàng thì cộng điểm và lên hạng", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "user1", status: "DELIVERED" });
    prisma.order.update.mockResolvedValue({ id: "o1", userId: "user1", totalPayment: 25000000 });
    prisma.user.findUnique.mockResolvedValue({ points: 0 });

    const res = await (await api()).post("/api/orders/o1/confirm").set("Cookie", CUSTOMER);
    expect(res.body.success).toBe(true);
    expect(prisma.user.update.mock.calls[0][0].data).toEqual({ points: 2500, rank: "SILVER" });
  });
});

describe("Đánh giá", () => {
  beforeEach(() => vi.clearAllMocks());

  it("chỉ đánh giá được đơn đã hoàn tất", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "user1", status: "SHIPPING", items: [{ productId: "p1" }] });
    const res = await (await api()).post("/api/reviews").set("Cookie", CUSTOMER).send({ orderId: "o1", productId: "p1", rating: 5 });
    expect(res.status).toBe(400);
  });

  it("số sao phải từ 1 đến 5", async () => {
    const res = await (await api()).post("/api/reviews").set("Cookie", CUSTOMER).send({ orderId: "o1", productId: "p1", rating: 9 });
    expect(res.status).toBe(400);
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });

  it("không đánh giá 2 lần cùng sản phẩm trong một đơn", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "user1", status: "COMPLETED", items: [{ productId: "p1" }] });
    prisma.review.findUnique.mockResolvedValue({ id: "r1" });
    const res = await (await api()).post("/api/reviews").set("Cookie", CUSTOMER).send({ orderId: "o1", productId: "p1", rating: 5 });
    expect(res.body.error).toContain("đã đánh giá");
  });

  it("đánh giá hợp lệ được lưu", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "user1", status: "COMPLETED", items: [{ productId: "p1" }] });
    prisma.review.findUnique.mockResolvedValue(null);
    const res = await (await api())
      .post("/api/reviews")
      .set("Cookie", CUSTOMER)
      .send({ orderId: "o1", productId: "p1", rating: 4, comment: "Máy mượt" });
    expect(res.body.success).toBe(true);
    expect(prisma.review.create.mock.calls[0][0].data).toMatchObject({ userId: "user1", rating: 4, comment: "Máy mượt" });
  });
});

describe("Sổ địa chỉ", () => {
  beforeEach(() => vi.clearAllMocks());

  it("địa chỉ đầu tiên tự động là mặc định", async () => {
    prisma.userAddress.count.mockResolvedValue(0);
    prisma.userAddress.create.mockResolvedValue({ id: "a1" });
    await (await api()).post("/api/addresses").set("Cookie", CUSTOMER).send({ name: "A", phone: "0987654321", address: "Hà Nội" });
    expect(prisma.userAddress.create.mock.calls[0][0].data).toMatchObject({ userId: "user1", isDefault: true });
  });

  it("không sửa/xóa được địa chỉ của người khác", async () => {
    prisma.userAddress.findFirst.mockResolvedValue(null);
    const client = await api();
    const body = { name: "A", phone: "0987654321", address: "Hà Nội" };
    expect((await client.put("/api/addresses/a9").set("Cookie", CUSTOMER).send(body)).status).toBe(404);
    expect((await client.delete("/api/addresses/a9").set("Cookie", CUSTOMER)).status).toBe(404);
    expect(prisma.userAddress.findFirst.mock.calls[0][0].where).toEqual({ id: "a9", userId: "user1" });
  });
});

describe("Yêu thích & thông báo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("bấm yêu thích lần 2 thì bỏ yêu thích", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "p1" });
    prisma.favorite.findUnique.mockResolvedValue({ id: "f1" });
    const res = await (await api()).post("/api/favorites/p1/toggle").set("Cookie", CUSTOMER);
    expect(res.body.isFavorite).toBe(false);
    expect(prisma.favorite.delete).toHaveBeenCalled();
  });

  it("chỉ đánh dấu đã đọc thông báo của chính mình", async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });
    await (await api()).post("/api/notifications/n1/read").set("Cookie", CUSTOMER);
    expect(prisma.notification.updateMany.mock.calls[0][0].where).toEqual({ id: "n1", userId: "user1" });
  });
});

describe("Kiểm tra số điện thoại ở hồ sơ và sổ địa chỉ", () => {
  beforeEach(() => vi.clearAllMocks());

  it("địa chỉ với số không bắt đầu bằng 0 bị từ chối", async () => {
    const res = await (await api()).post("/api/addresses").set("Cookie", CUSTOMER).send({ name: "A", phone: "987654321", address: "Hà Nội" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("bắt đầu bằng số 0");
    expect(prisma.userAddress.create).not.toHaveBeenCalled();
  });

  it("hồ sơ: số sai bị từ chối, bỏ trống thì được", async () => {
    const bad = await (await api()).put("/api/account/profile").set("Cookie", CUSTOMER).send({ name: "A", phoneNumber: "+84987654321" });
    expect(bad.status).toBe(400);
    const empty = await (await api()).put("/api/account/profile").set("Cookie", CUSTOMER).send({ name: "A", phoneNumber: "" });
    expect(empty.status).toBe(200);
    expect(prisma.user.update.mock.calls[0][0].data.phoneNumber).toBeNull();
  });
});
