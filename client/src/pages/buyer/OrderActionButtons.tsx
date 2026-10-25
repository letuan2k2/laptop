import { useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, Star, X, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiAction } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { OrderStatusName } from "@shared/site";

interface OrderActionButtonsProps {
  orderId: string;
  status: OrderStatusName;
  unreviewedItems: { productId: string; name: string }[];
  /** Tải lại danh sách đơn sau khi thao tác thành công */
  onChanged: () => void;
}

export function OrderActionButtons({ orderId, status, unreviewedItems, onChanged }: OrderActionButtonsProps) {
  const [reviewTarget, setReviewTarget] = useState<{ productId: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { t } = useLanguage();

  const run = async (action: () => Promise<{ success: boolean; error?: string }>, successKey: string) => {
    setLoading(true);
    const res = await action();
    setLoading(false);
    if (res.success) {
      toast.success(t(successKey));
      onChanged();
    } else {
      toast.error(res.error || t("common.error"));
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;
    setLoading(true);
    const res = await apiAction("POST", "/api/reviews", { orderId, productId: reviewTarget.productId, rating, comment });
    setLoading(false);
    if (res.success) {
      setReviewTarget(null);
      setComment("");
      setRating(5);
      toast.success(t("orders.reviewSuccess"));
      onChanged();
    } else {
      toast.error(res.error || t("common.error"));
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {(status === "PENDING" || status === "CONFIRMED") && (
        <button
          onClick={() => confirm(t("orders.cancelConfirm")) && run(() => apiAction("POST", `/api/orders/${orderId}/cancel`), "orders.cancelSuccess")}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 font-black rounded-xl border border-red-100 hover:bg-red-100 transition-all text-sm disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          {t("orders.cancelBtn")}
        </button>
      )}

      {(status === "SHIPPING" || status === "DELIVERED") && (
        <button
          onClick={() => confirm(t("orders.completeConfirm")) && run(() => apiAction("POST", `/api/orders/${orderId}/confirm`), "orders.completeSuccess")}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-black rounded-xl hover:bg-primary-dark transition-all text-sm disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          {t("orders.completeBtn")}
        </button>
      )}

      {status === "COMPLETED" && unreviewedItems.map((item) => (
        <button
          key={item.productId}
          onClick={() => setReviewTarget(item)}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 transition-all text-sm max-w-xs"
          title={item.name}
        >
          <Star className="w-4 h-4 shrink-0" />
          <span className="truncate">{unreviewedItems.length > 1 ? `${t("orders.reviewBtn")}: ${item.name}` : t("orders.reviewBtn")}</span>
        </button>
      ))}

      {status === "COMPLETED" && unreviewedItems.length === 0 && (
        <span className="text-xs font-bold text-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" /> {t("orders.reviewed")}
        </span>
      )}

      {status !== "COMPLETED" && status !== "CANCELLED" && (
        <Link
          to="/chat"
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-600 font-bold rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-all text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          {t("orders.contactShop")}
        </Link>
      )}

      <AnimatePresence>
        {reviewTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReviewTarget(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden"
            >
              <div className="bg-amber-500 p-6 text-white flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <Star className="w-5 h-5" /> {t("orders.reviewTitle")}
                  </h3>
                  <p className="text-xs font-medium text-white/90 mt-1 line-clamp-2">{reviewTarget.name}</p>
                </div>
                <button onClick={() => setReviewTarget(null)}><X /></button>
              </div>
              <form onSubmit={handleReview} className="p-8 space-y-6">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s} type="button"
                      onClick={() => setRating(s)}
                      className={`p-1 transition-all ${rating >= s ? "text-amber-500" : "text-zinc-200"}`}
                    >
                      <Star className={`w-9 h-9 ${rating >= s ? "fill-current" : ""}`} />
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 mb-2 block">{t("orders.yourComment")}</label>
                  <textarea
                    required
                    placeholder={t("orders.commentPlaceholder")}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-xl h-32 outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? t("orders.sending") : t("orders.sendReview")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
