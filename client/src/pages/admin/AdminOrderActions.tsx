import { useState } from "react";
import { Loader2, ArrowRight, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiAction } from "@/lib/api";
import { NEXT_ORDER_STATUS, ORDER_STATUS_LABEL, type OrderStatusName } from "@shared/site";

export function AdminOrderActions({ orderId, status, onChanged }: { orderId: string; status: OrderStatusName; onChanged: () => void }) {
  const [loading, setLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const next = NEXT_ORDER_STATUS[status];

  if (status === "COMPLETED" || status === "CANCELLED") {
    return <span className="text-[11px] font-bold text-zinc-400">Đã kết thúc</span>;
  }

  const run = async (target: OrderStatusName) => {
    if (target === "CANCELLED" && !confirm("Hủy đơn hàng này? Tồn kho sẽ được hoàn lại.")) return;
    setLoading(true);
    const res = await apiAction("PATCH", `/api/admin/orders/${orderId}/status`, { status: target, trackingCode });
    setLoading(false);
    if (res.success) {
      toast.success(`Đã chuyển sang "${ORDER_STATUS_LABEL[target]}"`);
      setTrackingCode("");
      onChanged();
    } else {
      toast.error(res.error || "Không thể cập nhật đơn hàng");
    }
  };

  return (
    <div className="flex flex-col gap-2 min-w-[190px]">
      {next === "SHIPPING" && (
        <input
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          placeholder="Mã vận đơn (VD: GHN123456)"
          className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
        />
      )}
      <div className="flex gap-2">
        {next && (
          <button
            onClick={() => run(next)}
            disabled={loading || (next === "SHIPPING" && !trackingCode.trim())}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-[11px] font-black hover:bg-primary-dark transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            {ORDER_STATUS_LABEL[next]}
          </button>
        )}
        {(status === "PENDING" || status === "CONFIRMED" || status === "PACKED") && (
          <button
            onClick={() => run("CANCELLED")}
            disabled={loading}
            title="Hủy đơn"
            className="px-2.5 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
