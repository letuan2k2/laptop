import { Link, useParams } from "react-router";
import { CheckCircle2, ShoppingBag, ChevronRight, Home, Package, MapPin, CreditCard, Loader2, Printer } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { formatVND, shortOrderId } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";
import { PAYMENT_METHOD_LABEL } from "@shared/site";
import NotFoundPage from "../NotFoundPage";
import { SuccessLayout } from "./SuccessLayout";

export default function OrderSuccessPage() {
  const { orderId = "" } = useParams();
  const { t } = useLanguage();
  useTitle(t("success.title"));
  const { data: order, error } = useApi<Order & { items: OrderItem[] }>(`/api/orders/${orderId}`);

  if (error) return <NotFoundPage />;
  if (!order) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </main>
    );
  }

  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <main className="min-h-screen bg-surface pb-20">
      <Navbar />

      <div className="container mx-auto px-4 pt-44 max-w-4xl">
        <SuccessLayout>
          <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-primary/5 border border-zinc-100 flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 relative">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping opacity-20" />
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4 tracking-tight">{t("success.title")}</h1>
            <p className="text-zinc-500 font-medium max-w-md mx-auto mb-10">{t("success.desc")}</p>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="bg-zinc-50 p-5 rounded-3xl border border-zinc-100 text-left">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <Package className="w-3.5 h-3.5" />
                  {t("success.order")}
                </div>
                <p className="text-sm font-black text-zinc-900">#{shortOrderId(order.id)}</p>
                <p className="text-[11px] text-zinc-500 font-bold">{t("success.items").replace("{count}", String(totalItems))}</p>
              </div>

              <div className="bg-zinc-50 p-5 rounded-3xl border border-zinc-100 text-left">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <CreditCard className="w-3.5 h-3.5" />
                  {t("success.payment")}
                </div>
                <p className="text-sm font-black text-zinc-900">{formatVND(order.totalPayment)}</p>
                <p className="text-[11px] text-zinc-500 font-bold">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
              </div>

              <div className="bg-zinc-50 p-5 rounded-3xl border border-zinc-100 text-left">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <MapPin className="w-3.5 h-3.5" />
                  {t("success.address")}
                </div>
                <p className="text-sm font-black text-zinc-900 truncate">{order.shippingName}</p>
                <p className="text-[11px] text-zinc-500 font-bold truncate">{order.shippingAddress}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Link
                to="/buyer/orders"
                className="px-8 py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-all active:scale-95"
              >
                {t("success.viewOrder")} <ShoppingBag className="w-4 h-4" />
              </Link>
              <Link
                to="/products"
                className="px-8 py-4 bg-white text-zinc-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all border border-zinc-200 active:scale-95"
              >
                {t("success.continueShopping")} <Home className="w-4 h-4" />
              </Link>
              <Link
                to={`/invoice/${order.id}`}
                target="_blank"
                className="px-8 py-4 bg-white text-zinc-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all border border-zinc-200 active:scale-95"
              >
                {t("success.printInvoice")} <Printer className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="mt-8 p-6 bg-white rounded-3xl border border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-zinc-900">{t("success.infoTitle")}</h4>
                <p className="text-xs text-zinc-500 font-bold mt-0.5">{t("success.infoDesc")}</p>
              </div>
            </div>
            <Link to="/buyer/orders" className="flex items-center gap-2 text-primary font-black text-sm group">
              {t("success.trackOrder")} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </SuccessLayout>
      </div>
    </main>
  );
}
