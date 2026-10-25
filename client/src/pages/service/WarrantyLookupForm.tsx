import { useState } from "react";
import { Search, Loader2, ShieldCheck, ShieldOff, ShieldQuestion } from "lucide-react";
import { apiAction } from "@/lib/api";
import { phoneInputProps } from "@/lib/inputs";

type Result =
  | { success: false; error?: string }
  | {
      success: true;
      code: string;
      orderStatus: string;
      items: {
        name: string;
        sku: string;
        quantity: number;
        warrantyMonths: number;
        startDate: string | null;
        endDate: string | null;
        state: string;
      }[];
    };

const STATE = {
  ACTIVE: { label: "Còn bảo hành", icon: ShieldCheck, className: "bg-green-50 text-green-600 border-green-100" },
  EXPIRED: { label: "Hết bảo hành", icon: ShieldOff, className: "bg-red-50 text-red-500 border-red-100" },
  NOT_ACTIVATED: { label: "Chưa kích hoạt (đơn chưa hoàn tất)", icon: ShieldQuestion, className: "bg-zinc-100 text-zinc-500 border-zinc-200" },
} as const;

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");

export function WarrantyLookupForm() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult((await apiAction("POST", "/api/service/warranty-lookup", { code, phone })) as unknown as Result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-zinc-100 p-6 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
        <input
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Mã đơn hàng"
          className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-primary/20"
        />
        <input
          required
          {...phoneInputProps}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Số điện thoại mua hàng"
          className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          disabled={loading}
          className="px-6 py-3 bg-primary text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Tra cứu
        </button>
      </form>

      {result && !result.success && (
        <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-sm font-bold text-red-600">{result.error}</div>
      )}

      {result?.success && (
        <div className="bg-white rounded-3xl border border-zinc-100 overflow-x-auto">
          <div className="px-6 py-4 border-b border-zinc-100">
            <p className="font-black">Đơn hàng #{result.code}</p>
          </div>
          <table className="w-full text-sm min-w-[620px]">
            <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-widest text-zinc-400">
              <tr>
                <th className="px-6 py-3">Sản phẩm</th>
                <th className="px-6 py-3">Thời hạn</th>
                <th className="px-6 py-3">Từ ngày</th>
                <th className="px-6 py-3">Đến ngày</th>
                <th className="px-6 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {result.items.map((item) => {
                const s = STATE[item.state as keyof typeof STATE];
                return (
                  <tr key={item.sku}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-800">{item.name}</p>
                      <p className="text-xs text-zinc-400">Mã SP: {item.sku} · SL: {item.quantity}</p>
                    </td>
                    <td className="px-6 py-4 font-bold">{item.warrantyMonths} tháng</td>
                    <td className="px-6 py-4">{fmtDate(item.startDate)}</td>
                    <td className="px-6 py-4">{fmtDate(item.endDate)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border whitespace-nowrap ${s.className}`}>
                        <s.icon className="w-3.5 h-3.5" /> {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
