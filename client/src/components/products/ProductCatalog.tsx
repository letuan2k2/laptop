import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, SlidersHorizontal, Laptop, X, ChevronDown, Gamepad2, Briefcase, Feather, Palette, GraduationCap, PackageCheck } from "lucide-react";
import { ProductCard, type ProductCardData } from "./ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { FILTER_GROUPS, FILTER_TITLES, type FilterKey } from "@/lib/catalog-filters";
import { discountPercent } from "@/lib/utils";

type CatalogProduct = ProductCardData & {
  categoryId?: string | null;
  ramGb: number;
  storageGb: number;
  os?: string | null;
  isFeatured?: boolean;
  createdAt?: string;
};

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

const PAGE_SIZE = 20;
const SIDEBAR_GROUPS: FilterKey[] = ["price", "cpu", "ram", "storage", "gpu", "screen", "hz", "os"];

const CATEGORY_ICONS: Record<string, any> = {
  gaming: Gamepad2,
  "van-phong": GraduationCap,
  "do-hoa": Palette,
  "mong-nhe": Feather,
  "doanh-nhan": Briefcase,
};

const SORTS = [
  { id: "featured", key: "catalog.sort.featured" },
  { id: "instock", key: "catalog.sort.inStock" },
  { id: "price-asc", key: "catalog.sort.priceAsc" },
  { id: "price-desc", key: "catalog.sort.priceDesc" },
  { id: "discount", key: "catalog.sort.discount" },
  { id: "newest", key: "catalog.sort.newest" },
];

