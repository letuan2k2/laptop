import { useState } from "react";
import { X, Percent, Tag, Calendar, Hash } from "lucide-react";
import { apiAction } from "@/lib/api";
import { blockNegativeKeys } from "@/lib/inputs";

export function VoucherForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderAmount: "",
    maxDiscount: "",
    usageLimit: "100",
    expiryDate: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiAction("POST", "/api/admin/vouchers", {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        usageLimit: Number(formData.usageLimit) || 100,
      });

      if (res.success) {
        onClose();
        onCreated();
      } else {
        setError(res.error || "Có lỗi xảy ra");
      }
    } catch {
      setError("Đã có lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="px-10 py-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Tạo mã giảm giá mới</h3>
            <p className="text-zinc-500 text-sm font-medium">Thiết lập chương trình khuyến mãi cho khách hàng</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-2xl transition-colors shadow-sm">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 italic">
              * {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Mã CODE</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  required
                  type="text"
                  placeholder="VÍ DỤ: LAPTOP10"
                  className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 ring-primary/20 transition-all uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Loại giảm giá</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-50 rounded-2xl">
                <button
                  type="button"
                  className={`py-3 rounded-xl text-xs font-black transition-all ${formData.discountType === 'PERCENTAGE' ? 'bg-white shadow-sm text-primary' : 'text-zinc-400'}`}
                  onClick={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
                >
                  Phần trăm (%)
                </button>
                <button
                  type="button"
                  className={`py-3 rounded-xl text-xs font-black transition-all ${formData.discountType === 'FIXED_AMOUNT' ? 'bg-white shadow-sm text-primary' : 'text-zinc-400'}`}
                  onClick={() => setFormData({ ...formData, discountType: 'FIXED_AMOUNT' })}
                >
                  Số tiền (đ)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">
                Giá trị giảm {formData.discountType === 'PERCENTAGE' ? '(%)' : '(VNĐ)'}
              </label>
              <div className="relative">
                {formData.discountType === 'PERCENTAGE' ? (
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                ) : (
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                )}
                <input
                  required
                  type="number" onKeyDown={blockNegativeKeys}
                  min="0"
                  placeholder="0"
                  className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 ring-primary/20 transition-all"
                  value={formData.discountValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || Number(value) >= 0) {
                      setFormData({ ...formData, discountValue: value });
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Đơn tối thiểu (VNĐ)</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="number" onKeyDown={blockNegativeKeys}
                  min="0"
                  placeholder="0"
                  className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 ring-primary/20 transition-all"
                  value={formData.minOrderAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || Number(value) >= 0) {
                      setFormData({ ...formData, minOrderAmount: value });
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Lượt sử dụng tối đa</label>
              <input
                type="number" onKeyDown={blockNegativeKeys}
                min="1"
                className="w-full bg-zinc-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-primary/20 transition-all"
                value={formData.usageLimit}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || Number(value) >= 0) {
                    setFormData({ ...formData, usageLimit: value });
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Ngày hết hạn</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="date"
                  className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 ring-primary/20 transition-all"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Mô tả chương trình</label>
            <textarea
              placeholder="Ví dụ: Giảm giá đặc biệt hè 2024..."
              className="w-full bg-zinc-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-primary/20 transition-all h-24 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-black text-sm text-zinc-400 hover:bg-zinc-50 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              disabled={loading}
              className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Tạo mã ngay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
