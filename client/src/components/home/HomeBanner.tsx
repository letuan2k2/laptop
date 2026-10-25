import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Gamepad2, GraduationCap, Feather, Palette } from "lucide-react";
import { MegaMenu, type MenuCategory } from "@/components/layout/MegaMenu";
import { ProductImage } from "@/components/products/ProductImage";

// Banner mẫu dựng bằng CSS (không cần ảnh). Thay bằng ảnh thật nếu muốn.
const SLIDES = [
  { title: "Laptop Gaming RTX 40 Series", sub: "Giảm đến 7 triệu – Tặng balo, chuột gaming", cta: "Mua ngay", href: "/products?category=gaming", brand: "MSI", bg: "from-[#1a0b2e] via-[#5b0f2a] to-[#e30019]" },
  { title: "MacBook Air M4 mới", sub: "Chip M4, RAM 16GB – Trả góp 0% lãi suất", cta: "Khám phá", href: "/products?brand=apple", brand: "Apple", bg: "from-[#0b1f3a] via-[#1e3a8a] to-[#60a5fa]" },
  { title: "Mùa tựu trường 2026", sub: "Laptop học tập – văn phòng chỉ từ 11 triệu", cta: "Xem ưu đãi", href: "/products?category=van-phong", brand: "ASUS", bg: "from-[#064e3b] via-[#047857] to-[#34d399]" },
  { title: "Laptop doanh nhân cao cấp", sub: "ThinkPad, Latitude, EliteBook – Bảo hành đến 36 tháng", cta: "Xem ngay", href: "/products?category=doanh-nhan", brand: "Lenovo", bg: "from-[#111827] via-[#374151] to-[#9ca3af]" },
];

const SIDE_BANNERS = [
  { title: "Ngày vàng – Giảm sốc", sub: "Deal giảm sâu mỗi ngày", href: "/products?sort=discount", bg: "from-secondary to-[#ff6b3d]" },
  { title: "Thu cũ đổi mới", sub: "Trợ giá lên đến 2 triệu", href: "/gop-y", bg: "from-primary to-[#3b8cff]" },
];

const TILES = [
  { icon: Gamepad2, title: "Laptop Gaming", sub: "RTX 4050 - 4080", href: "/products?category=gaming" },
  { icon: GraduationCap, title: "Học tập - Văn phòng", sub: "Chỉ từ 11 triệu", href: "/products?category=van-phong" },
  { icon: Palette, title: "Đồ họa - Kỹ thuật", sub: "Màn hình chuẩn màu", href: "/products?category=do-hoa" },
  { icon: Feather, title: "Mỏng nhẹ", sub: "Dưới 1.5kg", href: "/products?category=mong-nhe" },
];

export function HomeBanner({ categories }: { categories: MenuCategory[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[index];
  const go = (delta: number) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);

  return (
    <section className="pt-40 md:pt-44 pb-6 bg-surface">
      <div className="container mx-auto px-4 md:px-12 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="hidden lg:block lg:col-span-3 xl:col-span-2 rounded-2xl border border-zinc-100 bg-white z-20">
            <MegaMenu categories={categories} className="rounded-2xl" />
          </div>

          {/* Slider */}
          <div className="lg:col-span-6 xl:col-span-7 relative rounded-2xl overflow-hidden min-h-[260px] md:min-h-[340px]">
            <Link to={slide.href} className={`absolute inset-0 bg-gradient-to-br ${slide.bg} flex items-center transition-colors duration-700`}>
              <div className="relative z-10 p-6 md:p-10 max-w-[60%] text-white">
                <p className="text-xs font-black uppercase tracking-widest text-yellow-300 mb-2">Ưu đãi độc quyền</p>
                <h2 className="text-2xl md:text-4xl font-black leading-tight mb-3">{slide.title}</h2>
                <p className="text-sm md:text-base text-white/85 mb-5">{slide.sub}</p>
                <span className="inline-block px-6 py-3 bg-white text-zinc-900 rounded-xl font-black text-sm">{slide.cta}</span>
              </div>
              <div className="absolute right-4 md:right-8 bottom-6 w-[45%] max-w-sm drop-shadow-2xl">
                <ProductImage name={slide.title} brand={slide.brand} showLabel={false} />
              </div>
            </Link>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setIndex(i)} className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/50"}`} />
              ))}
            </div>
          </div>

          {/* Banner phụ */}
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-4">
            {SIDE_BANNERS.map((b) => (
              <Link key={b.title} to={b.href} className={`rounded-2xl bg-gradient-to-br ${b.bg} p-5 text-white flex flex-col justify-end min-h-[120px] hover:opacity-95`}>
                <p className="text-lg font-black leading-tight">{b.title}</p>
                <p className="text-xs text-white/85">{b.sub}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {TILES.map((tile) => (
            <Link key={tile.title} to={tile.href} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-zinc-100 hover:border-primary/30 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <tile.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-zinc-900">{tile.title}</p>
                <p className="text-xs text-zinc-500">{tile.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