const emptySelection = () =>
  Object.fromEntries(Object.keys(FILTER_GROUPS).map((k) => [k, [] as string[]])) as unknown as Record<FilterKey, string[]>;

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-zinc-100 pb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between mb-3">
        <h3 className="font-black text-zinc-900 text-sm">{title}</h3>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = selected.includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => onToggle(o.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  active ? "bg-primary/10 text-primary border-primary" : "bg-white text-zinc-600 border-zinc-200 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProductCatalog({
  initialProducts,
  initialSearch = "",
  initialBrand = "ALL",
  initialCategory = "ALL",
  initialFilters = {},
  initialSort = "featured",
  categories = [],
  brands = [],
}: {
  initialProducts: CatalogProduct[];
  initialSearch?: string;
  initialBrand?: string;
  initialCategory?: string;
  initialFilters?: Partial<Record<FilterKey, string>>;
  initialSort?: string;
  categories?: CategoryOption[];
  brands?: string[];
}) {
  const { t } = useLanguage();
  const [search, setSearch] = useState(initialSearch);
  const [brand, setBrand] = useState(initialBrand);
  const [category, setCategory] = useState(initialCategory);
  const [selected, setSelected] = useState<Record<FilterKey, string[]>>(() => {
    const base = emptySelection();
    for (const [key, value] of Object.entries(initialFilters) as [FilterKey, string | undefined][]) {
      if (value && FILTER_GROUPS[key]?.some((o) => o.id === value)) base[key] = [value];
    }
    return base;
  });
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState(SORTS.some((s) => s.id === initialSort) ? initialSort : "featured");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false);

  const toggle = (key: FilterKey, id: string) => {
    setVisible(PAGE_SIZE);
    setSelected((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((x) => x !== id) : [...prev[key], id],
    }));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const categoryId = categories.find((c) => c.slug === category)?.id;

    return initialProducts
      .filter((p) => {
        if (q && !`${p.name} ${p.brand} ${p.cpu} ${p.gpu || ""} ${p.sku || ""}`.toLowerCase().includes(q)) return false;
        if (brand !== "ALL" && p.brand.toLowerCase() !== brand.toLowerCase()) return false;
        if (category !== "ALL" && p.categoryId !== categoryId) return false;
        if (onlyInStock && p.stockQuantity <= 0) return false;
        // Trong cùng một nhóm: thỏa một lựa chọn bất kỳ; giữa các nhóm: thỏa tất cả
        for (const key of Object.keys(FILTER_GROUPS) as FilterKey[]) {
          const ids = selected[key];
          if (ids.length === 0) continue;
          const options = FILTER_GROUPS[key].filter((o) => ids.includes(o.id));
          if (!options.some((o) => o.match(p))) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "newest") return (b.createdAt || "").localeCompare(a.createdAt || "");
        if (sortBy === "discount") return discountPercent(b.price, b.originalPrice) - discountPercent(a.price, a.originalPrice);
        if (sortBy === "instock") return Number(b.stockQuantity > 0) - Number(a.stockQuantity > 0) || b.stockQuantity - a.stockQuantity;
        return Number(!!b.isFeatured) - Number(!!a.isFeatured);
      });
  }, [initialProducts, search, brand, category, selected, onlyInStock, sortBy, categories]);

  const activeChips = [
    ...(brand !== "ALL" ? [{ label: brands.find((b) => b.toLowerCase() === brand.toLowerCase()) || brand, clear: () => setBrand("ALL") }] : []),
    ...(category !== "ALL" ? [{ label: categories.find((c) => c.slug === category)?.name || category, clear: () => setCategory("ALL") }] : []),
    ...(Object.keys(FILTER_GROUPS) as FilterKey[]).flatMap((key) =>
      selected[key].map((id) => ({
        label: FILTER_GROUPS[key].find((o) => o.id === id)?.label || id,
        clear: () => toggle(key, id),
      }))
    ),
    ...(search ? [{ label: `"${search}"`, clear: () => setSearch("") }] : []),
    ...(onlyInStock ? [{ label: t("catalog.onlyInStock"), clear: () => setOnlyInStock(false) }] : []),
  ];

  const clearFilters = () => {
    setSearch("");
    setBrand("ALL");
    setCategory("ALL");
    setSelected(emptySelection());
    setOnlyInStock(false);
    setVisible(PAGE_SIZE);
  };

  return (
    <div className="container mx-auto px-4 md:px-12 pb-16">
      {/* Danh mục con */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-12 gap-2 mb-6">
        {categories.map((c) => {
          const Icon = CATEGORY_ICONS[c.slug] || Laptop;
          const active = category === c.slug;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(active ? "ALL" : c.slug)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                active ? "border-primary bg-primary/5 text-primary" : "border-zinc-100 bg-white text-zinc-600 hover:border-primary/30"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[11px] font-bold leading-tight">{c.name.replace("Laptop ", "")}</span>
            </button>
          );
        })}
        {brands.map((b) => {
          const active = brand.toLowerCase() === b.toLowerCase();
          return (
            <button
              key={b}
              onClick={() => setBrand(active ? "ALL" : b)}
              className={`flex items-center justify-center p-3 rounded-xl border font-black text-sm tracking-wide transition-all ${
                active ? "border-primary bg-primary/5 text-primary" : "border-zinc-100 bg-white text-zinc-700 hover:border-primary/30"
              }`}
            >
              {b.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">{t("catalog.title")}</h1>
          <p className="text-zinc-500 font-medium text-sm">{t("catalog.subtitle")}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <input
              type="text"
              placeholder={t("catalog.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden px-4 rounded-xl bg-white border border-zinc-200 text-sm font-bold flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" /> {t("catalog.filters")}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-72 shrink-0`}>
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4 lg:sticky lg:top-44 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
            <h2 className="font-black text-zinc-900 uppercase tracking-widest text-xs flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" /> {t("catalog.criteria")}
            </h2>

            <label className="flex items-center gap-3 cursor-pointer border-b border-zinc-100 pb-4">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300"
              />
              <span className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-green-600" /> {t("catalog.onlyInStock")}
              </span>
            </label>

            {SIDEBAR_GROUPS.map((key) => (
              <FilterGroup
                key={key}
                title={FILTER_TITLES[key]}
                options={FILTER_GROUPS[key]}
                selected={selected[key]}
                onToggle={(id) => toggle(key, id)}
              />
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Thanh sắp xếp */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-3 mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-zinc-500 px-2">{t("catalog.sortBy")}</span>
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sortBy === s.id ? "bg-primary text-white" : "bg-zinc-50 text-zinc-600 hover:text-primary"
                }`}
              >
                {t(s.key)}
              </button>
            ))}
            <span className="ml-auto text-sm font-bold text-zinc-400 px-2">
              {t("catalog.showResults", { count: filtered.length })}
            </span>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {activeChips.map((chip, i) => (
                <button key={i} onClick={chip.clear} className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20">
                  {chip.label} <X className="w-3 h-3" />
                </button>
              ))}
              <button onClick={clearFilters} className="text-xs font-black text-secondary hover:underline px-2">
                {t("catalog.clearFilters")}
              </button>
            </div>
          )}

          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full py-20 bg-white rounded-3xl flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-100"
                >
                  <Laptop className="w-16 h-16 mb-4 opacity-20" />
                  <h3 className="text-lg font-bold mb-1 text-zinc-900 text-center px-4">{t("catalog.notFound")}</h3>
                  <p className="max-w-sm text-center font-medium text-sm px-4">{t("catalog.notFoundDesc")}</p>
                  <button onClick={clearFilters} className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-black">
                    {t("catalog.clearFilters")}
                  </button>
                </motion.div>
              ) : (
                filtered.slice(0, visible).map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index % PAGE_SIZE} />
                ))
              )}
            </AnimatePresence>
          </motion.div>

          {filtered.length > visible && (
            <div className="text-center mt-8">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="px-8 py-3 bg-white border-2 border-primary text-primary rounded-xl font-black text-sm hover:bg-primary hover:text-white transition-colors"
              >
                {t("catalog.loadMore", { count: filtered.length - visible })}
              </button>
            </div>
          )}

          <CatalogGuide />
        </div>
      </div>
    </div>
  );
}

