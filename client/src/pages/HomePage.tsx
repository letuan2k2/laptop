import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { ShieldCheck, RefreshCcw, Truck, CreditCard, ChevronRight, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HomeBanner } from "@/components/home/HomeBanner";
import { DealSection } from "@/components/home/DealSection";
import { Promotions } from "@/components/home/Promotions";
import { ProductCard } from "@/components/products/ProductCard";
import { RecentlyViewed } from "@/components/products/RecentlyViewed";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { discountPercent } from "@/lib/utils";
import type { Category, Product, Voucher } from "@/lib/types";
import { BRANDS, brandSlug } from "@shared/site";

const PER_SECTION = 5;

export default function HomePage() {
  useTitle(null);
  const { t } = useLanguage();
  const { hash } = useLocation();
  const { data: rawProducts } = useApi<Product[]>("/api/products");
  const { data: rawCategories } = useApi<Category[]>("/api/categories");
  const { data: rawVouchers } = useApi<Voucher[]>("/api/vouchers/active");

  const products = rawProducts ?? [];
  const categories = rawCategories ?? [];
  const vouchers = rawVouchers ?? [];

  // Link "/#vouchers" trên menu: cuộn tới khối mã giảm giá sau khi tải xong
  useEffect(() => {
    if (hash && rawVouchers) document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  }, [hash, rawVouchers]);

  const deals = products
    .filter((p) => p.stockQuantity > 0 && discountPercent(p.price, p.originalPrice) > 0)
    .sort((a, b) => discountPercent(b.price, b.originalPrice) - discountPercent(a.price, a.originalPrice))
    .slice(0, PER_SECTION);

  const featured = products.filter((p) => p.isFeatured).slice(0, 10);

  return (
    <main className="flex flex-col min-h-screen bg-surface">
      <Navbar />
      <HomeBanner categories={categories} />

      {/* Cam kết */}
      <section className="bg-surface pb-2">
        <div className="container mx-auto px-4 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white rounded-2xl border border-zinc-100 p-4">
            {[
              { icon: ShieldCheck, title: t("home.trust1.title"), desc: t("home.trust1.desc") },
              { icon: RefreshCcw, title: t("home.trust2.title"), desc: t("home.trust2.desc") },
              { icon: Truck, title: t("home.trust3.title"), desc: t("home.trust3.desc") },
              { icon: CreditCard, title: t("home.trust4.title"), desc: t("home.trust4.desc") },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{item.title}</h3>
                  <p className="text-[11px] text-zinc-500 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!rawProducts && (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      <DealSection products={deals} />

      {vouchers.length > 0 && (
        <div id="vouchers">
          <Promotions vouchers={vouchers} />
        </div>
      )}

      {/* Sản phẩm nổi bật */}
      {featured.length > 0 && (
        <section className="py-6">
          <div className="container mx-auto px-4 md:px-12">
            <div className="bg-white rounded-3xl border border-zinc-100 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-black text-zinc-900 uppercase">{t("featured.title")}</h2>
                <Link to="/products" className="text-sm font-bold text-primary flex items-center gap-1">
                  {t("featured.viewAll")} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {featured.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Khối theo từng danh mục */}
      {categories.map((cat) => {
        const items = products.filter((p) => p.categoryId === cat.id).slice(0, PER_SECTION);
        if (items.length === 0) return null;
        const catBrands = BRANDS.filter((b) => products.some((p) => p.categoryId === cat.id && p.brand === b));
        return (
          <section key={cat.id} className="py-3">
            <div className="container mx-auto px-4 md:px-12">
              <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 md:px-6 py-4 border-b border-zinc-100">
                  <h2 className="text-lg md:text-xl font-black text-zinc-900 uppercase border-l-4 border-secondary pl-3">{cat.name}</h2>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {catBrands.map((b) => (
                      <Link
                        key={b}
                        to={`/products?category=${cat.slug}&brand=${brandSlug(b)}`}
                        className="px-3 py-1 rounded-full bg-zinc-50 border border-zinc-100 text-xs font-bold text-zinc-600 hover:text-primary hover:border-primary/30"
                      >
                        {b}
                      </Link>
                    ))}
                  </div>
                  <Link to={`/products?category=${cat.slug}`} className="text-sm font-bold text-primary flex items-center gap-1">
                    {t("featured.viewAll")} <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {items.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Thương hiệu */}
      <section className="py-6">
        <div className="container mx-auto px-4 md:px-12">
          <h2 className="text-xl font-black text-zinc-900 mb-4 uppercase">{t("home.brands")}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {BRANDS.map((b) => (
              <Link
                key={b}
                to={`/products?brand=${brandSlug(b)}`}
                className="h-16 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center font-black text-lg text-zinc-700 hover:border-primary hover:text-primary hover:shadow-md transition-all tracking-wide"
              >
                {b.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-12 pb-12">
        <RecentlyViewed />
      </div>

      <Footer />
    </main>
  );
}
