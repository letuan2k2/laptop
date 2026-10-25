import { useState } from "react";
import { 
  Settings, 
  CreditCard, 
  ShieldCheck, 
  Globe, 
  Mail,
  ChevronRight
} from "lucide-react";
import { SITE } from "@shared/site";

export function SettingsClient() {
  const [activeTab, setActiveTab ] = useState<"general" | "finance">("general");


  return (
    <div className="flex flex-col lg:flex-row gap-10">
      {/* Settings Navigation */}
      <div className="w-full lg:w-80 space-y-2">
        {[
          { id: "general", label: "Cấu hình chung", icon: Globe },
          { id: "finance", label: "Thanh toán & đơn hàng", icon: CreditCard },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`w-full flex items-center justify-between px-6 py-5 rounded-3xl font-black text-sm transition-all ${
              activeTab === tab.id 
              ? "bg-white shadow-xl shadow-zinc-200/50 text-primary border-2 border-primary/5" 
              : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            }`}
          >
            <div className="flex items-center gap-4">
               <tab.icon size={20} />
               <span>{tab.label}</span>
            </div>
            {activeTab === tab.id && <ChevronRight size={18} />}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="flex-1">

        {activeTab === "finance" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Thanh toán & đơn hàng</h3>
              <p className="text-zinc-500 text-sm font-medium">Quy tắc xử lý thanh toán, hủy đơn và tích điểm đang áp dụng</p>
            </div>

            <div className="glass p-10 space-y-8">
              {[
                { title: "Thanh toán khi nhận hàng (COD)", desc: "Đơn COD chuyển sang “Đã thanh toán” khi cửa hàng cập nhật trạng thái “Đã giao hàng”." },
                { title: "VNPAY / MoMo (mô phỏng)", desc: "Cổng thanh toán đang chạy ở chế độ demo: đơn được ghi nhận “Đã thanh toán” ngay khi đặt. Khi tích hợp cổng thật cần xác thực callback (IPN) trước khi cập nhật." },
                { title: "Hủy đơn & hoàn tiền", desc: "Khách tự hủy được khi đơn ở trạng thái Chờ xác nhận / Đã xác nhận. Đơn đã thanh toán khi hủy sẽ chuyển sang “Đã hoàn tiền”, tồn kho và lượt dùng voucher được hoàn lại." },
                { title: "Tích điểm thành viên", desc: "Mỗi 10.000đ trên đơn hoàn tất = 1 điểm. Hạng: Silver từ 2.000 điểm, Gold từ 5.000 điểm, Platinum từ 10.000 điểm." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h4 className="font-black text-zinc-900">{item.title}</h4>
                    <p className="text-sm font-medium text-zinc-500 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "general" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Cấu hình chung</h3>
              <p className="text-zinc-500 text-sm font-medium">Thông tin hiển thị và vận hành website</p>
            </div>

            <div className="glass p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Tên cửa hàng</label>
                   <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input type="text" readOnly value={SITE.name} className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-zinc-500" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Email hỗ trợ</label>
                   <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input type="text" readOnly value={SITE.email} className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-zinc-500" />
                   </div>
                </div>
              </div>

              <div className="p-6 bg-secondary/5 border border-secondary/10 rounded-[32px] flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center">
                       <Settings size={20} />
                    </div>
                    <div>
                       <p className="text-sm font-black text-zinc-900">Chế độ bảo trì (Maintenance Mode)</p>
                       <p className="text-xs font-medium text-zinc-500">Tạm dừng hoạt động toàn bộ website để nâng cấp</p>
                    </div>
                 </div>
                 <div className="w-14 h-8 bg-zinc-200 rounded-full relative cursor-not-allowed">
                    <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-sm" />
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
