import { Link, useSearchParams } from "react-router";
import { MessageSquareWarning, Phone, Mail, Loader2 } from "lucide-react";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { FeedbackStatusForm } from "./FeedbackRow";

interface FeedbackItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  orderCode: string | null;
  type: string;
  content: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

const TYPE_LABEL: Record<string, { label: string; className: string }> = {
  SUGGESTION: { label: "Góp ý", className: "bg-blue-50 text-blue-600" },
  COMPLAINT: { label: "Khiếu nại", className: "bg-red-50 text-red-600" },
  WARRANTY: { label: "Bảo hành", className: "bg-amber-50 text-amber-600" },
};

const STATUS_FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "NEW", label: "Mới" },
  { value: "PROCESSING", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã giải quyết" },
];

export default function AdminFeedbackPage() {
  useTitle("Góp ý & khiếu nại");
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "";
  const valid = ["NEW", "PROCESSING", "RESOLVED"].includes(status) ? status : undefined;
  const { data, reload } = useApi<{ feedbacks: FeedbackItem[]; counts: Record<string, number> }>(
    `/api/admin/feedback?status=${valid ?? ""}`
  );
  if (!data) {
    return (
      <div className="py-32 flex justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  const { feedbacks, counts } = data;
  const countOf = (s: string) => counts[s] || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Góp ý & khiếu nại</h2>
          <p className="text-zinc-500 font-medium">Ý kiến khách hàng gửi từ trang “Góp ý, khiếu nại”</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-xl border border-zinc-200 gap-1">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value}
              to={f.value ? `/admin/feedback?status=${f.value}` : "/admin/feedback"}
              className={`px-3 py-2 rounded-lg text-[11px] font-black ${(valid || "") === f.value ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              {f.label}{f.value && ` (${countOf(f.value)})`}
            </Link>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {["Khách hàng", "Loại", "Nội dung", "Ngày gửi", "Xử lý"].map((h) => (
                <th key={h} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {feedbacks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-zinc-400">
                  <MessageSquareWarning className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  Chưa có góp ý nào.
                </td>
              </tr>
            )}
            {feedbacks.map((f) => (
              <tr key={f.id} className="align-top hover:bg-zinc-50/50">
                <td className="px-6 py-4 text-sm">
                  <p className="font-bold text-zinc-900">{f.name}</p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1"><Phone className="w-3 h-3" />{f.phone}</p>
                  {f.email && <p className="text-xs text-zinc-500 flex items-center gap-1"><Mail className="w-3 h-3" />{f.email}</p>}
                  {f.orderCode && <p className="text-xs font-bold text-primary mt-1">Đơn #{f.orderCode}</p>}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${TYPE_LABEL[f.type].className}`}>{TYPE_LABEL[f.type].label}</span>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-700 max-w-md whitespace-pre-line">{f.content}</td>
                <td className="px-6 py-4 text-xs text-zinc-500 whitespace-nowrap">{new Date(f.createdAt).toLocaleString("vi-VN")}</td>
                <td className="px-6 py-4">
                  <FeedbackStatusForm key={`${f.id}-${f.status}`} id={f.id} status={f.status} adminNote={f.adminNote} onSaved={reload} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
