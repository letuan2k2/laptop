import { useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2, Save } from "lucide-react";
import { apiAction } from "@/lib/api";

export function FeedbackStatusForm({
  id,
  status,
  adminNote,
  onSaved,
}: {
  id: string;
  status: string;
  adminNote: string | null;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(status);
  const [note, setNote] = useState(adminNote || "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const res = await apiAction("PATCH", `/api/admin/feedback/${id}`, { status: value, adminNote: note });
    setLoading(false);
    if (res.success) {
      toast.success("Đã cập nhật");
      onSaved();
    } else {
      toast.error(res.error || "Có lỗi xảy ra");
    }
  };

  return (
    <div className="flex flex-col gap-2 min-w-[220px]">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold"
      >
        <option value="NEW">Mới</option>
        <option value="PROCESSING">Đang xử lý</option>
        <option value="RESOLVED">Đã giải quyết</option>
      </select>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Ghi chú xử lý (nội bộ)"
        className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20"
      />
      <button
        onClick={save}
        disabled={loading}
        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-[11px] font-black disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Lưu
      </button>
    </div>
  );
}
