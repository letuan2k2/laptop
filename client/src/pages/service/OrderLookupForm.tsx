import { useState } from "react";
import { Link } from "react-router";
import { Search, Loader2, Truck, MapPin } from "lucide-react";
import { apiAction } from "@/lib/api";
import { OrderProgress } from "../buyer/OrderProgress";
import { formatVND } from "@/lib/utils";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, type OrderStatusName } from "@shared/site";
import { phoneInputProps } from "@/lib/inputs";

type Result =
  | { success: false; error?: string }
  | {
      success: true;
      order: {
        code: string;
        status: string;
        paymentMethod: string;
        paymentStatus: string;
        trackingCode: string | null;
        createdAt: string;
        updatedAt: string;
        shippingName: string | null;
        shippingAddress: string | null;
        subTotal: number;
        discountAmount: number;
        totalPayment: number;
        items: { productId: string; name: string; quantity: number; price: number }[];
      };
    };

export function OrderLookupForm() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult((await apiAction("POST", "/api/service/order-lookup", { code, phone })) as unknown as Result);
    setLoading(false);
  };

  const order = result?.success ? result.order : null;
  const status = order?.status as OrderStatusName | undefined;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-zinc-100 p-6 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
        <input
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Mã đơn hàng"
          className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-primary/20"
        />
        <input
          required
          {...phoneInputProps}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Số điện thoại nhận hàng"
          className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          disabled={loading}
          className="px-6 py-3 bg-primary text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Tra cứu
        </button>
      </form>

      {result && !result.success && (
        <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-sm font-bold text-red-600">{result.error}</div>
      )}

      {order && status && (
        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
          <div className="px-6 py-4 bg-zinc-50 flex flex-wrap justify-between items-center gap-3 border-b border-zinc-100">
            <div>
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Đơn hàng</p>
              <p className="text-lg font-black">#{order.code}</p>
              <p className="text-xs text-zinc-500">Đặt lúc {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black border ${ORDER_STATUS_COLOR[status]}`}>
              {ORDER_STATUS_LABEL[status]}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {status !== "CANCELLED" && <OrderProgress status={status} />}

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.productId} className="flex justify-between gap-4 text-sm">
                  <Link to={`/products/${item.productId}`} className="font-bold text-zinc-800 hover:text-primary">
                    {item.quantity} × {item.name}
                  </Link>
                  <span className="font-bold shrink-0">{formatVND(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-3 text-xs">
              <div className="flex gap-2 p-3 bg-zinc-50 rounded-xl">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <p className="font-black text-zinc-700">{order.shippingName}</p>
                  <p className="text-zinc-500">{order.shippingAddress}</p>
                </div>
              </div>
              <div className="flex gap-2 p-3 bg-zinc-50 rounded-xl">
                <Truck className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <p className="font-black text-zinc-700">
                    {PAYMENT_METHOD_LABEL[order.paymentMethod]} · {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                  </p>
                  <p className="text-zinc-500">Mã vận đơn: {order.trackingCode || "Chưa có"}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 text-sm space-y-1">
              {order.discountAmount > 0 && (
                <div className="flex justify-between"><span className="text-zinc-500">Giảm giá</span><span className="font-bold text-red-500">-{formatVND(order.discountAmount)}</span></div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-bold">Tổng thanh toán</span>
                <span className="text-xl font-black text-secondary">{formatVND(order.totalPayment)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
