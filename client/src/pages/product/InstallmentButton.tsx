import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, X } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { INSTALLMENT_MONTHS, INSTALLMENT_PREPAY } from "@shared/site";

// Bảng tính trả góp 0% (tham khảo): (giá - trả trước) / số tháng
export function InstallmentButton({ price, name, disabled }: { price: number; name: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [prepay, setPrepay] = useState(INSTALLMENT_PREPAY[1]);
  const [months, setMonths] = useState(INSTALLMENT_MONTHS[INSTALLMENT_MONTHS.length - 1]);

  const prepayAmount = Math.round((price * prepay) / 100);
  const monthly = Math.ceil((price - prepayAmount) / months / 1000) * 1000;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex-1 bg-primary text-white font-black py-4 rounded-2xl flex flex-col items-center justify-center hover:bg-primary-dark transition-all disabled:opacity-50"
      >
        <span className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> TRẢ GÓP 0%</span>
        <span className="text-[11px] font-medium opacity-90">Chỉ từ {formatVND(Math.ceil(price / 12 / 1000) * 1000)}/tháng</span>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-primary text-white p-6 flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-black">Tính trả góp 0%</h3>
                  <p className="text-xs text-white/80 line-clamp-1">{name}</p>
                </div>
                <button onClick={() => setOpen(false)}><X /></button>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 font-bold">Giá sản phẩm</span>
                  <span className="font-black">{formatVND(price)}</span>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Trả trước</p>
                  <div className="grid grid-cols-4 gap-2">
                    {INSTALLMENT_PREPAY.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPrepay(p)}
                        className={`py-2 rounded-xl text-sm font-bold border ${prepay === p ? "border-primary bg-primary/10 text-primary" : "border-zinc-200 text-zinc-600"}`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Kỳ hạn</p>
                  <div className="grid grid-cols-3 gap-2">
                    {INSTALLMENT_MONTHS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMonths(m)}
                        className={`py-2 rounded-xl text-sm font-bold border ${months === m ? "border-primary bg-primary/10 text-primary" : "border-zinc-200 text-zinc-600"}`}
                      >
                        {m} tháng
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Số tiền trả trước</span><span className="font-bold">{formatVND(prepayAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Lãi suất</span><span className="font-bold text-green-600">0%</span></div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                    <span className="font-bold">Trả mỗi tháng</span>
                    <span className="text-xl font-black text-secondary">{formatVND(monthly)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Kết quả chỉ mang tính tham khảo. Khoản vay thực tế phụ thuộc ngân hàng / công ty tài chính.
                  Liên hệ hotline hoặc đến showroom để làm hồ sơ trả góp.{" "}
                  <Link to="/chinh-sach/tra-gop" className="text-primary font-bold hover:underline">Xem hướng dẫn</Link>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
