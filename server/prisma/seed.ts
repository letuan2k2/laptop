import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CATEGORIES, LAPTOPS, type LaptopSeed } from "./data/laptops";

// Ảnh mẫu nằm ở client/public/images/products (frontend React phục vụ)
const PRODUCT_IMAGE_DIR = fileURLToPath(new URL("../../client/public/images/products/", import.meta.url));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const SHOP_NAME = "LAPSTORE";

const SKU_PREFIX: Record<string, string> = {
  Apple: "APL",
  Dell: "DEL",
  ASUS: "ASU",
  Lenovo: "LEN",
  HP: "HPQ",
  Acer: "ACR",
  MSI: "MSI",
};

const PERF_LINE: Record<string, string> = {
  gaming: "Cấu hình này đủ sức chiến mượt các tựa game AAA lẫn eSports, đồng thời xử lý tốt livestream, dựng video và các tác vụ nặng khác.",
  "van-phong": "Máy đáp ứng trơn tru các tác vụ Word, Excel, PowerPoint, họp trực tuyến, học online và mở nhiều tab trình duyệt cùng lúc.",
  "do-hoa": "Hiệu năng mạnh mẽ giúp xử lý mượt các phần mềm Photoshop, Illustrator, Premiere Pro, AutoCAD, Blender và các dự án nhiều lớp.",
  "mong-nhe": "Cấu hình cân bằng giữa hiệu năng và thời lượng pin: khởi động nhanh, vận hành mát và êm, đủ mạnh cho công việc văn phòng lẫn sáng tạo nhẹ.",
  "doanh-nhan": "Máy vận hành ổn định, bảo mật cao, chạy tốt các ứng dụng doanh nghiệp như ERP, CRM, phần mềm kế toán và họp trực tuyến cả ngày.",
};

const AUDIENCE_LINE: Record<string, string> = {
  gaming: "Game thủ, streamer, sinh viên công nghệ thông tin và những ai cần một cỗ máy hiệu năng cao cho cả giải trí lẫn công việc nặng.",
  "van-phong": "Học sinh, sinh viên, nhân viên văn phòng, giáo viên và gia đình cần một chiếc máy bền bỉ, dễ dùng với chi phí hợp lý.",
  "do-hoa": "Nhà thiết kế đồ họa, kiến trúc sư, kỹ sư, nhiếp ảnh gia, người dựng phim và lập trình viên cần hiệu năng xử lý chuyên sâu.",
  "mong-nhe": "Người thường xuyên di chuyển, làm việc tại quán cà phê, sinh viên và dân văn phòng yêu thích sự gọn nhẹ, thời trang.",
  "doanh-nhan": "Doanh nhân, quản lý, nhân viên doanh nghiệp cần một chiếc máy chuyên nghiệp, bảo mật và được hỗ trợ bảo hành dài hạn.",
};

function gpuLine(gpu: string) {
  if (/A500/.test(gpu)) return "Đây là card đồ họa chuyên dụng với driver được chứng nhận cho các phần mềm kỹ thuật, đảm bảo độ ổn định khi dựng hình và mô phỏng.";
  if (/RTX/.test(gpu)) return "Card hỗ trợ công nghệ DLSS và Ray Tracing, tăng tốc khung hình khi chơi game và rút ngắn thời gian render, xuất video.";
  if (/GPU \d+ nhân|M\d/.test(gpu)) return "GPU tích hợp trên chip Apple Silicon được tối ưu cho Final Cut Pro, Lightroom, Xcode và hàng nghìn ứng dụng trên macOS.";
  return "Đồ họa tích hợp đủ để xem phim 4K, chỉnh sửa ảnh cơ bản và chơi các game nhẹ.";
}

function displayLine(display: string) {
  if (/OLED/.test(display)) return "Tấm nền OLED cho màu đen sâu tuyệt đối, độ tương phản cực cao và màu sắc rực rỡ, rất phù hợp xem phim và chỉnh sửa hình ảnh.";
  if (/Mini-LED|XDR/.test(display)) return "Công nghệ đèn nền Mini-LED cho độ sáng HDR rất cao, chi tiết vùng tối – vùng sáng rõ ràng, đáp ứng công việc màu sắc chuyên nghiệp.";
  if (/240Hz|165Hz|144Hz/.test(display)) return "Tần số quét cao giúp mọi chuyển động mượt mà, mang lại lợi thế lớn trong các game bắn súng và đua xe tốc độ cao.";
  if (/Retina/.test(display)) return "Độ phân giải cao cho chữ hiển thị sắc nét, màu sắc chính xác, đọc tài liệu cả ngày không mỏi mắt.";
  return "Tấm nền IPS góc nhìn rộng kết hợp lớp phủ chống chói giúp làm việc lâu dưới đèn văn phòng hay ngoài trời vẫn dễ chịu.";
}

