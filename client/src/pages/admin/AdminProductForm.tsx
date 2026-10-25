import { useState } from "react";
import { Plus, X, Edit2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { api, ApiError, apiAction } from "@/lib/api";
import { BRANDS } from "@shared/site";
import { ProductImage } from "@/components/products/ProductImage";
import { blockNegativeKeys } from "@/lib/inputs";

interface AdminProductFormProps {
  product?: any; // Có product = chế độ sửa
  mode?: "create" | "edit";
  categories?: { id: string; name: string }[];
  /** Tải lại danh sách sau khi lưu */
  onSaved: () => void;
}

const inputClass =
  "w-full bg-zinc-50 border border-zinc-100 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 ring-primary/20 outline-none transition-all";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">{label}</label>
      {children}
    </div>
  );
}

export function AdminProductForm({ product, mode = "create", categories = [], onSaved }: AdminProductFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const p = product || {};
  const [imageUrl, setImageUrl] = useState<string>(p.imageUrl || "");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh phải nhỏ hơn 5MB");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const data = await api<{ url: string }>("/api/admin/upload", { method: "POST", body });
      setImageUrl(data.url);
      toast.success("Đã tải ảnh lên");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Đã có lỗi kết nối");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(form), isFeatured: form.get("isFeatured") === "on" };
    try {
      const res = mode === "edit" && product
        ? await apiAction("PUT", `/api/admin/products/${product.id}`, body)
        : await apiAction("POST", "/api/admin/products", body);

      if (res.success) {
        toast.success(mode === "edit" ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm mới");
        setIsOpen(false);
        if (mode === "create") setImageUrl("");
        onSaved();
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {mode === "create" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white font-black rounded-2xl hover:bg-primary-dark active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Thêm laptop mới
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white rounded-xl transition-all text-zinc-400 hover:text-primary shadow-sm"
          title="Sửa sản phẩm"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 20 }}
              className="relative w-full max-w-4xl bg-white p-6 md:p-8 rounded-3xl shadow-2xl my-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
                    {mode === "edit" ? "Cập nhật sản phẩm" : "Thêm laptop mới"}
                  </h3>
                  <p className="text-zinc-500 text-sm font-medium">Các trường có dấu * là bắt buộc</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="p-2.5 hover:bg-zinc-100 rounded-xl transition-all text-zinc-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <section className="space-y-4">
                  <h4 className="text-sm font-black text-primary uppercase tracking-widest">Thông tin chung</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Tên sản phẩm *" className="md:col-span-2">
                      <input name="name" required defaultValue={p.name} placeholder="VD: ASUS Vivobook 15 X1504VA i5-1335U/16GB/512GB" className={inputClass} />
                    </Field>
                    <Field label="Mã SKU *">
                      <input name="sku" required defaultValue={p.sku} placeholder="VD: ASU-011" className={`${inputClass} uppercase`} />
                    </Field>
                    <Field label="Hãng *">
                      <input name="brand" required list="brand-options" defaultValue={p.brand} placeholder="Chọn hoặc nhập hãng" className={inputClass} />
                      <datalist id="brand-options">
                        {BRANDS.map((b) => <option key={b} value={b} />)}
                      </datalist>
                    </Field>
                    <Field label="Danh mục">
                      <select name="categoryId" defaultValue={p.categoryId || ""} className={inputClass}>
                        <option value="">-- Chưa phân loại --</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Màu sắc">
                      <input name="color" defaultValue={p.color} placeholder="VD: Bạc" className={inputClass} />
                    </Field>
                    <Field label="Giá bán (VNĐ) *">
                      <input name="price" type="number" onKeyDown={blockNegativeKeys} required min="0" step="1000" defaultValue={p.price ?? ""} placeholder="15990000" className={inputClass} />
                    </Field>
                    <Field label="Giá niêm yết (VNĐ)">
                      <input name="originalPrice" type="number" onKeyDown={blockNegativeKeys} min="0" step="1000" defaultValue={p.originalPrice ?? ""} placeholder="Để trống nếu không giảm giá" className={inputClass} />
                    </Field>
                    <Field label="Tồn kho *">
                      <input name="stockQuantity" type="number" onKeyDown={blockNegativeKeys} required min="0" defaultValue={p.stockQuantity ?? 10} className={inputClass} />
                    </Field>
                    <Field label="Bảo hành (tháng)">
                      <input name="warrantyMonths" type="number" onKeyDown={blockNegativeKeys} min="0" defaultValue={p.warrantyMonths ?? 12} className={inputClass} />
                    </Field>
                  </div>
                  <Field label="Ảnh sản phẩm">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-40 h-32 shrink-0 bg-white border border-zinc-100 rounded-xl p-2">
                        <ProductImage
                          key={imageUrl}
                          imageUrl={imageUrl || null}
                          name={p.name || "Ảnh xem trước"}
                          brand={p.brand || ""}
                          showLabel={false}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-black cursor-pointer hover:bg-primary/5 transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          <Upload className="w-4 h-4" />
                          {uploading ? "Đang tải ảnh..." : "Tải ảnh từ máy"}
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
                        </label>
                        <input
                          name="imageUrl"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="Hoặc dán link ảnh https://... (để trống sẽ dùng ảnh minh họa)"
                          className={inputClass}
                        />
                        <p className="text-xs text-zinc-400 font-medium">JPG, PNG hoặc WEBP, tối đa 5MB. Nên dùng ảnh vuông nền trắng, mỗi máy một ảnh riêng.</p>
                      </div>
                    </div>
                  </Field>
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-600 cursor-pointer">
                    <input type="checkbox" name="isFeatured" defaultChecked={p.isFeatured} className="w-4 h-4 rounded" />
                    Hiển thị ở mục "Sản phẩm nổi bật" trên trang chủ
                  </label>
                </section>

                <section className="space-y-4">
                  <h4 className="text-sm font-black text-primary uppercase tracking-widest">Thông số kỹ thuật</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="CPU *" className="md:col-span-2">
                      <input name="cpu" required defaultValue={p.cpu} placeholder="VD: Intel Core i5-1335U (10 nhân 12 luồng, tối đa 4.6GHz)" className={inputClass} />
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="RAM *" className="col-span-2">
                        <input name="ram" required defaultValue={p.ram} placeholder="16GB DDR5 4800MHz" className={inputClass} />
                      </Field>
                      <Field label="RAM (GB) *">
                        <input name="ramGb" type="number" onKeyDown={blockNegativeKeys} required min="1" defaultValue={p.ramGb ?? ""} placeholder="16" className={inputClass} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Ổ cứng *" className="col-span-2">
                        <input name="storage" required defaultValue={p.storage} placeholder="512GB SSD M.2 PCIe NVMe" className={inputClass} />
                      </Field>
                      <Field label="Ổ cứng (GB) *">
                        <input name="storageGb" type="number" onKeyDown={blockNegativeKeys} required min="1" defaultValue={p.storageGb ?? ""} placeholder="512" className={inputClass} />
                      </Field>
                    </div>
                    <Field label="Card đồ họa *">
                      <input name="gpu" required defaultValue={p.gpu} placeholder="NVIDIA GeForce RTX 4050 6GB" className={inputClass} />
                    </Field>
                    <Field label="Màn hình *">
                      <input name="display" required defaultValue={p.display} placeholder='15.6 inch Full HD (1920 x 1080), 144Hz' className={inputClass} />
                    </Field>
                    <Field label="Pin">
                      <input name="battery" defaultValue={p.battery} placeholder="4 cell 90Wh" className={inputClass} />
                    </Field>
                    <Field label="Trọng lượng">
                      <input name="weight" defaultValue={p.weight} placeholder="1.65 kg" className={inputClass} />
                    </Field>
                    <Field label="Hệ điều hành">
                      <input name="os" defaultValue={p.os ?? "Windows 11 Home bản quyền"} className={inputClass} />
                    </Field>
                    <Field label="Kết nối không dây">
                      <input name="connectivity" defaultValue={p.connectivity} placeholder="Wi-Fi 6, Bluetooth 5.3" className={inputClass} />
                    </Field>
                    <Field label="Cổng kết nối" className="md:col-span-2">
                      <input name="ports" defaultValue={p.ports} placeholder="1 x USB-C, 2 x USB-A 3.2, 1 x HDMI, 1 x jack 3.5mm" className={inputClass} />
                    </Field>
                  </div>
                </section>

                <Field label="Mô tả chi tiết (dòng bắt đầu bằng ## là tiêu đề mục)">
                  <textarea
                    name="description"
                    rows={8}
                    defaultValue={p.description}
                    placeholder={"Đoạn giới thiệu sản phẩm...\n\n## Hiệu năng\nNội dung..."}
                    className={`${inputClass} resize-y font-medium`}
                  />
                </Field>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-3.5 rounded-xl font-black text-sm text-zinc-500 hover:bg-zinc-50 border border-zinc-200 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="flex-[2] bg-primary text-white font-black py-3.5 rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? "Đang lưu..." : (mode === "edit" ? "Lưu thay đổi" : "Thêm sản phẩm")}
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
