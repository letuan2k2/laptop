import { useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { formatVND, shortOrderId } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { SITE, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, type OrderStatusName } from "@shared/site";
import NotFoundPage from "./NotFoundPage";
import { PrintButton } from "./PrintButton";

interface InvoiceOrder extends Order {
  user: { name: string; email: string };
  items: { id: string; quantity: number; priceAtPurchase: number; product: { name: string; sku: string; warrantyMonths: number } }[];
  voucher: { code: string } | null;
}

// Chủ đơn hoặc admin mới xem được (server kiểm tra quyền)
export default function InvoicePage() {
  const { orderId = "" } = useParams();
  useTitle("Hóa đơn bán hàng");
  const { data: order, error } = useApi<InvoiceOrder>(`/api/orders/${orderId}`);

  if (error) return <NotFoundPage />;
  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </main>
    );
  }

  const code = shortOrderId(order.id);

  return (
    <main className="min-h-screen bg-zinc-100 py-10 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto bg-white p-10 shadow-sm print:shadow-none text-sm text-zinc-800">
        <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-6 mb-6">
          <div>
            <p className="text-2xl font-black text-primary">{SITE.name}</p>
            <p className="text-xs text-zinc-500">{SITE.address}</p>
            <p className="text-xs text-zinc-500">Hotline: {SITE.hotline} · {SITE.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black uppercase">Hóa đơn bán hàng</p>
            <p className="text-xs">Số: <b>#{code}</b></p>
            <p className="text-xs">Ngày: {new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
          <div>
            <p className="font-black uppercase text-zinc-500 mb-1">Khách hàng</p>
            <p className="font-bold">{order.shippingName || order.user.name}</p>
            <p>{order.shippingPhone}</p>
            <p>{order.user.email}</p>
            <p>{order.shippingAddress}</p>
          </div>
          <div>
            <p className="font-black uppercase text-zinc-500 mb-1">Thông tin đơn hàng</p>
            <p>Trạng thái: <b>{ORDER_STATUS_LABEL[order.status as OrderStatusName]}</b></p>
            <p>Thanh toán: {PAYMENT_METHOD_LABEL[order.paymentMethod]} ({PAYMENT_STATUS_LABEL[order.paymentStatus]})</p>
            {order.trackingCode && <p>Mã vận đơn: {order.trackingCode}</p>}
          </div>
        </div>

        <table className="w-full text-xs border-collapse mb-6">
          <thead>
            <tr className="bg-zinc-100">
              <th className="border border-zinc-200 px-2 py-2 text-left">STT</th>
              <th className="border border-zinc-200 px-2 py-2 text-left">Sản phẩm</th>
              <th className="border border-zinc-200 px-2 py-2">Bảo hành</th>
              <th className="border border-zinc-200 px-2 py-2">SL</th>
              <th className="border border-zinc-200 px-2 py-2 text-right">Đơn giá</th>
              <th className="border border-zinc-200 px-2 py-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id}>
                <td className="border border-zinc-200 px-2 py-2">{i + 1}</td>
                <td className="border border-zinc-200 px-2 py-2">
                  <p className="font-bold">{item.product.name}</p>
                  <p className="text-zinc-500">Mã SP: {item.product.sku}</p>
                </td>
                <td className="border border-zinc-200 px-2 py-2 text-center">{item.product.warrantyMonths} tháng</td>
                <td className="border border-zinc-200 px-2 py-2 text-center">{item.quantity}</td>
                <td className="border border-zinc-200 px-2 py-2 text-right">{formatVND(item.priceAtPurchase)}</td>
                <td className="border border-zinc-200 px-2 py-2 text-right">{formatVND(Number(item.priceAtPurchase) * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto w-72 space-y-1 text-xs">
          <div className="flex justify-between"><span>Tiền hàng</span><span>{formatVND(order.subTotal)}</span></div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between"><span>Giảm giá {order.voucher ? `(${order.voucher.code})` : ""}</span><span>-{formatVND(order.discountAmount)}</span></div>
          )}
          <div className="flex justify-between"><span>Phí vận chuyển</span><span>Miễn phí</span></div>
          <div className="flex justify-between font-black text-base border-t border-zinc-900 pt-2 mt-2">
            <span>Tổng thanh toán</span><span>{formatVND(order.totalPayment)}</span>
          </div>
          <p className="text-[10px] text-zinc-500 text-right">Giá đã bao gồm VAT</p>
        </div>

        <p className="mt-10 text-center text-xs text-zinc-500">Cảm ơn quý khách đã mua hàng tại {SITE.name}!</p>
        <div className="mt-8 text-center print:hidden">
          <PrintButton />
        </div>
      </div>
    </main>
  );
}
