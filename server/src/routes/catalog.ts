import { Router } from "express";
import { prisma } from "../lib/prisma";
import { BRANDS, brandSlug } from "../../../shared/site";

export const catalogRouter = Router();

// GET /api/categories
catalogRouter.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  res.json(categories);
});

// GET /api/collections/:slug – đường dẫn ngắn (/collections/gaming, /collections/dell) → bộ lọc tương ứng
catalogRouter.get("/collections/:slug", async (req, res) => {
  const { slug } = req.params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (category) {
    res.json({ query: `category=${category.slug}` });
    return;
  }
  const brand = BRANDS.find((b) => brandSlug(b) === slug);
  if (brand) {
    res.json({ query: `brand=${brandSlug(brand)}` });
    return;
  }
  res.status(404).json({ error: "Không tìm thấy danh mục" });
});

// GET /api/products – toàn bộ laptop kèm điểm đánh giá (lọc/sắp xếp thực hiện ở trình duyệt)
catalogRouter.get("/products", async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: { reviews: { select: { rating: true } } },
  });
  res.json(products);
});

// GET /api/products/suggestions?q= – gợi ý khi gõ ô tìm kiếm
catalogRouter.get("/products/suggestions", async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!query) {
    res.json([]);
    return;
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { brand: { contains: query } },
        { cpu: { contains: query } },
        { sku: { contains: query } },
      ],
    },
    take: 6,
    select: { id: true, name: true, brand: true, price: true, imageUrl: true },
  });
  res.json(products);
});

// GET /api/products/:id – chi tiết sản phẩm, đánh giá, sản phẩm liên quan; tăng lượt xem
catalogRouter.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      reviews: {
        include: {
          user: { select: { name: true } },
          replies: {
            include: { user: { select: { name: true, role: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) {
    res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    return;
  }

  await prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);

  const userId = req.user?.id;
  const [related, favorite, note] = await Promise.all([
    prisma.product.findMany({
      where: { id: { not: id }, OR: [{ categoryId: product.categoryId }, { brand: product.brand }] },
      include: { reviews: { select: { rating: true } } },
      take: 5,
      orderBy: { isFeatured: "desc" },
    }),
    userId ? prisma.favorite.findUnique({ where: { userId_productId: { userId, productId: id } } }) : null,
    userId ? prisma.privateNote.findUnique({ where: { userId_productId: { userId, productId: id } } }) : null,
  ]);

  res.json({
    product: { ...product, viewCount: product.viewCount + 1 },
    related,
    isFavorite: !!favorite,
    note: note?.content ?? "",
  });
});
