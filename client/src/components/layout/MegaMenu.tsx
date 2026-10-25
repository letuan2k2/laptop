import { Link } from "react-router";
import { useState } from "react";
import { ChevronRight, Laptop, Gamepad2, Briefcase, Feather, Palette, GraduationCap, Tag, Cpu, Building2 } from "lucide-react";
import { BRANDS, brandSlug } from "@shared/site";
import { CPU_FAMILIES, PRICE_RANGES } from "@/lib/catalog-filters";

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  gaming: Gamepad2,
  "van-phong": GraduationCap,
  "do-hoa": Palette,
  "mong-nhe": Feather,
  "doanh-nhan": Briefcase,
};

type Panel = "brand" | "price" | "cpu" | string;

// Menu dọc kiểu "Danh mục sản phẩm": rê chuột vào từng dòng để mở bảng con bên phải
export function MegaMenu({ categories, onNavigate, className = "" }: { categories: MenuCategory[]; onNavigate?: () => void; className?: string }) {
  const [active, setActive] = useState<Panel | null>(null);

  const rows: { key: Panel; label: string; icon: any; href: string }[] = [
    { key: "brand", label: "Laptop theo hãng", icon: Building2, href: "/products" },
    ...categories.map((c) => ({ key: c.slug, label: c.name, icon: CATEGORY_ICONS[c.slug] || Laptop, href: `/products?category=${c.slug}` })),
    { key: "price", label: "Laptop theo mức giá", icon: Tag, href: "/products" },
    { key: "cpu", label: "Laptop theo CPU", icon: Cpu, href: "/products" },
  ];

  const panelLinks = (key: Panel): { title: string; links: { label: string; href: string }[] } => {
    if (key === "brand") return { title: "Thương hiệu", links: BRANDS.map((b) => ({ label: `Laptop ${b}`, href: `/products?brand=${brandSlug(b)}` })) };
    if (key === "price") return { title: "Mức giá", links: PRICE_RANGES.map((r) => ({ label: r.label, href: `/products?price=${r.id}` })) };
    if (key === "cpu") return { title: "Bộ vi xử lý", links: CPU_FAMILIES.map((c) => ({ label: c.label, href: `/products?cpu=${c.id}` })) };
    const cat = categories.find((c) => c.slug === key);
    return {
      title: cat?.name || "",
      links: BRANDS.map((b) => ({ label: `${cat?.name.replace("Laptop ", "") || ""} ${b}`, href: `/products?category=${key}&brand=${brandSlug(b)}` })),
    };
  };

  return (
    <div className={`relative bg-white ${className}`} onMouseLeave={() => setActive(null)}>
      <ul className="py-2">
        {rows.map((row) => (
          <li key={row.key} onMouseEnter={() => setActive(row.key)}>
            <Link
              to={row.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors ${
                active === row.key ? "bg-primary/5 text-primary" : "text-zinc-700 hover:text-primary"
              }`}
            >
              <row.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{row.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
            </Link>
          </li>
        ))}
      </ul>

      {active && (
        <div className="absolute left-full top-0 min-h-full w-[520px] bg-white border border-zinc-100 shadow-2xl rounded-r-2xl p-6 z-50 hidden md:block">
          <p className="text-sm font-black text-zinc-900 mb-4 uppercase tracking-wide">{panelLinks(active).title}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {panelLinks(active).links.map((l) => (
              <Link key={l.href} to={l.href} onClick={onNavigate} className="text-sm text-zinc-600 hover:text-primary font-medium py-1">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
