import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Laptop, PackageX, AlertTriangle, Tag, Loader2 } from "lucide-react";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { formatVND } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { AdminProductForm } from "./AdminProductForm";
import { AdminProductRow } from "./AdminProductRow";

interface ProductsResponse {
  products: (Omit<Product, "reviews"> & { category: { name: string } | null })[];
  categories: { id: string; name: string }[];
  brands: string[];
  stats: { total: number; low: number; out: number; inventoryValue: number };
}

export default function AdminProductsPage() {
  useTitle("Quản lý sản phẩm");
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const brand = searchParams.get("brand") || "";
  const stock = searchParams.get("stock") || "";
  const [search, setSearch] = useState(q);
  const [brandInput, setBrandInput] = useState(brand);

  const { data, reload } = useApi<ProductsResponse>(`/api/admin/products?${new URLSearchParams({ q, brand, stock })}`);
  if (!data) {
    return (
      <div className="py-32 flex justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const { products, categories, brands, stats } = data;

  const onFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (search.trim()) next.set("q", search.trim());
    if (brandInput) next.set("brand", brandInput);
    if (stock) next.set("stock", stock);
    setSearchParams(next);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Quản lý sản phẩm</h2>
          <p className="text-zinc-500 font-medium">Thêm, sửa giá, cập nhật tồn kho và thông số laptop</p>
        </div>
        <AdminProductForm mode="create" categories={categories} onSaved={reload} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng sản phẩm", value: stats.total, icon: Laptop, color: "text-blue-500", bg: "bg-blue-500/10", href: "/admin/products" },
          { label: "Sắp hết (< 5)", value: stats.low, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", href: "/admin/products?stock=low" },
          { label: "Hết hàng", value: stats.out, icon: PackageX, color: "text-red-500", bg: "bg-red-500/10", href: "/admin/products?stock=out" },
          { label: "Giá trị tồn kho", value: formatVND(stats.inventoryValue), icon: Tag, color: "text-primary", bg: "bg-primary/10", href: "/admin/products" },
        ].map((stat, i) => (
          <Link key={i} to={stat.href} className="glass p-5 rounded-3xl hover:shadow-md transition-all">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-xl font-black">{stat.value}</h3>
          </Link>
        ))}
      </div>

      <form onSubmit={onFilter} className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc SKU..."
          className="flex-1 min-w-[240px] px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10"
        />
        <select value={brandInput} onChange={(e) => setBrandInput(e.target.value)} className="px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold">
          <option value="">Tất cả hãng</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <button className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-sm font-black">Lọc</button>
      </form>

      <div className="glass rounded-3xl overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {["Sản phẩm", "Cấu hình", "Giá", "Tồn kho", "Danh mục"].map((h) => (
                <th key={h} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">{h}</th>
              ))}
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.map((product) => (
              <AdminProductRow key={product.id} product={product} categories={categories} onChanged={reload} />
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="p-16 text-center text-zinc-500 font-medium">Không có sản phẩm nào phù hợp.</div>
        )}
      </div>
    </div>
  );
}
