import { Link } from "react-router";
import { ShoppingBag, ListChecks, Truck, MapPin, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ProductImage } from "@/components/products/ProductImage";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { formatVND, shortOrderId } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { ORDER_STATUS_COLOR, PAYMENT_METHOD_LABEL, type OrderStatusName } from "@shared/site";
import { OrderActionButtons } from "./OrderActionButtons";
import { OrderProgress } from "./OrderProgress";

interface BuyerOrder extends Order {
  items: {
    id: string;
    quantity: number;
    priceAtPurchase: number;
    product: { id: string; name: string; brand: string; imageUrl: string | null };
  }[];
  reviews: { productId: string }[];
}

export default function BuyerOrdersPage() {
  const { t } = useLanguage();
  useTitle(t("orders.title"));
  const { data, reload } = useApi<BuyerOrder[]>("/api/orders");
  const orders = data ?? [];

  return (
    <main className="min-h-screen bg-surface text-zinc-900 pb-20">
      <Navbar />

      <div className="container mx-auto px-4 md:px-12 pt-40 md:pt-44 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <ListChecks className="text-primary w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{t("orders.title")}</h1>
            <p className="text-zinc-500 font-medium">{t("orders.subtitle")}</p>
          </div>
        </div>

        <div className="space-y-6">
          {!data ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 bg-white rounded-3xl flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-100">
              <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-bold mb-4">{t("orders.empty")}</p>
              <Link to="/products" className="px-6 py-3 bg-primary text-white rounded-xl font-black text-sm">{t("cart.explore")}</Link>
            </div>
          ) : (
            orders.map((order) => {
              const status = order.status as OrderStatusName;
              const reviewed = new Set(order.reviews.map((r) => r.productId));
              return (
                <div key={order.id} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm">
                  <div className="px-6 py-4 bg-zinc-50/70 flex flex-wrap justify-between items-center border-b border-zinc-100 gap-3">
                    <div className="flex items-center gap-5">
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{t("orders.orderId")}</p>
                        <p className="text-sm font-black text-zinc-900">#{shortOrderId(order.id)}</p>
                      </div>
                      <div className="h-8 w-px bg-zinc-200" />
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{t("orders.purchaseDate")}</p>
                        <p className="text-sm font-bold text-zinc-600">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${order.paymentStatus === "PAID" ? "bg-green-50 text-green-600 border-green-100" : "bg-zinc-50 text-zinc-500 border-zinc-200"}`}>
                        {t(`payment.${order.paymentStatus}`)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${ORDER_STATUS_COLOR[status]}`}>
                        {t(`status.${status}`)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {status !== "CANCELLED" && <OrderProgress status={status} />}

                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center">
                          <Link to={`/products/${item.product.id}`} className="w-20 h-16 bg-zinc-50 rounded-xl border border-zinc-100 shrink-0 p-1">
                            <ProductImage imageUrl={item.product.imageUrl} name={item.product.name} brand={item.product.brand} showLabel={false} />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link to={`/products/${item.product.id}`} className="font-bold text-zinc-900 text-sm line-clamp-2 hover:text-primary">{item.product.name}</Link>
                            <p className="text-xs text-zinc-500 font-medium">{t("orders.quantity").replace("{count}", String(item.quantity))}</p>
                          </div>
                          <p className="font-bold text-zinc-900 text-sm">{formatVND(item.priceAtPurchase)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-xs">
                      <div className="flex gap-2 p-3 bg-zinc-50 rounded-xl">
                        <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div>
                          <p className="font-black text-zinc-700">{order.shippingName} · {order.shippingPhone}</p>
                          <p className="text-zinc-500">{order.shippingAddress}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 p-3 bg-zinc-50 rounded-xl">
                        <Truck className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div>
                          <p className="font-black text-zinc-700">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
                          <p className="text-zinc-500">{t("orders.tracking")}: {order.trackingCode || t("orders.noTracking")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-4 border-t border-zinc-100">
                      <div className="text-sm space-y-1">
                        <div className="flex gap-6 justify-between md:justify-start">
                          <span className="text-zinc-400 font-bold">{t("orders.subtotal")}</span>
                          <span className="font-bold">{formatVND(order.subTotal)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="flex gap-6 justify-between md:justify-start">
                            <span className="text-zinc-400 font-bold">{t("orders.voucherDiscount")}</span>
                            <span className="font-bold text-red-500">-{formatVND(order.discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex gap-6 justify-between md:justify-start items-center">
                          <span className="text-zinc-400 font-black uppercase text-xs">{t("orders.totalPayment")}</span>
                          <span className="text-xl font-black text-secondary">{formatVND(order.totalPayment)}</span>
                        </div>
                        <Link to={`/invoice/${order.id}`} target="_blank" className="inline-block text-xs font-bold text-primary hover:underline">
                          In hóa đơn →
                        </Link>
                      </div>

                      <OrderActionButtons
                        orderId={order.id}
                        status={status}
                        unreviewedItems={order.items
                          .filter((i) => !reviewed.has(i.product.id))
                          .map((i) => ({ productId: i.product.id, name: i.product.name }))}
                        onChanged={reload}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
