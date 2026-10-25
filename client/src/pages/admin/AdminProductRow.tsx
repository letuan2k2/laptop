import { Link } from "react-router";
import { Trash2, ExternalLink, Star } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiAction } from "@/lib/api";
import { AdminProductForm } from "./AdminProductForm";
import { ProductImage } from "@/components/products/ProductImage";
import { formatVND } from "@/lib/utils";

export function AdminProductRow({
  product,
  categories = [],
  onChanged,
}: {
  product: any;
  categories?: { id: string; name: string }[];
  onChanged: () => void;
}) {

  const handleDelete = async () => {
    if (!confirm(`Xóa sản phẩm "${product.name}"?`)) return;
    const res = await apiAction("DELETE", `/api/admin/products/${product.id}`);
    if (res.success) {
      toast.success("Đã xóa sản phẩm");
      onChanged();
    } else {
      toast.error(res.error || "Không thể xóa sản phẩm");
    }
  };

  return (
    <tr className="hover:bg-zinc-50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-12 rounded-lg bg-zinc-50 border border-zinc-100 flex-shrink-0 p-1">
            <ProductImage imageUrl={product.imageUrl} name={product.name} brand={product.brand} showLabel={false} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900 line-clamp-1 max-w-xs flex items-center gap-1.5">
              {product.isFeatured && <Star className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />}
              {product.name}
            </p>
            <p className="text-[11px] font-medium text-zinc-400 mt-0.5">{product.sku} · {product.brand}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs text-zinc-500 font-medium max-w-[220px]">
        <p className="truncate">{product.cpu.split("(")[0]}</p>
        <p className="truncate">{product.ramGb}GB RAM · {product.storageGb >= 1024 ? `${product.storageGb / 1024}TB` : `${product.storageGb}GB`}</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-black text-zinc-900">{formatVND(product.price)}</p>
        {product.originalPrice && product.originalPrice > product.price && (
          <p className="text-[11px] text-zinc-400 line-through">{formatVND(product.originalPrice)}</p>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
          product.stockQuantity === 0 ? "bg-red-50 text-red-500" : product.stockQuantity < 5 ? "bg-orange-50 text-orange-500" : "bg-green-50 text-green-600"
        }`}>
          {product.stockQuantity === 0 ? "Hết hàng" : `${product.stockQuantity} máy`}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-black text-zinc-500 whitespace-nowrap">
          {product.category?.name || "Chưa phân loại"}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link to={`/products/${product.id}`} target="_blank" className="p-2 bg-white rounded-xl text-zinc-400 hover:text-primary shadow-sm" title="Xem trên cửa hàng">
            <ExternalLink className="w-4 h-4" />
          </Link>
          <AdminProductForm mode="edit" product={product} categories={categories} onSaved={onChanged} />
          <button
            onClick={handleDelete}
            className="p-2 bg-white text-zinc-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all shadow-sm"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
