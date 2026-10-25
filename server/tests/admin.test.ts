import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ADMIN, CUSTOMER, type PrismaMock } from "./helpers";

vi.mock("../src/lib/prisma", async () => ({ prisma: (await import("./helpers")).createPrismaMock() }));
vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  const mocked = { ...actual, mkdir: vi.fn(), writeFile: vi.fn(), readFile: vi.fn() };
  return { ...mocked, default: mocked };
});

import { prisma as realPrisma } from "../src/lib/prisma";
import { readFile, writeFile } from "fs/promises";
import { detectImageType } from "../src/lib/uploads";

const prisma = realPrisma as unknown as PrismaMock;

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const WEBP = Buffer.from("RIFF\0\0\0\0WEBPVP8 ");

const validProduct = {
  name: "ASUS Vivobook 15",
  sku: "asu-011",
  brand: "ASUS",
  price: 15990000,
  stockQuantity: 10,
  cpu: "Intel Core i5-1335U",
  ram: "16GB DDR4",
  ramGb: 16,
  storage: "512GB SSD",
  storageGb: 512,
  gpu: "Intel Iris Xe",
  display: "15.6 inch FHD",
};

describe("Phân quyền quản trị", () => {
  beforeEach(() => vi.clearAllMocks());

  it("chưa đăng nhập → 401, khách thường → 403", async () => {
    const client = await api();
    expect((await client.get("/api/admin/dashboard")).status).toBe(401);
    expect((await client.get("/api/admin/dashboard").set("Cookie", CUSTOMER)).status).toBe(403);
    expect((await client.post("/api/admin/products").set("Cookie", CUSTOMER).send(validProduct)).status).toBe(403);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });
});

describe("Quản lý sản phẩm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("kiểm tra dữ liệu bắt buộc và giá", async () => {
    const client = await api();
    const bad = [
      { ...validProduct, name: "" },
      { ...validProduct, cpu: "" },
      { ...validProduct, price: 0 },
      { ...validProduct, originalPrice: 1000 },
      { ...validProduct, stockQuantity: -1 },
      { ...validProduct, warrantyMonths: -3 },
      { ...validProduct, ramGb: -16 },
      { ...validProduct, imageUrl: "javascript:alert(1)" },
    ];
    for (const body of bad) {
      expect((await client.post("/api/admin/products").set("Cookie", ADMIN).send(body)).status).toBe(400);
    }
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("tạo sản phẩm: SKU viết hoa và ghi lịch sử giá", async () => {
    prisma.product.create.mockResolvedValue({ id: "p1" });
    const res = await (await api()).post("/api/admin/products").set("Cookie", ADMIN).send(validProduct);
    expect(res.status).toBe(201);
    expect(prisma.product.create.mock.calls[0][0].data.sku).toBe("ASU-011");
    expect(prisma.priceHistory.create).toHaveBeenCalledWith({ data: { productId: "p1", price: 15990000 } });
  });

  it("trùng SKU thì báo lỗi dễ hiểu", async () => {
    prisma.product.create.mockRejectedValue(Object.assign(new Error("unique"), { code: "P2002" }));
    const res = await (await api()).post("/api/admin/products").set("Cookie", ADMIN).send(validProduct);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Mã SKU đã tồn tại");
  });

  it("giảm giá thì báo cho khách đã yêu thích", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "p1", price: 17990000 });
    prisma.favorite.findMany.mockResolvedValue([{ userId: "u1" }, { userId: "u2" }]);
    const res = await (await api()).put("/api/admin/products/p1").set("Cookie", ADMIN).send(validProduct);
    expect(res.body.success).toBe(true);
    expect(prisma.priceHistory.create).toHaveBeenCalled();
    expect(prisma.notification.create).toHaveBeenCalledTimes(2);
    expect(prisma.notification.create.mock.calls[0][0].data.type).toBe("PRICE_DROP");
  });

  it("không xóa sản phẩm đã có trong đơn hàng", async () => {
    prisma.orderItem.count.mockResolvedValue(3);
    const res = await (await api()).delete("/api/admin/products/p1").set("Cookie", ADMIN);
    expect(res.status).toBe(400);
    expect(prisma.product.delete).not.toHaveBeenCalled();
  });
});

