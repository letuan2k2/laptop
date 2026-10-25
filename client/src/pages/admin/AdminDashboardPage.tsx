import { Link } from "react-router";
import { Wallet, Users, Laptop, ShoppingBag, ArrowUpRight, AlertTriangle, Clock, TrendingUp, MessageSquare, Loader2 } from "lucide-react";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { formatVND, shortOrderId } from "@/lib/utils";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, type OrderStatusName } from "@shared/site";

interface Dashboard {
  revenueAll: number;
  revenueMonth: number;
  userCount: number;
  productCount: number;
  orderCount: number;
  pendingCount: number;
  lowStock: { id: string; name: string; stockQuantity: number }[];
  recentOrders: { id: string; status: string; createdAt: string; totalPayment: number; user: { name: string } }[];
  days: { label: string; total: number }[];
  topProducts: { id: string; name: string; quantity: number }[];
}

export default function AdminDashboardPage() {
  useTitle("Tổng quan");
  const { data } = useApi<Dashboard>("/api/admin/dashboard");
  if (!data) {
    return (
      <div className="py-32 flex justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const { revenueAll, revenueMonth, userCount, productCount, orderCount, pendingCount, lowStock, recentOrders, days, topProducts } = data;
  const maxDay = Math.max(...days.map((d) => d.total), 1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Doanh thu (đơn hoàn tất)", value: formatVND(revenueAll), sub: `Tháng này: ${formatVND(revenueMonth)}`, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
          { label: "Tổng đơn hàng", value: orderCount, sub: `${pendingCount} đơn chờ xác nhận`, icon: ShoppingBag, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Sản phẩm", value: productCount, sub: `${lowStock.length} mẫu sắp hết hàng`, icon: Laptop, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Khách hàng", value: userCount, sub: "Tài khoản đã đăng ký", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black">{stat.value}</h3>
            <p className="text-xs text-zinc-400 font-medium mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Biểu đồ 7 ngày */}
          <div className="glass p-6 rounded-3xl">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              Doanh số đặt hàng 7 ngày qua
            </h3>
            <div className="flex items-end gap-3 h-48">
              {days.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-zinc-500">{d.total > 0 ? `${(d.total / 1_000_000).toFixed(1)}tr` : ""}</span>
                  <div
                    className="w-full bg-primary/80 rounded-t-lg min-h-[4px]"
                    style={{ height: `${(d.total / maxDay) * 100}%` }}
                    title={formatVND(d.total)}
                  />
                  <span className="text-[11px] font-bold text-zinc-400">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Đơn mới */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Đơn hàng mới nhất
              </h3>
              <Link to="/admin/orders" className="text-sm text-primary hover:underline font-medium">Xem tất cả</Link>
            </div>
            <div className="glass rounded-3xl overflow-hidden">
              <table className="w-full text-left">
                <tbody className="divide-y divide-zinc-100">
                  {recentOrders.length === 0 && (
                    <tr><td className="px-6 py-10 text-center text-zinc-400 text-sm">Chưa có đơn hàng nào</td></tr>
                  )}
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50">
                      <td className="px-6 py-3.5 text-xs font-black">#{shortOrderId(o.id)}</td>
                      <td className="px-6 py-3.5 text-sm font-medium">{o.user.name}</td>
                      <td className="px-6 py-3.5 text-xs text-zinc-400">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${ORDER_STATUS_COLOR[o.status as OrderStatusName]}`}>
                          {ORDER_STATUS_LABEL[o.status as OrderStatusName]}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-black text-right">{formatVND(o.totalPayment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-3xl space-y-3">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" /> Bán chạy nhất
            </h3>
            {topProducts.length === 0 && <p className="text-sm text-zinc-400">Chưa có dữ liệu bán hàng</p>}
            {topProducts.map((item, i) => (
              <Link key={item.id} to={`/products/${item.id}`} className="flex items-center gap-3 text-sm hover:text-primary">
                <span className="w-6 h-6 rounded-full bg-zinc-100 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="flex-1 line-clamp-1 font-medium">{item.name}</span>
                <span className="font-black text-zinc-500">{item.quantity}</span>
              </Link>
            ))}
          </div>

          <div className="glass p-6 rounded-3xl space-y-3">
            <h3 className="font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Sắp hết hàng
            </h3>
            {lowStock.length === 0 && <p className="text-sm text-zinc-400">Tồn kho ổn định</p>}
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="line-clamp-1 font-medium">{p.name}</span>
                <span className={`font-black shrink-0 ${p.stockQuantity === 0 ? "text-red-500" : "text-orange-500"}`}>{p.stockQuantity}</span>
              </div>
            ))}
            <Link to="/admin/products?stock=low" className="flex items-center gap-1 text-sm text-primary font-bold pt-2">
              Quản lý tồn kho <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <Link to="/admin/chat" className="glass p-6 rounded-3xl flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black">Tin nhắn khách hàng</p>
              <p className="text-xs text-zinc-500">Trả lời tư vấn, hỗ trợ đơn hàng</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
