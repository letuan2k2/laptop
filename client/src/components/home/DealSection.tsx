import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Flame, ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";

function msUntilMidnight() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return end.getTime() - now.getTime();
}

// Khối "Giá sốc hôm nay": sản phẩm giảm nhiều nhất, đếm ngược tới 24:00
export function DealSection({ products }: { products: ProductCardData[] }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    setLeft(msUntilMidnight());
    const timer = setInterval(() => setLeft(msUntilMidnight()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (products.length === 0) return null;

  const parts = left === null
    ? ["--", "--", "--"]
    : [Math.floor(left / 3600000), Math.floor((left % 3600000) / 60000), Math.floor((left % 60000) / 1000)].map((n) => String(n).padStart(2, "0"));

  return (
    <section className="py-6 bg-surface">
      <div className="container mx-auto px-4 md:px-12">
        <div className="rounded-3xl bg-gradient-to-r from-secondary to-[#ff5a3c] p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 text-white">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-yellow-300 fill-yellow-300" />
              <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight">Giá sốc hôm nay</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Kết thúc sau</span>
              {parts.map((p, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="w-10 h-10 rounded-lg bg-zinc-900 text-white font-black flex items-center justify-center">{p}</span>
                  {i < 2 && <span className="font-black">:</span>}
                </span>
              ))}
            </div>
            <Link to="/products?sort=discount" className="flex items-center gap-1 text-sm font-black hover:underline">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
