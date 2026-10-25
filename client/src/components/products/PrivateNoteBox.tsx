import { useState } from "react";
import { apiAction } from "@/lib/api";
import { toast } from "react-hot-toast";
import { StickyNote, Save, Loader2 } from "lucide-react";

interface PrivateNoteBoxProps {
  productId: string;
  initialNote: string;
}

export function PrivateNoteBox({ productId, initialNote }: PrivateNoteBoxProps) {
  const [note, setNote] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await apiAction("PUT", `/api/notes/${productId}`, { content: note });
    if (res.success) toast.success("Đã lưu ghi chú cá nhân");
    else toast.error(res.error || "Không thể lưu ghi chú");
    setIsSaving(false);
  };

  return (
    <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100/50 space-y-4">
      <div className="flex items-center gap-3 text-amber-700">
        <StickyNote className="w-5 h-5" />
        <h3 className="font-black text-sm uppercase tracking-widest">Ghi chú cá nhân (Chỉ bạn thấy)</h3>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ghi chú riêng về mẫu laptop này, ví dụ: so sánh với máy khác, cấu hình muốn nâng cấp..."
        className="w-full h-24 bg-white/50 border border-amber-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all resize-none"
      />

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Lưu ghi chú
      </button>
    </div>
  );
}
