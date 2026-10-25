import { Layers, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiAction, useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { CategoryForm } from "./CategoryForm";

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

export default function AdminCategoriesPage() {
  useTitle("Quản lý danh mục");
  const { data, reload } = useApi<AdminCategory[]>("/api/admin/categories");
  if (!data) {
    return (
      <div className="py-32 flex justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  const categories = data;

  const handleDelete = async (cat: AdminCategory) => {
    const warn = cat._count.products > 0 ? ` ${cat._count.products} sản phẩm sẽ chuyển về "Chưa phân loại".` : "";
    if (!confirm(`Xóa danh mục "${cat.name}"?${warn}`)) return;
    const res = await apiAction("DELETE", `/api/admin/categories/${cat.id}`);
    if (res.success) reload();
    else toast.error(res.error || "Không thể xóa danh mục");
  };

  const handleSeed = async () => {
    const res = await apiAction("POST", "/api/admin/categories/seed");
    if (res.success) reload();
    else toast.error(res.error || "Không thể tạo danh mục");
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Quản lý danh mục</h2>
          <p className="text-zinc-500 font-medium">Phân loại laptop theo nhu cầu sử dụng (gaming, văn phòng, đồ họa...)</p>
        </div>
        <CategoryForm mode="create" onSaved={reload} />
      </div>

      <div className="glass rounded-[32px] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">Tên danh mục</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">Slug</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">Sản phẩm</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 text-right whitespace-nowrap">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Layers size={18} />
                    </div>
                    <span className="font-bold text-zinc-900">{cat.name}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-zinc-500 font-medium text-sm">{cat.slug}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-zinc-700 font-bold text-sm">{cat._count.products}</span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <CategoryForm mode="edit" category={cat} onSaved={reload} />
                    
                    <button
                        onClick={() => handleDelete(cat)}
                        className="p-2 hover:bg-white rounded-xl transition-all text-zinc-400 hover:text-red-500 shadow-sm hover:shadow-md"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {categories.length === 0 && (
          <div className="p-20 text-center space-y-6">
             <div className="w-16 h-16 bg-zinc-50 rounded-3xl mx-auto flex items-center justify-center text-zinc-200">
               <Layers size={32} />
             </div>
             <div className="space-y-2">
               <p className="text-zinc-500 font-medium">Chưa có danh mục nào trên hệ thống.</p>
               <p className="text-zinc-400 text-sm">Bạn có thể khởi tạo các danh mục mặc định để bắt đầu.</p>
             </div>
               <button
                 onClick={handleSeed}
                 className="px-6 py-3 bg-secondary text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20"
               >
                 Khởi tạo danh mục mặc định
               </button>
          </div>
        )}
      </div>
    </div>
  );
}
