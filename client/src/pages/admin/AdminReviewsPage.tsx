import { Link } from "react-router";
import { Star, Trash2, Calendar, Laptop, ExternalLink, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiAction, useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";

interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  product: { id: string; name: string };
  user: { name: string; email: string };
  _count: { replies: number };
}

export default function AdminReviewsPage() {
  useTitle("Quản lý đánh giá");
  const { data, reload } = useApi<AdminReview[]>("/api/admin/reviews");
  if (!data) {
    return (
      <div className="py-32 flex justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  const reviews = data;

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa đánh giá này?")) return;
    const res = await apiAction("DELETE", `/api/admin/reviews/${id}`);
    if (res.success) {
      toast.success("Đã xóa đánh giá");
      reload();
    } else {
      toast.error(res.error || "Không thể xóa đánh giá");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Quản lý đánh giá</h2>
        <p className="text-zinc-500 font-medium">
          Theo dõi đánh giá của khách. Để trả lời, mở trang sản phẩm và bấm “Phản hồi” dưới đánh giá.
        </p>
      </div>

      <div className="glass rounded-3xl overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {["Khách hàng", "Sản phẩm", "Nội dung", "Ngày"].map((h) => (
                <th key={h} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">{h}</th>
              ))}
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-zinc-500 font-medium">
                  Chưa có đánh giá nào.
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-zinc-900">{review.user.name}</p>
                    <p className="text-[11px] text-zinc-400">{review.user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Laptop size={16} />
                      </div>
                      <div className="max-w-[220px]">
                        <p className="text-sm font-bold text-zinc-900 truncate">{review.product.name}</p>
                        <Link
                          to={`/products/${review.product.id}`}
                          target="_blank"
                          className="flex items-center gap-1 text-[11px] text-primary hover:underline font-bold"
                        >
                          Xem / phản hồi <ExternalLink size={9} />
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-sm">
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} className={s <= review.rating ? "text-amber-400 fill-amber-400" : "text-zinc-200"} />
                      ))}
                      {review._count.replies > 0 && (
                        <span className="ml-2 text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                          <MessageCircle size={10} /> Đã phản hồi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 line-clamp-2">{review.comment}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Xóa đánh giá"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