const FAQ = [
  {
    q: "Nên chọn laptop có RAM bao nhiêu?",
    a: "Học tập, văn phòng cơ bản: 8GB là đủ, nhưng 16GB giúp mở nhiều ứng dụng mượt hơn và dùng được lâu dài. Đồ họa, lập trình, chơi game: nên chọn từ 16GB, dựng video 4K hoặc 3D nên chọn 32GB.",
  },
  {
    q: "Laptop gaming có dùng để học và làm việc được không?",
    a: "Được. Laptop gaming có CPU và card đồ họa mạnh nên xử lý tốt cả đồ họa, lập trình. Nhược điểm là máy nặng hơn (2 - 2.8kg) và thời lượng pin ngắn hơn laptop mỏng nhẹ.",
  },
  {
    q: "Màn hình OLED có gì khác màn hình IPS?",
    a: "OLED cho màu đen sâu, độ tương phản cao và màu sắc rực rỡ, phù hợp xem phim, chỉnh ảnh. IPS có độ bền tốt, giá rẻ hơn và không lo hiện tượng lưu ảnh khi hiển thị nội dung tĩnh lâu.",
  },
  {
    q: "Mua laptop có được trả góp không?",
    a: "Có. Bạn có thể trả góp 0% qua thẻ tín dụng hoặc qua công ty tài chính. Bấm nút “Trả góp 0%” ở trang sản phẩm để tính thử số tiền phải trả mỗi tháng.",
  },
  {
    q: "Tôi có được kiểm tra máy trước khi nhận không?",
    a: "Có. Với đơn COD, bạn được kiểm tra ngoại quan, số serial và bật máy trước khi thanh toán. Nếu lỗi do nhà sản xuất, bạn được 1 đổi 1 trong 15 ngày.",
  },
];

function CatalogGuide() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-12 grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-3 text-sm text-zinc-600 leading-relaxed">
        <h2 className="text-lg font-black text-zinc-900">Cách chọn laptop phù hợp</h2>
        <p><b>Học tập – văn phòng:</b> Core i5 / Ryzen 5, RAM 8 - 16GB, SSD 512GB, màn hình 14 - 15.6 inch là cân bằng nhất về giá và hiệu năng.</p>
        <p><b>Đồ họa – kỹ thuật:</b> ưu tiên CPU dòng H/HX, RAM từ 16GB, card RTX hoặc card chuyên dụng, màn hình chuẩn màu 100% sRGB / DCI-P3.</p>
        <p><b>Gaming:</b> card RTX 4050 trở lên, màn hình 144Hz trở lên, tản nhiệt tốt.</p>
        <p><b>Mỏng nhẹ – di chuyển nhiều:</b> trọng lượng dưới 1.5kg, pin trên 60Wh, các dòng Intel Core Ultra, Apple M.</p>
        <h3 className="text-base font-black text-zinc-900 pt-2">Vì sao nên mua laptop tại LAPSTORE?</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>100% hàng chính hãng, đầy đủ hóa đơn VAT.</li>
          <li>1 đổi 1 trong 15 ngày, bảo hành tận nơi với nhiều dòng máy.</li>
          <li>Miễn phí giao hàng toàn quốc, trả góp 0%.</li>
          <li>Hỗ trợ cài đặt phần mềm trọn đời tại tất cả showroom.</li>
        </ul>
        <Link to="/chinh-sach/bao-hanh" className="inline-block text-primary font-bold hover:underline">Xem chính sách bảo hành →</Link>
      </div>
      <div className="bg-white rounded-3xl border border-zinc-100 p-6">
        <h2 className="text-lg font-black text-zinc-900 mb-4">Câu hỏi thường gặp</h2>
        <div className="divide-y divide-zinc-100">
          {FAQ.map((item, i) => (
            <div key={i}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-4 py-3 text-left">
                <span className="text-sm font-bold text-zinc-800">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="pb-4 text-sm text-zinc-600 leading-relaxed">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
