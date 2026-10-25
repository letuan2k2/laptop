import { motion } from "framer-motion";
import { Star, ShoppingCart, Cpu, MemoryStick, HardDrive, Monitor, Gpu, Gift, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { toast } from "react-hot-toast";
import { ProductImage } from "./ProductImage";
import { discountPercent, formatVND } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number | null;
  stockQuantity: number;
  imageUrl?: string | null;
  cpu: string;
  ram: string;
  storage: string;
  display: string;
  gpu?: string;
  sku?: string;
  reviews?: { rating: number }[];
}

// Rút gọn thông số cho thẻ sản phẩm: "Intel Core i5-1335U (10 nhân...)" -> "Intel Core i5-1335U"
function short(spec: string) {
  return spec.split(/[(,]/)[0].trim();
}

export function ProductCard({ product, index = 0 }: { product: ProductCardData; index?: number }) {
  const { addToCart } = useCart();
  const { t } = useLanguage();

  const reviews = product.reviews || [];
  const avgRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;
  const discount = discountPercent(product.price, product.originalPrice);
  const outOfStock = product.stockQuantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;

    addToCart({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      imageUrl: product.imageUrl,
      stockQuantity: product.stockQuantity,
    });

    toast.success(t("product.addedToCartToast"), {
      style: { borderRadius: "16px", background: "#333", color: "#fff", fontWeight: "bold" },
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: Math.min(index, 12) * 0.03 }}
      className="group relative bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 h-full flex flex-col"
    >
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-zinc-50 flex items-center justify-center p-3">
          <ProductImage
            imageUrl={product.imageUrl}
            name={product.name}
            brand={product.brand}
            className="group-hover:scale-105 transition-transform duration-500"
          />
          {discount > 0 && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-secondary text-white rounded-lg text-[11px] font-black">
              -{discount}%
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="px-3 py-1 bg-zinc-900 text-white text-xs font-black rounded-lg uppercase">{t("product.outOfStock")}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="px-1 pb-1 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] font-black text-primary uppercase tracking-wider">{product.brand}</p>
            {product.sku && <p className="text-[10px] font-bold text-zinc-400">Mã: {product.sku}</p>}
          </div>
          <Link to={`/products/${product.id}`}>
            <h3 className="font-bold text-sm text-zinc-900 leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
          </Link>
          <ul className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-zinc-500 font-medium bg-zinc-50 rounded-lg p-2">
            <li className="flex items-center gap-1.5 truncate"><Cpu className="w-3 h-3 shrink-0 text-zinc-400" />{short(product.cpu)}</li>
            <li className="flex items-center gap-1.5 truncate"><MemoryStick className="w-3 h-3 shrink-0 text-zinc-400" />{short(product.ram)}</li>
            <li className="flex items-center gap-1.5 truncate"><HardDrive className="w-3 h-3 shrink-0 text-zinc-400" />{short(product.storage)}</li>
            <li className="flex items-center gap-1.5 truncate"><Monitor className="w-3 h-3 shrink-0 text-zinc-400" />{short(product.display)}</li>
            {product.gpu && (
              <li className="flex items-center gap-1.5 truncate"><Gpu className="w-3 h-3 shrink-0 text-zinc-400" />{short(product.gpu)}</li>
            )}
          </ul>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            {outOfStock ? (
              <span className="flex items-center gap-1 text-zinc-400"><XCircle className="w-3.5 h-3.5" />{t("product.outOfStock")}</span>
            ) : (
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3.5 h-3.5" />{t("product.available")}</span>
            )}
            <span className="flex items-center gap-1 text-secondary"><Gift className="w-3.5 h-3.5" />{t("product.giftBadge")}</span>
          </div>
          {avgRating > 0 && (
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${s <= Math.round(avgRating) ? "fill-current" : "text-zinc-200"}`}
                />
              ))}
              <span className="text-[10px] font-bold text-zinc-400 ml-1">({reviews.length})</span>
            </div>
          )}

          <div className="flex justify-between items-end pt-2 border-t border-zinc-50">
            <div>
              {discount > 0 && (
                <p className="text-[11px] text-zinc-400 line-through font-medium">{formatVND(product.originalPrice)}</p>
              )}
              <p className="text-lg font-black text-secondary leading-tight">{formatVND(product.price)}</p>
              {discount > 0 && (
                <p className="text-[10px] font-bold text-green-600">
                  {t("product.save")} {formatVND((product.originalPrice || 0) - product.price)}
                </p>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              title={t("product.addToCart")}
              className={`p-2.5 rounded-xl transition-all active:scale-90 ${
                outOfStock
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
