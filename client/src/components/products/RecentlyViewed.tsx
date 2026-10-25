import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { ProductCard, type ProductCardData } from "./ProductCard";

const STORAGE_KEY = "lapstore_viewed";
const MAX_ITEMS = 10;

function readViewed(): ProductCardData[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

// Ghi nhận sản phẩm vừa xem (đặt trong trang chi tiết)
export function TrackRecentlyViewed({ product }: { product: ProductCardData }) {
  useEffect(() => {
    const list = readViewed().filter((p) => p.id !== product.id);
    list.unshift({ ...product, reviews: undefined });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  }, [product]);
  return null;
}

export function RecentlyViewed({ excludeId, title = "Sản phẩm bạn đã xem" }: { excludeId?: string; title?: string }) {
  const [items, setItems] = useState<ProductCardData[]>([]);

  useEffect(() => {
    setItems(readViewed().filter((p) => p.id !== excludeId).slice(0, 5));
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-black text-zinc-900 mb-5 flex items-center gap-2">
        <History className="w-5 h-5 text-primary" /> {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