describe("Xử lý đơn hàng", () => {
  beforeEach(() => vi.clearAllMocks());

  it("không nhảy cóc trạng thái (Chờ xác nhận → Đang giao)", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "u1", status: "PENDING" });
    const res = await (await api()).patch("/api/admin/orders/o1/status").set("Cookie", ADMIN).send({ status: "SHIPPING", trackingCode: "GHN1" });
    expect(res.status).toBe(400);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("chuyển sang Đang giao bắt buộc có mã vận đơn", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "u1", status: "PACKED" });
    const res = await (await api()).patch("/api/admin/orders/o1/status").set("Cookie", ADMIN).send({ status: "SHIPPING" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("mã vận đơn");
  });

  it("chuyển trạng thái hợp lệ thì lưu mã vận đơn và báo cho khách", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "u1", status: "PACKED", paymentMethod: "COD" });
    const res = await (await api()).patch("/api/admin/orders/o1/status").set("Cookie", ADMIN).send({ status: "SHIPPING", trackingCode: " GHN123 " });
    expect(res.body.success).toBe(true);
    expect(prisma.order.update.mock.calls[0][0].data).toEqual({ status: "SHIPPING", trackingCode: "GHN123" });
    expect(prisma.notification.create.mock.calls[0][0].data.userId).toBe("u1");
  });

  it("COD giao thành công thì tính là đã thanh toán", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "u1", status: "SHIPPING", paymentMethod: "COD" });
    await (await api()).patch("/api/admin/orders/o1/status").set("Cookie", ADMIN).send({ status: "DELIVERED" });
    expect(prisma.order.update.mock.calls[0][0].data).toEqual({ status: "DELIVERED", paymentStatus: "PAID" });
  });

  it("đơn đã hoàn tất thì không đổi được nữa", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "u1", status: "COMPLETED" });
    const res = await (await api()).patch("/api/admin/orders/o1/status").set("Cookie", ADMIN).send({ status: "CANCELLED" });
    expect(res.status).toBe(400);
  });
});

describe("Tải ảnh sản phẩm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("nhận diện JPG, PNG, WEBP theo chữ ký file", () => {
    expect(detectImageType(JPG)).toBe("jpg");
    expect(detectImageType(PNG)).toBe("png");
    expect(detectImageType(WEBP)).toBe("webp");
    expect(detectImageType(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
  });

  it("khách thường không tải được ảnh", async () => {
    const res = await (await api()).post("/api/admin/upload").set("Cookie", CUSTOMER).attach("file", PNG, "a.png");
    expect(res.status).toBe(403);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("chưa chọn file thì báo lỗi", async () => {
    const res = await (await api()).post("/api/admin/upload").set("Cookie", ADMIN);
    expect(res.status).toBe(400);
  });

  it("từ chối file giả đuôi .png", async () => {
    const res = await (await api())
      .post("/api/admin/upload")
      .set("Cookie", ADMIN)
      .attach("file", Buffer.from("<html></html>"), { filename: "virus.png", contentType: "image/png" });
    expect(res.status).toBe(400);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("từ chối ảnh lớn hơn 5MB", async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 1);
    JPG.copy(big);
    const res = await (await api()).post("/api/admin/upload").set("Cookie", ADMIN).attach("file", big, "big.jpg");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Ảnh phải nhỏ hơn 5MB");
  });

  it("lưu ảnh hợp lệ với tên do server tự đặt", async () => {
    const res = await (await api()).post("/api/admin/upload").set("Cookie", ADMIN).attach("file", PNG, "../../evil name.png");
    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/^\/uploads\/products\/[a-z0-9-]+\.png$/);
    expect(writeFile).toHaveBeenCalledTimes(1);
  });

  it("GET /uploads/products/:name chặn tên file lạ", async () => {
    const client = await api();
    for (const name of ["..%2F.env", "a.svg", "A.JPG"]) {
      expect((await client.get(`/uploads/products/${name}`)).status).toBe(404);
    }
    expect(readFile).not.toHaveBeenCalled();
  });

  it("GET /uploads/products/:name trả ảnh với Content-Type đúng", async () => {
    (readFile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(PNG);
    const res = await (await api()).get("/uploads/products/123-abcd1234.png");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
  });
});

describe("Proxy ảnh", () => {
  it("chặn link tới máy nội bộ và giao thức lạ", async () => {
    const client = await api();
    for (const url of ["http://localhost:4000/api/admin/users", "http://127.0.0.1/", "http://192.168.1.1/a.jpg", "file:///etc/passwd", "khong-phai-url"]) {
      expect((await client.get(`/api/proxy-image?url=${encodeURIComponent(url)}`)).status).toBe(400);
    }
  });

  it("thiếu tham số url thì 400", async () => {
    expect((await (await api()).get("/api/proxy-image")).status).toBe(400);
  });
});

describe("Mã giảm giá không nhận số âm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("từ chối giảm tối đa âm / bằng 0, đơn tối thiểu âm, lượt dùng âm, ngày sai", async () => {
    const base = { code: "TESTAM", discountType: "PERCENTAGE", discountValue: 10 };
    const client = await api();
    for (const extra of [{ maxDiscount: -500000 }, { maxDiscount: 0 }, { minOrderAmount: -1 }, { usageLimit: -5 }, { usageLimit: 1.5 }, { expiryDate: "khong-phai-ngay" }, { discountValue: -10 }]) {
      const res = await client.post("/api/admin/vouchers").set("Cookie", ADMIN).send({ ...base, ...extra });
      expect(res.status).toBe(400);
    }
    expect(prisma.voucher.create).not.toHaveBeenCalled();
  });

  it("bỏ trống các ô tùy chọn thì dùng mặc định", async () => {
    prisma.voucher.create.mockResolvedValue({ id: "v1" });
    const res = await (await api()).post("/api/admin/vouchers").set("Cookie", ADMIN).send({ code: "TESTOK", discountValue: 10, minOrderAmount: "", maxDiscount: "", usageLimit: "" });
    expect(res.status).toBe(201);
    expect(prisma.voucher.create.mock.calls[0][0].data).toMatchObject({ minOrderAmount: 0, maxDiscount: null, usageLimit: 100 });
  });
});
