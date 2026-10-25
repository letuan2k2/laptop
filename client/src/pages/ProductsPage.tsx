import { Link, useSearchParams } from "react-router";
import { ChevronRight, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCatalog } from "@/components/products/ProductCatalog";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import type { Category, Product } from "@/lib/types";
import { BRANDS } from "@shared/site";

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const { data: products } = useApi<Product[]>("/api/products");
  const { data: categories } = useApi<Category[]>("/api/categories");

  const get = (key: string) => searchParams.get(key) || undefined;
  const search = get("search");
  const brand = get("brand");
  const category = get("category");

  // Hãng có trong kho, sắp theo danh sách mặc định
  const brands = [...new Set((products ?? []).map((p) => p.brand))].sort(
    (a, b) => (BRANDS.indexOf(a) + 1 || 99) - (BRANDS.indexOf(b) + 1 || 99)
  );
  const currentCategory = categories?.find((c) => c.slug === category);
  const currentBrand = brands.find((b) => b.toLowerCase() === brand?.toLowerCase());

  useTitle(currentCategory?.name ?? (currentBrand ? `Laptop ${currentBrand}` : "Laptop"));

  return (
    <main className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="pt-40 md:pt-44">
        <nav className="container mx-auto px-4 md:px-12 flex items-center gap-1.5 text-xs font-bold text-zinc-500 py-4">
          <Link to="/" className="hover:text-primary">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products" className="hover:text-primary">Laptop</Link>
          {currentCategory && (<><ChevronRight className="w-3 h-3" /><span className="text-zinc-900">{currentCategory.name}</span></>)}
          {currentBrand && (<><ChevronRight className="w-3 h-3" /><span className="text-zinc-900">Laptop {currentBrand}</span></>)}
        </nav>
        {!products || !categories ? (
          <div className="py-32 flex justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <ProductCatalog
            // Đổi bộ lọc trên URL (menu, link nhanh) thì khởi tạo lại bộ lọc của danh sách
            key={searchParams.toString()}
            initialProducts={products}
            initialSearch={search}
            initialBrand={brand || "ALL"}
            initialCategory={category || "ALL"}
            initialFilters={{ price: get("price"), cpu: get("cpu"), ram: get("ram"), gpu: get("gpu") }}
            initialSort={get("sort")}
            categories={categories}
            brands={brands}
          />
        )}
      </div>
      <Footer />
    </main>
  );
}
