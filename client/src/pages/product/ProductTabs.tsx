import { useState } from "react";
import { Star, User, Reply, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiAction } from "@/lib/api";
import type { Review } from "@/lib/types";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ProductTabsProps {
  description: string | null;
  specs: [string, string | null | undefined][];
  reviews: Review[];
  /** Gọi lại sau khi cửa hàng phản hồi để tải lại đánh giá */
  onReplied?: () => void;
}

// Mô tả lưu dạng text, dòng bắt đầu bằng "## " là tiêu đề mục
function Description({ text }: { text: string }) {
  return (
    <div className="space-y-4">
      {text.split(/\n{2,}/).map((block, i) =>
        block.startsWith("## ") ? (
          <h3 key={i} className="text-lg font-black text-zinc-900 pt-2">{block.slice(3)}</h3>
        ) : (
          <p key={i} className="text-[15px] text-zinc-600 leading-relaxed whitespace-pre-line">{block}</p>
        )
      )}
    </div>
  );
}

export function ProductTabs({ description, specs, reviews, onReplied }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const canReply = user?.role === "ADMIN";

  const handleReply = async (reviewId: string) => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    const res = await apiAction("POST", `/api/admin/reviews/${reviewId}/reply`, { content: replyContent });
    if (res.success) {
      toast.success(t("product.replyPosted"));
      setReplyContent("");
      setReplyingTo(null);
      onReplied?.();
    } else {
      toast.error(res.error || t("common.error"));
    }
    setIsSubmitting(false);
  };

  const tabs = [
    { id: "description" as const, label: t("product.descriptionTab") },
    { id: "specs" as const, label: t("product.specsTab") },
    { id: "reviews" as const, label: `${t("product.reviewsTab")} (${reviews.length})` },
  ];

  return (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="flex border-b border-zinc-100 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-sm font-black whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id ? "text-primary border-primary" : "text-zinc-400 border-transparent hover:text-zinc-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8 min-h-[300px]">
        {activeTab === "description" && (
          description ? (
            <div>
              <div className={`relative ${showFullDesc ? "" : "max-h-[420px] overflow-hidden"}`}>
                <Description text={description} />
                {!showFullDesc && <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />}
              </div>
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-4 mx-auto block px-6 py-2.5 border border-primary text-primary rounded-xl text-sm font-black hover:bg-primary hover:text-white transition-colors"
              >
                {showFullDesc ? t("product.collapse") : t("product.readMore")}
              </button>
            </div>
          ) : (
            <p className="text-zinc-400 font-medium">{t("product.noDescription")}</p>
          )
        )}

        {activeTab === "specs" && (
          <table className="w-full text-sm">
            <tbody>
              {specs.filter(([, v]) => v).slice(0, showAllSpecs ? undefined : 8).map(([label, value], i) => (
                <tr key={label} className={i % 2 === 0 ? "bg-zinc-50" : ""}>
                  <td className="px-4 py-3 font-bold text-zinc-500 w-1/3 align-top">{label}</td>
                  <td className="px-4 py-3 font-medium text-zinc-800">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeTab === "specs" && specs.filter(([, v]) => v).length > 8 && (
          <button
            onClick={() => setShowAllSpecs(!showAllSpecs)}
            className="mt-4 mx-auto block px-6 py-2.5 border border-primary text-primary rounded-xl text-sm font-black hover:bg-primary hover:text-white transition-colors"
          >
            {showAllSpecs ? t("product.collapse") : t("product.moreSpecs")}
          </button>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="p-10 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-center text-zinc-400 font-bold">
                {t("product.noReviews")}
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-5 rounded-2xl border border-zinc-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-900">{review.user?.name || t("product.customer")}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          {t("product.verifiedPurchase")} · {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${review.rating >= s ? "fill-current" : "text-zinc-200"}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-zinc-700 text-sm leading-relaxed">{review.comment}</p>}

                  {review.replies?.length > 0 && (
                    <div className="ml-8 space-y-3">
                      {review.replies.map((reply: any) => (
                        <div key={reply.id} className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-zinc-900">{reply.user.name}</span>
                            <span className="px-1.5 py-0.5 bg-primary text-white text-[8px] font-black uppercase rounded">
                              {t("product.shopReply")}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-zinc-600">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {canReply && (
                    replyingTo === review.id ? (
                      <div className="space-y-3 bg-zinc-50 p-3 rounded-xl">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={t("product.writeReply")}
                          className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-primary/20 min-h-[70px]"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setReplyingTo(null)} className="px-3 py-1.5 text-xs font-bold text-zinc-400">
                            {t("common.cancel")}
                          </button>
                          <button
                            disabled={isSubmitting || !replyContent.trim()}
                            onClick={() => handleReply(review.id)}
                            className="px-3 py-1.5 bg-primary text-white text-xs font-black rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" /> {t("product.sendReply")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(review.id)}
                        className="flex items-center gap-1.5 text-xs font-black text-zinc-400 hover:text-primary"
                      >
                        <Reply className="w-3.5 h-3.5" /> {t("product.reply")}
                      </button>
                    )
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
