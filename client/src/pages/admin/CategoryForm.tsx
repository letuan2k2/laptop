import { useState } from "react";
import { Plus, X, Layers, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiAction } from "@/lib/api";

interface CategoryFormProps {
  category?: any; // If provided, we are in edit mode
  mode?: "create" | "edit";
  onSaved: () => void;
}

export function CategoryForm({ category, mode = "create", onSaved }: CategoryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const body = { name: formData.get("name") };
      const res = mode === "edit" && category
        ? await apiAction("PUT", `/api/admin/categories/${category.id}`, body)
        : await apiAction("POST", "/api/admin/categories", body);

      if (res.success) {
        setIsOpen(false);
        onSaved();
      } else {
        alert(res.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error(error);
      alert("Đã có lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {mode === "create" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Thêm danh mục
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-white rounded-xl transition-all text-zinc-400 hover:text-primary shadow-sm hover:shadow-md"
          title="Sửa danh mục"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white p-10 rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-black text-zinc-900 tracking-tight">
                    {mode === "edit" ? "Cập nhật danh mục" : "Thêm danh mục mới"}
                  </h3>
                  <p className="text-zinc-500 font-medium">Danh mục theo nhu cầu sử dụng</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="p-3 hover:bg-zinc-100 rounded-2xl transition-all text-zinc-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-4">Tên danh mục</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      name="name"
                      type="text"
                      required
                      defaultValue={category?.name}
                      placeholder="Ví dụ: Laptop Sinh viên"
                      className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-black text-sm text-zinc-400 hover:bg-zinc-50 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? "Đang lưu..." : (mode === "edit" ? "Cập nhật ngay" : "Thêm ngay")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
