import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ShoppingBag, Search, MapPin, Phone, Loader2 } from "lucide-react";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { formatVND, shortOrderId } from "@/lib/utils";
import type { Order } from "@/lib/types";
import {
  ORDER_STATUSES,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  type OrderStatusName,
} from "@shared/site";
import { AdminOrderActions } from "./AdminOrderActions";

interface AdminOrder extends Order {
  user: { name: string; email: string };
  items: { id: string; quantity: number; product: { name: string } }[];
}

export default function AdminOrdersPage() {
  useTitle("Quản lý đơn hàng");
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const query = searchParams.get("q") || "";
  const validStatus = ORDER_STATUSES.includes(statusFilter as OrderStatusName) ? (statusFilter as OrderStatusName) : undefined;
  const [search, setSearch] = useState(query);

  const { data, reload } = useApi<{ orders: AdminOrder[]; counts: Record<string, number> }>(
    `/api/admin/orders?${new URLSearchParams({ status: validStatus ?? "", q: query })}`
  );
  if (!data) {
    return (
      <div className="py-32 flex justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const { orders, counts } = data;
  const countOf = (s: OrderStatusName) => counts[s] || 0;
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (search.trim()) next.set("q", search.trim());
    else next.delete("q");
    setSearchParams(next);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Quản lý đơn hàng</h2>
          <p className="text-zinc-500 font-medium">Xác nhận, đóng gói, giao hàng và theo dõi trạng thái đơn</p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Chờ xác nhận", value: countOf("PENDING"), color: "text-orange-500" },
            { label: "Đang giao", value: countOf("SHIPPING"), color: "text-blue-500" },
            { label: "Hoàn tất", value: countOf("COMPLETED"), color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="px-5 py-3 rounded-2xl border border-zinc-100 bg-white flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{s.label}</span>
              <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={onSearch} className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã đơn, tên, SĐT hoặc email khách..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10"
          />
        </form>
        <div className="flex flex-wrap bg-white p-1.5 rounded-xl border border-zinc-200 gap-1">
          <Link
            to="/admin/orders"
            className={`px-3 py-2 rounded-lg text-[11px] font-black transition-all ${!validStatus ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
          >
            Tất cả ({total})
          </Link>
          {ORDER_STATUSES.map((s) => (
            <Link
              key={s}
              to={`/admin/orders?status=${s}`}
              className={`px-3 py-2 rounded-lg text-[11px] font-black transition-all ${validStatus === s ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              {ORDER_STATUS_LABEL[s]} ({countOf(s)})
            </Link>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl overflow-x-auto">
        <table className="w-full text-left min-w-[1100px]">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50">
              {["Đơn hàng", "Khách hàng / Giao đến", "Sản phẩm", "Thanh toán", "Trạng thái", "Tổng tiền", "Xử lý"].map((h) => (
                <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center opacity-30">
                    <ShoppingBag className="w-14 h-14 mb-3" />
                    <p className="font-black uppercase tracking-widest text-sm">Không có đơn hàng nào</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const status = order.status as OrderStatusName;
                return (
                  <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors align-top">
                    <td className="px-5 py-5">
                      <p className="text-xs font-black text-zinc-900 mb-1">#{shortOrderId(order.id)}</p>
                      <p className="text-[11px] text-zinc-400 font-bold">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
                      {order.trackingCode && <p className="text-[11px] text-blue-500 font-bold mt-1">MVĐ: {order.trackingCode}</p>}
                    </td>
                    <td className="px-5 py-5 max-w-[240px]">
                      <p className="text-xs font-black text-zinc-900">{order.user.name}</p>
                      <p className="text-[11px] text-zinc-400">{order.user.email}</p>
                      <p className="text-[11px] text-zinc-600 mt-2 flex items-center gap-1"><Phone className="w-3 h-3" />{order.shippingName} · {order.shippingPhone}</p>
                      <p className="text-[11px] text-zinc-500 flex gap-1"><MapPin className="w-3 h-3 shrink-0 mt-0.5" />{order.shippingAddress}</p>
                      {order.note && <p className="text-[11px] text-amber-600 mt-1 italic">Ghi chú: {order.note}</p>}
                    </td>
                    <td className="px-5 py-5 max-w-[260px]">
                      {order.items.map((item) => (
                        <p key={item.id} className="text-xs font-semibold text-zinc-800 line-clamp-1">
                          {item.quantity} × {item.product.name}
                        </p>
                      ))}
                    </td>
                    <td className="px-5 py-5">
                      <p className="text-xs font-bold text-zinc-700">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
                      <p className={`text-[11px] font-black ${order.paymentStatus === "PAID" ? "text-green-600" : "text-zinc-400"}`}>
                        {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                      </p>
                    </td>
                    <td className="px-5 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border whitespace-nowrap ${ORDER_STATUS_COLOR[status]}`}>
                        {ORDER_STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <p className="text-sm font-black text-zinc-900">{formatVND(order.totalPayment)}</p>
                      {order.discountAmount > 0 && (
                        <p className="text-[11px] text-red-500 font-bold">Voucher: -{formatVND(order.discountAmount)}</p>
                      )}
                    </td>
                    <td className="px-5 py-5">
                      <AdminOrderActions orderId={order.id} status={status} onChanged={reload} />
                      <Link to={`/invoice/${order.id}`} target="_blank" className="block mt-2 text-[11px] font-bold text-primary hover:underline">In hóa đơn</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
