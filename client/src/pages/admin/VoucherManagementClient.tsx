import { useState } from "react";
import { 
  Tag, 
  Plus, 
  Trash2, 
  Power, 
} from "lucide-react";
import { VoucherForm } from "./VoucherForm";
import { apiAction } from "@/lib/api";
import type { Voucher } from "@/lib/types";
import { toast } from "react-hot-toast";

export function VoucherManagementClient({ vouchers, onChanged }: { vouchers: Voucher[]; onChanged: () => void }) {
  const [showVoucherForm, setShowVoucherForm] = useState(false);

  const handleToggleVoucher = async (id: string, currentStatus: boolean) => {
    const res = await apiAction("PATCH", `/api/admin/vouchers/${id}`, { isActive: !currentStatus });
    if (res.success) onChanged();
    else toast.error(res.error || "Không thể cập nhật trạng thái");
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mã này?")) return;
    const res = await apiAction("DELETE", `/api/admin/vouchers/${id}`);
    if (res.success) onChanged();
    else toast.error(res.error || "Không thể xóa mã giảm giá");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
         <div>
           <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Quản lý mã giảm giá</h3>
           <p className="text-zinc-500 text-sm font-medium">Tạo và quản lý các chương trình khuyến mãi toàn sàn</p>
         </div>
         <button 
          onClick={() => setShowVoucherForm(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
         >
           <Plus size={18} />
           <span>Thêm mã mới</span>
         </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {vouchers.map((voucher) => (
          <div key={voucher.id} className="glass group">
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${voucher.isActive ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-400'}`}>
                     <Tag size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-zinc-900 leading-none">{voucher.code}</h4>
                    <p className="text-xs font-bold text-zinc-400 mt-2 uppercase tracking-widest leading-none">
                      {voucher.discountType === 'PERCENTAGE' ? `Giảm ${voucher.discountValue}%` : `Giảm ${new Intl.NumberFormat('vi-VN').format(voucher.discountValue)}đ`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleVoucher(voucher.id, voucher.isActive)}
                    className={`p-2.5 rounded-xl transition-all ${voucher.isActive ? 'bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                    title={voucher.isActive ? "Tạm dừng" : "Kích hoạt"}
                  >
                    <Power size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteVoucher(voucher.id)}
                    className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <p className="text-sm font-medium text-zinc-500 line-clamp-2 min-h-[40px] mb-6">
                {voucher.description || "Không có mô tả"}
              </p>

              <div className="pt-6 border-t border-zinc-100 grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Đã dùng</p>
                   <p className="text-sm font-black text-zinc-900">{voucher.usedCount} / {voucher.usageLimit}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Hết hạn</p>
                   <p className="text-sm font-black text-zinc-900">
                     {voucher.expiryDate ? new Date(voucher.expiryDate).toLocaleDateString('vi-VN') : "Không thời hạn"}
                   </p>
                 </div>
              </div>
            </div>
          </div>
        ))}
        
        {vouchers.length === 0 && (
          <div className="col-span-full py-20 bg-zinc-50 rounded-[40px] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center text-zinc-300 mb-6">
              <Tag size={32} />
            </div>
            <h4 className="text-lg font-black text-zinc-900">Chưa có mã giảm giá nào</h4>
            <p className="text-zinc-500 text-sm font-medium mt-2 max-w-sm px-10">
              Bắt đầu tạo các chương trình khuyến mãi đầu tiên để kích thích người mua hàng.
            </p>
          </div>
        )}
      </div>

      {showVoucherForm && <VoucherForm onClose={() => setShowVoucherForm(false)} onCreated={onChanged} />}
    </div>
  );
}
