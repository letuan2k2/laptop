import { Check } from "lucide-react";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatusName } from "@shared/site";

const STEPS = ORDER_STATUSES.filter((s) => s !== "CANCELLED");

export function OrderProgress({ status }: { status: OrderStatusName }) {
  const current = STEPS.indexOf(status as (typeof STEPS)[number]);

  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <div key={step} className="flex items-center flex-1 min-w-[90px] last:flex-none last:min-w-0">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${done ? "bg-primary text-white" : "bg-zinc-100 text-zinc-400"}`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] font-bold whitespace-nowrap ${done ? "text-primary" : "text-zinc-400"}`}>
                {ORDER_STATUS_LABEL[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 ${i < current ? "bg-primary" : "bg-zinc-100"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
