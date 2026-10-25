import { Link } from "react-router";
import { Heart, Laptop, ChevronLeft, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ProductCard } from "@/components/products/ProductCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import type { Product } from "@/lib/types";

export default function FavoritesPage() {
  const { t } = useLanguage();
  useTitle(t("favorites.title"));
  const { data } = useApi<Product[]>("/api/favorites");
  const favoriteProducts = data ?? [];

  return (
    <main className="min-h-screen bg-surface text-zinc-900 pb-24">
      <Navbar />

      <div className="container mx-auto px-4 md:px-12 pt-40 md:pt-44">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary font-bold mb-8 transition-colors group"
        >
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-zinc-100 shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
            <ChevronLeft className="w-5 h-5" />
          </div>
          {t("favorites.backToHome")}
        </Link>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-zinc-100">
            <Heart className="w-8 h-8 text-secondary fill-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">{t("favorites.title")}</h1>
            <p className="text-zinc-500 font-medium">{t("favorites.subtitle")}</p>
          </div>
        </div>

        {!data ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="bg-white rounded-3xl py-24 flex flex-col items-center justify-center border border-zinc-100 shadow-sm">
            <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-8">
              <Laptop className="w-12 h-12 text-zinc-300" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">{t("favorites.empty")}</h2>
            <p className="text-zinc-500 font-medium max-w-sm text-center mb-10">{t("favorites.emptyDesc")}</p>
            <Link
              to="/products"
              className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
            >
              {t("cart.explore")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {favoriteProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
