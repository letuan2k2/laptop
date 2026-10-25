import { maxQuantity, useCart } from "@/lib/cart";
import { Navbar } from "@/components/layout/Navbar";
import { Trash2, ShoppingBag, ShieldCheck, ChevronRight, Truck, Minus, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useTitle } from "@/lib/useTitle";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { ProductImage } from "@/components/products/ProductImage";
import { formatVND } from "@/lib/utils";

function Checkbox({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="relative flex items-center justify-center flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer appearance-none w-5 h-5 border-2 border-zinc-300 rounded-md checked:bg-primary checked:border-primary transition-all cursor-pointer"
      />
      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  );
}

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    selectedTotal,
    toggleSelection,
    toggleAll,
    clearCart,
    isLoaded,
  } = useCart({ sync: true });
  const navigate = useNavigate();
  useTitle("Giỏ hàng");
  const { t } = useLanguage();

  const selectedCount = cart.filter((item) => item.selected !== false).length;
  const isAllSelected = cart.length > 0 && selectedCount === cart.length;

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-surface text-zinc-900">
        <Navbar />
        <div className="container mx-auto px-6 pt-48 pb-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border border-zinc-100">
            <ShoppingBag className="w-10 h-10 text-zinc-300" />
          </div>
          <h1 className="text-2xl font-black mb-3">{t("cart.empty")}</h1>
          <p className="text-zinc-500 mb-8 max-w-sm font-medium">{t("cart.emptyDesc")}</p>
          <Link to="/products" className="px-10 py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/20">
            {t("cart.explore")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-zinc-900 pb-20">
      <Navbar />

      <div className="container mx-auto px-4 md:px-12 pt-40 md:pt-44">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tight">{t("cart.title")}</h1>
            <span className="px-3 py-1 bg-white border border-zinc-200 rounded-full text-xs font-bold text-zinc-500">
              {t("cart.items", { count: cart.length })}
            </span>
          </div>

          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-zinc-200 self-start md:self-auto">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox checked={isAllSelected} onChange={toggleAll} />
              <span className="text-sm font-black text-zinc-700">{t("cart.selectAll")}</span>
            </label>
            <div className="w-px h-4 bg-zinc-200 mx-1" />
            <button onClick={clearCart} className="text-sm font-bold text-zinc-400 hover:text-red-500 transition-colors">
              {t("cart.clearAll")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 md:p-6 flex gap-4 md:gap-6 items-center"
                  >
                    <Checkbox checked={item.selected !== false} onChange={() => toggleSelection(item.id)} />
                    <Link to={`/products/${item.id}`} className="w-24 h-20 md:w-32 md:h-24 bg-zinc-50 rounded-xl flex-shrink-0 flex items-center justify-center border border-zinc-100 overflow-hidden p-2">
                      <ProductImage imageUrl={item.imageUrl} name={item.name} brand={item.brand} showLabel={false} />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-primary uppercase">{item.brand}</p>
                          <Link to={`/products/${item.id}`} className="font-bold text-zinc-900 leading-snug line-clamp-2 hover:text-primary">{item.name}</Link>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-xl transition-all shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap justify-between items-center gap-3">
                        {maxQuantity(item) === 0 ? (
                          <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-black">Hết hàng – không thể đặt</span>
                        ) : (
                        <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-zinc-50 rounded-xl p-1 border border-zinc-100">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-zinc-500"
                          ><Minus className="w-3.5 h-3.5" /></button>
                          <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= maxQuantity(item)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed"
                          ><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                        {item.quantity >= maxQuantity(item) && (
                          <span className="text-[11px] font-bold text-amber-600">Tối đa {maxQuantity(item)} máy</span>
                        )}
                        </div>
                        )}
                        <span className="font-black text-lg text-secondary">{formatVND(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-44 h-fit space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 space-y-6">
              <h2 className="text-lg font-black text-zinc-900">{t("cart.summary")}</h2>

              <div className="space-y-3 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t("cart.subtotal", { count: selectedCount })}</span>
                  <span className="text-zinc-900 font-bold">{formatVND(selectedTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t("cart.shipping")}</span>
                  <span className="text-green-600 font-bold">{t("cart.free")}</span>
                </div>
              </div>

              <div className="h-px bg-zinc-100" />

              <div className="flex justify-between items-end">
                <span className="font-black text-zinc-900 uppercase tracking-wider text-xs">{t("cart.total")}</span>
                <span className="text-2xl font-black text-secondary">{formatVND(selectedTotal)}</span>
              </div>

              <button
                onClick={() => selectedCount > 0 && navigate("/checkout")}
                disabled={selectedCount === 0}
                className="w-full bg-secondary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-secondary-dark transition-all shadow-xl shadow-secondary/20 disabled:opacity-50 text-base"
              >
                {t("cart.checkout")}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-zinc-200 space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <p className="text-xs text-zinc-600 font-bold">{t("cart.genuineNotice")}</p>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-primary shrink-0" />
                <p className="text-xs text-zinc-600 font-bold">{t("cart.shippingNotice")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
