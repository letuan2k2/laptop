import { useRef, useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiAction } from "@/lib/api";
import { phoneInputProps } from "@/lib/inputs";

const inputClass =
  "w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20";

export function FeedbackForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Dùng onSubmit: nếu gửi lỗi, nội dung khách đã gõ vẫn còn (form action của React 19 sẽ tự xóa form)
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    const res = await apiAction("POST", "/api/feedback", Object.fromEntries(formData));
    setLoading(false);
    if (res.success) {
      setSent(true);
      formRef.current?.reset();
    } else {
      toast.error(res.error || "Có lỗi xảy ra");
    }
  }

  if (sent) {
    return (
      <div className="bg-white rounded-3xl border border-zinc-100 p-10 text-center space-y-4">
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
        <h2 className="text-xl font-black">Cảm ơn bạn đã gửi ý kiến!</h2>
        <p className="text-zinc-500">Chúng tôi sẽ liên hệ lại qua số điện thoại bạn cung cấp trong thời gian sớm nhất.</p>
        <button onClick={() => setSent(false)} className="px-6 py-3 bg-primary text-white rounded-xl font-black text-sm">
          Gửi ý kiến khác
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-3xl border border-zinc-100 p-6 md:p-8 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Họ và tên *</label>
          <input name="name" required className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Số điện thoại *</label>
          <input name="phone" {...phoneInputProps} required className={inputClass} placeholder="VD: 0987654321" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Email</label>
          <input name="email" type="email" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Mã đơn hàng (nếu có)</label>
          <input name="orderCode" placeholder="VD: A1B2C3D4" className={`${inputClass} uppercase`} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Loại ý kiến</label>
        <div className="flex flex-wrap gap-3">
          {[
            ["SUGGESTION", "Góp ý"],
            ["COMPLAINT", "Khiếu nại"],
            ["WARRANTY", "Bảo hành, sửa chữa"],
          ].map(([value, label], i) => (
            <label key={value} className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-bold cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary">
              <input type="radio" name="type" value={value} defaultChecked={i === 0} className="accent-[var(--primary)]" />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Nội dung *</label>
        <textarea name="content" required minLength={10} rows={6} className={`${inputClass} resize-y`} placeholder="Mô tả chi tiết ý kiến của bạn..." />
      </div>

      <button
        disabled={loading}
        className="px-8 py-3.5 bg-secondary text-white rounded-xl font-black flex items-center gap-2 hover:bg-secondary-dark disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Gửi ý kiến
      </button>
    </form>
  );
}
