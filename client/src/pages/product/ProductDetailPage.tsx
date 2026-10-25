import { Link, useParams } from "react-router";
import {
  ShieldCheck, Truck, RefreshCcw, Star, ChevronRight, BadgeCheck, Gift, Phone,
  MessageCircle, MapPin, Eye, CheckCircle2, XCircle, Wrench, Loader2,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PrivateNoteBox } from "@/components/products/PrivateNoteBox";
import { ProductImage } from "@/components/products/ProductImage";
import { ProductCard } from "@/components/products/ProductCard";
import { RecentlyViewed, TrackRecentlyViewed } from "@/components/products/RecentlyViewed";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTitle } from "@/lib/useTitle";
import { discountPercent, formatVND } from "@/lib/utils";
import type { Product, ProductDetail } from "@/lib/types";
import { brandSlug, SHOWROOMS, SUPPORT_TEAMS, telLink, zaloLink } from "@shared/site";
import NotFoundPage from "../NotFoundPage";
import { PurchaseActions } from "./PurchaseActions";
import { ProductTabs } from "./ProductTabs";

// Quà tặng / khuyến mại áp dụng chung (nội dung mẫu – chỉnh tại đây)
const GIFTS = [
  "Tặng balo hoặc túi chống sốc laptop",
  "Tặng chuột không dây",
  "Miễn phí cài đặt phần mềm, vệ sinh máy trọn đời",
  "Giảm thêm 5% (tối đa 1 triệu) cho học sinh, sinh viên với mã SINHVIEN5",
  "Trả góp 0% lãi suất qua thẻ tín dụng",
];

interface ProductResponse {
  product: ProductDetail;
  related: Product[];
  isFavorite: boolean;
  note: string;
}