function buildDescription(p: LaptopSeed) {
  return [
    p.intro,
    "## Hiệu năng",
    `Máy được trang bị bộ vi xử lý ${p.cpu}, đi kèm ${p.ram} và ổ cứng ${p.storage}. ${PERF_LINE[p.category]}`,
    "## Card đồ họa",
    `${p.gpu}. ${gpuLine(p.gpu)}`,
    "## Màn hình",
    `${p.display}. ${displayLine(p.display)}`,
    "## Thiết kế & Pin",
    `Máy có trọng lượng ${p.weight}, màu ${p.color}. Pin ${p.battery}, đủ đáp ứng nhu cầu làm việc và học tập khi di chuyển. Hệ điều hành ${p.os} được cài sẵn, mở hộp là dùng ngay.`,
    "## Cổng kết nối",
    `${p.ports}. Kết nối không dây: ${p.connectivity}.`,
    "## Phù hợp với",
    AUDIENCE_LINE[p.category],
    `## Cam kết tại ${SHOP_NAME}`,
    `Sản phẩm chính hãng mới 100%, nguyên seal. Bảo hành ${p.warrantyMonths} tháng theo tiêu chuẩn nhà sản xuất, 1 đổi 1 trong 15 ngày nếu có lỗi phần cứng. Miễn phí giao hàng toàn quốc, hỗ trợ cài đặt phần mềm trọn đời và trả góp 0% qua thẻ tín dụng.`,
  ].join("\n\n");
}

async function main() {
  // 1. Tài khoản
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("12345678", salt);

  console.log("Seeding users...");
  await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: { passwordHash, role: "ADMIN" },
    create: { email: "admin@gmail.com", name: "Quản trị viên", passwordHash, role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "khachhang@gmail.com" },
    update: {},
    create: {
      email: "khachhang@gmail.com",
      name: "Nguyễn Văn Khách",
      passwordHash,
      phoneNumber: "0987654321",
      addresses: {
        create: {
          title: "Nhà riêng",
          name: "Nguyễn Văn Khách",
          phone: "0987654321",
          address: "Số 10 Chùa Láng, Đống Đa, Hà Nội",
          isDefault: true,
        },
      },
    },
  });

  // 2. Danh mục
  console.log("Seeding categories...");
  const categoryIds: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
    categoryIds[cat.slug] = record.id;
  }

  // 3. Sản phẩm
  console.log(`Seeding ${LAPTOPS.length} laptops...`);
  const counters: Record<string, number> = {};
  for (const p of LAPTOPS) {
    counters[p.brand] = (counters[p.brand] || 0) + 1;
    const sku = `${SKU_PREFIX[p.brand] || "LT"}-${String(counters[p.brand]).padStart(3, "0")}`;
    // Ảnh mặc định: client/public/images/products/<sku>.jpg (nếu có)
    const imageFile = `${sku.toLowerCase()}.jpg`;
    const imageUrl = fs.existsSync(path.join(PRODUCT_IMAGE_DIR, imageFile))
      ? `/images/products/${imageFile}`
      : null;

    const data = {
      name: p.name,
      brand: p.brand,
      price: p.price,
      originalPrice: p.originalPrice ?? null,
      stockQuantity: p.stock,
      categoryId: categoryIds[p.category],
      cpu: p.cpu,
      ram: p.ram,
      ramGb: p.ramGb,
      storage: p.storage,
      storageGb: p.storageGb,
      gpu: p.gpu,
      display: p.display,
      battery: p.battery,
      weight: p.weight,
      os: p.os,
      ports: p.ports,
      connectivity: p.connectivity,
      color: p.color,
      warrantyMonths: p.warrantyMonths,
      isFeatured: !!p.featured,
      description: buildDescription(p),
    };

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      // Không ghi đè ảnh admin đã tải lên
      await prisma.product.update({
        where: { sku },
        data: { ...data, imageUrl: existing.imageUrl ?? imageUrl },
      });
    } else {
      const created = await prisma.product.create({ data: { sku, ...data, imageUrl } });
      if (p.originalPrice) {
        await prisma.priceHistory.create({ data: { productId: created.id, price: p.originalPrice } });
      }
      await prisma.priceHistory.create({ data: { productId: created.id, price: p.price } });
    }
  }

  // 4. Mã giảm giá
  console.log("Seeding vouchers...");
  const gamingIds = await prisma.product.findMany({
    where: { categoryId: categoryIds["gaming"] },
    select: { id: true },
  });

  const vouchers = [
    {
      code: "LAPTOP500K",
      description: "Giảm 500.000đ cho đơn hàng từ 10 triệu",
      discountType: "FIXED_AMOUNT" as const,
      discountValue: 500000,
      minOrderAmount: 10000000,
      usageLimit: 200,
    },
    {
      code: "SINHVIEN5",
      description: "Ưu đãi sinh viên: giảm 5%, tối đa 1.000.000đ",
      discountType: "PERCENTAGE" as const,
      discountValue: 5,
      minOrderAmount: 0,
      maxDiscount: 1000000,
      usageLimit: 500,
    },
    {
      code: "GAMING1TR",
      description: "Giảm 1.000.000đ khi mua laptop gaming",
      discountType: "FIXED_AMOUNT" as const,
      discountValue: 1000000,
      minOrderAmount: 15000000,
      usageLimit: 100,
      products: gamingIds,
    },
    {
      code: "VIPGOLD10",
      description: "Thành viên Gold trở lên giảm 10%, tối đa 3.000.000đ",
      discountType: "PERCENTAGE" as const,
      discountValue: 10,
      minOrderAmount: 20000000,
      maxDiscount: 3000000,
      usageLimit: 50,
      minRank: "GOLD" as const,
    },
  ];

  for (const { products, ...v } of vouchers) {
    await prisma.voucher.upsert({
      where: { code: v.code },
      update: {},
      create: {
        ...v,
        products: products ? { connect: products } : undefined,
      },
    });
  }

  const total = await prisma.product.count();
  console.log(`Done. ${total} products in database.`);
  console.log("Admin: admin@gmail.com / 12345678 – Khách demo: khachhang@gmail.com / 12345678");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
