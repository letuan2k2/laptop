import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, CUSTOMER, type PrismaMock } from "./helpers";

vi.mock("../src/lib/prisma", async () => ({ prisma: (await import("./helpers")).createPrismaMock() }));

import { Prisma } from "@prisma/client";
import { prisma as realPrisma } from "../src/lib/prisma";

const prisma = realPrisma as unknown as PrismaMock;

describe("Danh mục & sản phẩm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET /api/categories trả danh sách sắp theo tên", async () => {
    prisma.category.findMany.mockResolvedValue([{ id: "c1", name: "Laptop Gaming", slug: "gaming" }]);
    const res = await (await api()).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(prisma.category.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { name: "asc" } }));
  });

  it("giá kiểu Decimal của Prisma được trả về dạng số", async () => {
    // Dùng Decimal thật của Prisma (tên lớp bị thu gọn khi đóng gói, không phải "Decimal")
    const decimal = new Prisma.Decimal("15990000.00");
    prisma.product.findMany.mockResolvedValue([{ id: "p1", price: decimal, reviews: [] }]);
    const res = await (await api()).get("/api/products");
    expect(res.body[0].price).toBe(15990000);
  });

  it("gợi ý tìm kiếm: từ khóa rỗng thì không truy vấn", async () => {
    const res = await (await api()).get("/api/products/suggestions?q=%20");
    expect(res.body).toEqual([]);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("gợi ý tìm kiếm theo tên, hãng, CPU, SKU (tối đa 6)", async () => {
    prisma.product.findMany.mockResolvedValue([{ id: "p1", name: "Dell XPS 13", price: 30000000 }]);
    const res = await (await api()).get("/api/products/suggestions?q=xps");
    expect(res.body[0].name).toBe("Dell XPS 13");
    const args = prisma.product.findMany.mock.calls[0][0];
    expect(args.take).toBe(6);
    expect(args.where.OR).toHaveLength(4);
  });

  it("sản phẩm không tồn tại thì 404", async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    const res = await (await api()).get("/api/products/khong-co");
    expect(res.status).toBe(404);
  });

  it("chi tiết sản phẩm: tăng lượt xem, kèm trạng thái yêu thích và ghi chú của khách", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "p1", brand: "Dell", categoryId: "c1", viewCount: 10, reviews: [] });
    prisma.product.update.mockResolvedValue({});
    prisma.product.findMany.mockResolvedValue([]);
    prisma.favorite.findUnique.mockResolvedValue({ id: "f1" });
    prisma.privateNote.findUnique.mockResolvedValue({ content: "Hỏi giá ship" });

    const res = await (await api()).get("/api/products/p1").set("Cookie", CUSTOMER);
    expect(res.status).toBe(200);
    expect(res.body.product.viewCount).toBe(11);
    expect(res.body.isFavorite).toBe(true);
    expect(res.body.note).toBe("Hỏi giá ship");
    expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { viewCount: { increment: 1 } } });
  });

  it("khách chưa đăng nhập không truy vấn yêu thích/ghi chú", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "p1", brand: "Dell", categoryId: null, viewCount: 0, reviews: [] });
    prisma.product.update.mockResolvedValue({});
    prisma.product.findMany.mockResolvedValue([]);
    const res = await (await api()).get("/api/products/p1");
    expect(res.body.isFavorite).toBe(false);
    expect(prisma.favorite.findUnique).not.toHaveBeenCalled();
  });

  it("đường dẫn ngắn /collections/:slug theo danh mục hoặc hãng", async () => {
    prisma.category.findUnique.mockResolvedValueOnce({ slug: "gaming" }).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const client = await api();
    expect((await client.get("/api/collections/gaming")).body.query).toBe("category=gaming");
    expect((await client.get("/api/collections/dell")).body.query).toBe("brand=dell");
    expect((await client.get("/api/collections/abc")).status).toBe(404);
  });

  it("API không tồn tại trả 404 dạng JSON", async () => {
    const res = await (await api()).get("/api/khong-co-api");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