export default function ProductDetailPage() {
  const { id = "" } = useParams();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  // Chờ biết trạng thái đăng nhập rồi mới tải, để server trả kèm yêu thích / ghi chú của khách
  const { data, error, reload } = useApi<ProductResponse>(authLoading ? null : `/api/products/${id}`);
  useTitle(data?.product.name);

  if (error?.status === 404) return <NotFoundPage />;
  if (!data) {
    return (
      <main className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-48 pb-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </main>
    );
  }

  const { product, related, isFavorite, note: initialNote } = data;
  const userId = user?.id;

  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0;
  const discount = discountPercent(product.price, product.originalPrice);
  const saving = discount > 0 ? (product.originalPrice || 0) - product.price : 0;
  const inStock = product.stockQuantity > 0;

  const specs: [string, string | null | undefined][] = [
    [t("spec.brand"), product.brand],
    [t("spec.sku"), product.sku],
    [t("spec.cpu"), product.cpu],
    [t("spec.ram"), product.ram],
    [t("spec.storage"), product.storage],
    [t("spec.gpu"), product.gpu],
    [t("spec.display"), product.display],
    [t("spec.ports"), product.ports],
    [t("spec.connectivity"), product.connectivity],
    [t("spec.battery"), product.battery],
    [t("spec.weight"), product.weight],
    [t("spec.os"), product.os],
    [t("spec.color"), product.color],
    [t("spec.warranty"), `${product.warrantyMonths} ${t("spec.months")}`],
  ];

  const cardData = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    sku: product.sku,
    price: product.price,
    originalPrice: product.originalPrice,
    stockQuantity: product.stockQuantity,
    imageUrl: product.imageUrl,
    cpu: product.cpu,
    ram: product.ram,
    storage: product.storage,
    display: product.display,
    gpu: product.gpu,
  };

  return (
    <main className="min-h-screen bg-surface text-zinc-900 flex flex-col">
      <Navbar />
      <TrackRecentlyViewed product={cardData} />

      <div className="container mx-auto px-4 md:px-12 pt-40 md:pt-44 pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center flex-wrap gap-1.5 text-xs font-bold text-zinc-500 py-4">
          <Link to="/" className="hover:text-primary">{t("nav.home")}</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products" className="hover:text-primary">{t("nav.laptops")}</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/products?brand=${brandSlug(product.brand)}`} className="hover:text-primary">Laptop {product.brand}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-900 line-clamp-1">{product.name}</span>
        </nav>

        <div className="bg-white rounded-3xl border border-zinc-100 p-4 md:p-8">
          <h1 className="text-xl md:text-3xl font-black tracking-tight leading-tight text-zinc-900 mb-3">{product.name}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-zinc-500 pb-5 mb-6 border-b border-zinc-100">
            <span>{t("product.code")}: <span className="text-zinc-900">{product.sku}</span></span>
            {avgRating > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" /> {avgRating.toFixed(1)}
                <span className="text-zinc-400">({product.reviews.length} {t("product.reviewsCount")})</span>
              </span>
            )}
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {product.viewCount.toLocaleString("vi-VN")} {t("product.views")}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Ảnh */}
            <div className="lg:col-span-5 space-y-4">
              <div className="aspect-[4/3] bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-center overflow-hidden p-6 relative">
                <ProductImage imageUrl={product.imageUrl} name={product.name} brand={product.brand} />
                {discount > 0 && (
                  <span className="absolute top-4 left-4 px-3 py-1 bg-secondary text-white rounded-lg text-sm font-black">-{discount}%</span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 text-center italic">{t("product.imageNote")}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: BadgeCheck, text: t("product.genuine") },
                  { icon: ShieldCheck, text: t("product.warranty").replace("{months}", String(product.warrantyMonths)) },
                  { icon: RefreshCcw, text: t("product.exchange") },
                  { icon: Truck, text: t("product.freeShip") },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl">
                    <item.icon className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-xs font-bold text-zinc-600 leading-snug">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Thông tin & giá */}
            <div className="lg:col-span-4 space-y-5">
              <ul className="text-sm space-y-1.5">
                <li><span className="text-zinc-500">{t("spec.brand")}:</span> <Link to={`/products?brand=${brandSlug(product.brand)}`} className="font-bold text-primary">{product.brand}</Link></li>
                <li><span className="text-zinc-500">{t("spec.warranty")}:</span> <b>{product.warrantyMonths} {t("spec.months")}</b></li>
                <li className="flex items-center gap-1">
                  <span className="text-zinc-500">{t("product.status")}:</span>
                  {inStock ? (
                    <b className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{t("product.available")}</b>
                  ) : (
                    <b className="text-red-500 flex items-center gap-1"><XCircle className="w-4 h-4" />{t("product.outOfStock")}</b>
                  )}
                </li>
                {product.category && (
                  <li><span className="text-zinc-500">{t("product.categoryLabel")}:</span> <Link to={`/products?category=${product.category.slug}`} className="font-bold text-primary">{product.category.name}</Link></li>
                )}
              </ul>

              {/* Khối giá */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 space-y-1.5">
                {discount > 0 && (
                  <p className="text-sm text-zinc-500">
                    {t("product.listPrice")}: <span className="line-through">{formatVND(product.originalPrice)}</span>
                  </p>
                )}
                <p className="text-sm font-bold text-zinc-600">{t("product.salePrice")}:</p>
                <p className="text-3xl md:text-4xl font-black text-secondary leading-none tracking-tight">{formatVND(product.price)}</p>
                {saving > 0 && (
                  <p className="text-sm font-bold text-green-600">
                    {t("product.save")} {formatVND(saving)} (-{discount}%)
                  </p>
                )}
                <p className="text-[11px] text-zinc-400">{t("product.vatIncluded")}</p>
              </div>

              {/* Thông số nổi bật */}
              <div>
                <p className="text-sm font-black text-zinc-900 mb-2">{t("product.highlights")}</p>
                <ul className="space-y-1.5 text-sm">
                  {specs.slice(2, 7).map(([label, value]) => (
                    <li key={label} className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span><b className="text-zinc-700">{label}:</b> <span className="text-zinc-600">{value}</span></span>
                    </li>
                  ))}
                </ul>
              </div>

              <PurchaseActions
                product={{
                  id: product.id,
                  name: product.name,
                  brand: product.brand,
                  price: product.price,
                  imageUrl: product.imageUrl,
                  stockQuantity: product.stockQuantity,
                }}
                initialIsFavorite={isFavorite}
                key={`${product.id}-${isFavorite}`}
              />
            </div>

            {/* Cột phải: khuyến mại, giao hàng, hỗ trợ */}
            <aside className="lg:col-span-3 space-y-4">
              <div className="rounded-2xl border-2 border-secondary/30 overflow-hidden">
                <div className="bg-secondary text-white px-4 py-2.5 flex items-center gap-2 text-sm font-black">
                  <Gift className="w-4 h-4" /> {t("product.promoTitle")}
                </div>
                <ul className="p-4 space-y-2.5">
                  {GIFTS.map((g, i) => (
                    <li key={i} className="flex gap-2 text-xs text-zinc-700 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-secondary/10 text-secondary text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-zinc-100 p-4 space-y-2">
                <p className="text-sm font-black flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> {t("product.buyOnline")}</p>
                <p className="text-xs text-zinc-600">{t("product.buyOnlineDesc")}</p>
                <p className="text-sm font-black flex items-center gap-2 pt-2"><Wrench className="w-4 h-4 text-primary" /> {t("product.afterSales")}</p>
                <p className="text-xs text-zinc-600">{t("product.afterSalesDesc")}</p>
              </div>

              <div className="rounded-2xl border border-zinc-100 p-4 space-y-3">
                <p className="text-sm font-black">{t("product.supportTitle")}</p>
                {SUPPORT_TEAMS.map((team) => (
                  <div key={team.title} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase">{team.title}</p>
                      <a href={telLink(team.phone)} className="text-sm font-black text-secondary flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {team.phone}
                      </a>
                    </div>
                    <a href={zaloLink()} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 bg-[#0068ff] text-white rounded-lg text-[11px] font-black flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> Zalo
                    </a>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-zinc-100 p-4 space-y-2">
                <p className="text-sm font-black flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {t("product.showroomTitle")}</p>
                <ul className="space-y-1.5 text-xs text-zinc-600 max-h-40 overflow-y-auto">
                  {SHOWROOMS.map((s) => (
                    <li key={s.name}>• {s.address}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-zinc-400">{t("product.showroomNote")}</p>
              </div>
            </aside>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          <div className="lg:col-span-8 space-y-6">
            <ProductTabs description={product.description} specs={specs} reviews={product.reviews} onReplied={reload} />
            {userId && <PrivateNoteBox key={product.id} productId={product.id} initialNote={initialNote || ""} />}
          </div>
          <aside className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-zinc-100 p-5 lg:sticky lg:top-44">
              <h2 className="font-black text-zinc-900 mb-4">{t("product.related")}</h2>
              <div className="space-y-3">
                {related.map((p) => (
                  <Link key={p.id} to={`/products/${p.id}`} className="flex gap-3 group">
                    <div className="w-20 h-16 bg-zinc-50 rounded-xl p-1 shrink-0">
                      <ProductImage imageUrl={p.imageUrl} name={p.name} brand={p.brand} showLabel={false} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-800 line-clamp-2 group-hover:text-primary">{p.name}</p>
                      <p className="text-sm font-black text-secondary">{formatVND(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-black text-zinc-900 mb-5">{t("product.similar")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}

        <RecentlyViewed excludeId={id} />
      </div>
      <Footer />
    </main>
  );
}
