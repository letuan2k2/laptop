import { clearBuyNowItem, readBuyNowItem, useCart } from "@/lib/cart";
import { Navbar } from "@/components/layout/Navbar";
import {
  ChevronLeft,
  MapPin,
  Package,
  Ticket,
  CreditCard,
  Wallet,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  X,
  StickyNote,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { api, apiAction } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTitle } from "@/lib/useTitle";
import type { Voucher } from "@/lib/types";
import { ProductImage } from "@/components/products/ProductImage";
import { formatVND } from "@/lib/utils";
import { RANKS, type RankName } from "@shared/site";
import { phoneInputProps } from "@/lib/inputs";

type PaymentMethod = "COD" | "VNPAY" | "MOMO";

const PAYMENT_OPTIONS: { id: PaymentMethod; icon: any }[] = [
  { id: "COD", icon: Truck },
  { id: "VNPAY", icon: CreditCard },
  { id: "MOMO", icon: Wallet },
];

export default function CheckoutPage() {
  const { cart: allItems, selectedTotal, removeSelected, isLoaded } = useCart({ sync: true });
  // ?mode=buy-now: chỉ thanh toán sản phẩm vừa bấm "Mua ngay", giỏ hàng giữ nguyên
  const [searchParams] = useSearchParams();
  const [buyNowItem] = useState(() => (searchParams.get("mode") === "buy-now" ? readBuyNowItem() : null));
  const cart = buyNowItem ? [buyNowItem] : allItems.filter((item) => item.selected !== false);
  const total = buyNowItem ? buyNowItem.price * buyNowItem.quantity : selectedTotal;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  useTitle(t("checkout.title"));

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmount: number;
    description?: string | null;
  } | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [note, setNote] = useState("");

  const [shippingInfo, setShippingInfo] = useState({ name: "", phone: "", address: "" });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  // Khách chưa có địa chỉ nào trong sổ: đặt hàng xong sẽ lưu địa chỉ vừa nhập để lần sau không phải gõ lại
  const [hasSavedAddress, setHasSavedAddress] = useState(true);
  const [tempShippingInfo, setTempShippingInfo] = useState(shippingInfo);

  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);

  useEffect(() => {
    if (isLoaded && cart.length === 0 && !isProcessing && !isSuccess) {
      navigate("/cart");
    }
  }, [cart.length, navigate, isProcessing, isLoaded, isSuccess]);

  useEffect(() => {
    if (isLoaded) {
      api<Voucher[]>("/api/vouchers/active")
        .then(setAvailableVouchers)
        .catch(() => setAvailableVouchers([]));
    }
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded && user) {
      type Address = { name: string; phone: string; address: string; isDefault: boolean };
      api<Address[]>("/api/addresses").catch(() => [] as Address[]).then((addresses) => {
        if (addresses.length > 0) {
          const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
          setShippingInfo({
            name: defaultAddr.name,
            phone: defaultAddr.phone,
            address: defaultAddr.address,
          });
        } else {
          setHasSavedAddress(false);
          setIsAddressModalOpen(true);
        }
      });
    }
  }, [isLoaded, user]);

  // Giỏ hàng thay đổi thì voucher đã áp dụng có thể không còn đúng
  useEffect(() => {
    setAppliedVoucher(null);
  }, [total]);

  if (!isLoaded || (cart.length === 0 && !isProcessing && !isSuccess)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const finalDiscount = appliedVoucher?.discountAmount || 0;
  const grandTotal = total - finalDiscount;
  const hasAddress = !!(shippingInfo.name && shippingInfo.phone && shippingInfo.address);

  const handleApplyVoucher = async (codeOverride?: string) => {
    const codeToUse = codeOverride || voucherCode;
    if (!codeToUse) return;
    setVoucherError("");

    const result = await apiAction<{ code: string; discountAmount: number; description: string | null; params?: Record<string, string> }>(
      "POST",
      "/api/vouchers/validate",
      { code: codeToUse, items: cart.map((i) => ({ id: i.id, quantity: i.quantity })) }
    );
    if (result.success) {
      setAppliedVoucher({
        code: result.code,
        discountAmount: result.discountAmount,
        description: result.description,
      });
      setVoucherCode("");
      setIsVoucherModalOpen(false);
    } else {
      setVoucherError(t(result.error || "checkout.invalidVoucher", result.params));
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setShippingInfo(tempShippingInfo);
    setIsAddressModalOpen(false);
  };

  const handlePlaceOrder = async () => {
    if (!hasAddress) {
      toast.error(t("checkout.needAddress"));
      setTempShippingInfo(shippingInfo);
      setIsAddressModalOpen(true);
      return;
    }

    setIsProcessing(true);
    const res = await apiAction<{ orderId: string }>("POST", "/api/checkout", {
      items: cart.map((i) => ({ id: i.id, quantity: i.quantity })),
      paymentMethod,
      voucherCode: appliedVoucher?.code,
      shippingInfo,
      note,
    });
    setIsProcessing(false);

    if (!res.success) {
      toast.error(res.error || t("checkout.orderError"));
      return;
    }
    if (!hasSavedAddress) {
      await apiAction("POST", "/api/addresses", { ...shippingInfo, title: "Nhà riêng", isDefault: true });
    }
    setIsSuccess(true);
    if (buyNowItem) clearBuyNowItem();
    else removeSelected();
    navigate(`/checkout/success/${res.orderId}`);
  };

  const userRank = user?.rank || "BRONZE";

  return (
    <main className="min-h-screen bg-surface text-zinc-900 pb-10">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 pt-40 md:pt-44 max-w-6xl">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/cart" className="p-1.5 bg-white rounded-lg border border-zinc-200 hover:border-primary/40 transition-all">
            <ChevronLeft className="w-4 h-4 text-zinc-500" />
          </Link>
          <div>
            <h1 className="text-xl font-black">{t("checkout.title")}</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{t("checkout.subtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 space-y-4">
            {/* 1. Địa chỉ nhận hàng */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-secondary" />
                </div>
                <h3 className="font-black text-base">{t("checkout.address")}</h3>
              </div>

              <div className="flex justify-between items-start gap-4 text-sm">
                {hasAddress ? (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-zinc-900">{shippingInfo.name}</span>
                      <div className="w-1 h-1 rounded-full bg-zinc-300" />
                      <span className="font-bold text-zinc-600">{shippingInfo.phone}</span>
                    </div>
                    <p className="text-zinc-500 font-medium">{shippingInfo.address}</p>
                  </div>
                ) : (
                  <p className="text-zinc-400 font-medium">{t("checkout.noAddress")}</p>
                )}
                <button
                  onClick={() => {
                    setTempShippingInfo(shippingInfo);
                    setIsAddressModalOpen(true);
                  }}
                  className="text-primary font-black text-xs hover:underline shrink-0"
                >
                  {hasAddress ? t("checkout.change") : t("checkout.add")}
                </button>
              </div>
            </div>

            {/* 2. Sản phẩm */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm font-black text-zinc-700">{t("checkout.products", { count: cart.length })}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-wider">
                  <Truck className="w-3.5 h-3.5" />
                  {t("checkout.freeShipping")}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-20 h-16 bg-zinc-50 rounded-lg flex-shrink-0 border border-zinc-100 overflow-hidden p-1">
                      <ProductImage imageUrl={item.imageUrl} name={item.name} brand={item.brand} showLabel={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900 line-clamp-2 leading-snug">{item.name}</h4>
                      <span className="text-xs font-bold text-zinc-400">{t("checkout.quantity", { count: item.quantity })} × {formatVND(item.price)}</span>
                    </div>
                    <span className="text-sm font-black text-zinc-900">{formatVND(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Voucher */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-black text-base">{t("checkout.voucher")}</h3>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={t("checkout.voucherPlaceholder")}
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-24 text-sm uppercase"
                  />
                  <button
                    onClick={() => handleApplyVoucher()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-primary text-white rounded-lg px-3 font-black text-[10px] hover:bg-primary-dark transition-all"
                  >
                    {t("checkout.apply")}
                  </button>
                </div>

                <button
                  onClick={() => setIsVoucherModalOpen(true)}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-primary transition-all whitespace-nowrap"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest pl-1">{t("checkout.selectOtherVoucher")}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {voucherError && <p className="text-red-500 text-xs mt-2 font-bold pl-1">{voucherError}</p>}

              <AnimatePresence>
                {appliedVoucher && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 p-3 bg-primary/5 border border-dashed border-primary/30 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-black text-primary">-{formatVND(appliedVoucher.discountAmount)}</p>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{t("checkout.codeApplied")}: {appliedVoucher.code}</p>
                      </div>
                    </div>
                    <button onClick={() => setAppliedVoucher(null)} className="text-zinc-400 hover:text-red-500 font-bold text-[10px]">
                      {t("checkout.remove")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4. Ghi chú */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="w-4 h-4 text-zinc-400" />
                <h3 className="font-black text-sm">{t("checkout.note")}</h3>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder={t("checkout.notePlaceholder")}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-44">
            {/* 5. Phương thức thanh toán */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-zinc-400" />
                <h3 className="font-black text-base">{t("checkout.payment")}</h3>
              </div>

              {PAYMENT_OPTIONS.map(({ id, icon: Icon }) => (
                <label
                  key={id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === id ? "border-primary bg-primary/5" : "border-zinc-100 hover:border-zinc-200"}`}
                >
                  <input type="radio" name="payment" className="hidden" onChange={() => setPaymentMethod(id)} checked={paymentMethod === id} />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === id ? "border-primary" : "border-zinc-300"}`}>
                    {paymentMethod === id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-black text-zinc-900">{t(`checkout.${id.toLowerCase()}`)}</p>
                    <p className="text-[10px] font-bold text-zinc-400">{t(`checkout.${id.toLowerCase()}Desc`)}</p>
                  </div>
                  <Icon className={`w-4 h-4 ${paymentMethod === id ? "text-primary" : "text-zinc-300"}`} />
                </label>
              ))}
            </div>

            {/* 6. Tổng kết */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-4">
              <h2 className="text-base font-black text-zinc-900 border-b border-zinc-50 pb-2">{t("checkout.paymentDetail")}</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-500">{t("checkout.subtotal")}</span>
                  <span className="text-zinc-900 font-bold">{formatVND(total)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-500">{t("checkout.shippingFee")}</span>
                  <span className="text-green-600 font-bold">{t("checkout.free")}</span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between font-bold text-primary">
                    <span>{t("checkout.voucherDiscount")}</span>
                    <span>-{formatVND(appliedVoucher.discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-zinc-100" />

              <div className="flex justify-between items-end">
                <span className="font-black text-zinc-900 uppercase tracking-wider text-[10px]">{t("checkout.total")}</span>
                <span className="text-2xl font-black text-secondary">{formatVND(grandTotal)}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full bg-secondary text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-secondary-dark transition-all shadow-xl shadow-secondary/20 disabled:opacity-50 group"
              >
                {isProcessing ? t("checkout.processing") : t("checkout.orderNow")}
                {!isProcessing && <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              </button>

              <div className="flex items-center gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                <ShieldCheck className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">{t("checkout.secureNotice")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Address Modal */}
        <AnimatePresence>
          {isAddressModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddressModalOpen(false)}
                className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black">{t("checkout.newAddress")}</h3>
                  <button onClick={() => setIsAddressModalOpen(false)} className="p-1.5 hover:bg-zinc-100 rounded-full transition-all">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-4 text-sm">
                  {([
                    ["name", "checkout.fullName", "checkout.namePlaceholder", "text"],
                    ["phone", "checkout.phone", "checkout.phonePlaceholder", "tel"],
                  ] as const).map(([field, label, placeholder, type]) => (
                    <div key={field} className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t(label)}</label>
                      <input
                        {...(field === "phone" ? phoneInputProps : { type })}
                        required
                        value={tempShippingInfo[field]}
                        onChange={(e) => setTempShippingInfo({ ...tempShippingInfo, [field]: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-bold text-zinc-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder={t(placeholder)}
                      />
                    </div>
                  ))}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t("checkout.addressDetail")}</label>
                    <textarea
                      required
                      rows={2}
                      value={tempShippingInfo.address}
                      onChange={(e) => setTempShippingInfo({ ...tempShippingInfo, address: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-bold text-zinc-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                      placeholder={t("checkout.addressPlaceholder")}
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(false)}
                      className="flex-1 py-3 rounded-xl font-black text-zinc-500 hover:bg-zinc-50 transition-all border border-zinc-200"
                    >
                      {t("checkout.back")}
                    </button>
                    <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-xl font-black hover:bg-primary-dark transition-all">
                      {t("checkout.complete")}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Voucher Selector Modal */}
        <AnimatePresence>
          {isVoucherModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsVoucherModalOpen(false)}
                className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="relative w-full max-w-md bg-surface rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
              >
                <div className="p-6 bg-white border-b border-zinc-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black">{t("checkout.voucher")}</h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{t("checkout.selectVoucher")}</p>
                  </div>
                  <button onClick={() => setIsVoucherModalOpen(false)} className="p-1.5 hover:bg-zinc-100 rounded-full transition-all">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {availableVouchers.length === 0 ? (
                    <div className="text-center py-8">
                      <Ticket className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                      <p className="text-zinc-500 font-bold text-sm">{t("checkout.noVouchers")}</p>
                    </div>
                  ) : (
                    availableVouchers.map((v) => {
                      const isRankEligible = RANKS.indexOf(userRank as RankName) >= RANKS.indexOf((v.minRank || "BRONZE") as RankName);
                      const isAmountEligible = total >= v.minOrderAmount;
                      // Voucher không gắn sản phẩm nào thì áp dụng cho mọi sản phẩm
                      const isProductEligible = !v.products?.length || v.products.some((vp: any) => cart.some((ci) => ci.id === vp.id));
                      const isEligible = isRankEligible && isAmountEligible && isProductEligible;

                      return (
                        <div
                          key={v.id}
                          className={`bg-white rounded-2xl border-2 p-4 flex items-center gap-4 ${isEligible ? "border-zinc-100 hover:border-primary/30" : "opacity-60 border-zinc-100"}`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isEligible ? "bg-primary/10 text-primary" : "bg-zinc-100 text-zinc-400"}`}>
                            <Ticket className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0 text-xs">
                            <span className="font-black text-zinc-900">{v.code}</span>
                            <p className="font-bold text-zinc-600 leading-snug">{v.description}</p>
                            {!isAmountEligible && (
                              <p className="text-[10px] text-red-500 font-black mt-1">{t("checkout.needMore", { value: formatVND(v.minOrderAmount - total) })}</p>
                            )}
                            {!isRankEligible && (
                              <p className="text-[10px] text-red-500 font-black mt-1">{t("checkout.needRank", { rank: v.minRank })}</p>
                            )}
                            {!isProductEligible && (
                              <p className="text-[10px] text-red-500 font-black mt-1">{t("voucher.notApplicable")}</p>
                            )}
                          </div>
                          <button
                            disabled={!isEligible}
                            onClick={() => handleApplyVoucher(v.code)}
                            className={`px-4 py-2 rounded-lg font-black text-[10px] flex-shrink-0 ${isEligible ? "bg-primary text-white hover:bg-primary-dark" : "bg-zinc-100 text-zinc-400 cursor-not-allowed"}`}
                          >
                            {t("checkout.use")}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
