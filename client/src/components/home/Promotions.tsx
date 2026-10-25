import { motion } from "framer-motion";
import { Ticket, Copy, CheckCircle2, Zap } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function Promotions({ vouchers }: { vouchers: any[] }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <section className="py-12 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-12">
        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-[10px] font-black text-secondary uppercase tracking-widest">
            <Zap className="w-3 h-3 fill-current" />
            <span>{t("promo.badge")}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">{t("promo.title")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {vouchers.slice(0, 4).map((voucher, idx) => (
            <motion.div
              key={voucher.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="relative bg-white border-2 border-dashed border-secondary/30 rounded-2xl p-5 flex items-center gap-4 hover:border-secondary transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Ticket className="w-6 h-6 text-secondary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-black text-zinc-900 tracking-tight">{voucher.code}</p>
                <p className="text-xs font-medium text-zinc-500 leading-snug line-clamp-2">
                  {voucher.description || t("promo.defaultDesc")}
                </p>
                {voucher.minRank && voucher.minRank !== "BRONZE" && (
                  <p className="text-[10px] font-black text-amber-600 uppercase mt-1">{t("promo.rankOnly", { rank: voucher.minRank })}</p>
                )}
              </div>

              <button
                onClick={() => handleCopy(voucher.code)}
                title={t("promo.copy")}
                className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                  copiedCode === voucher.code
                    ? "bg-green-500 text-white"
                    : "bg-zinc-50 text-zinc-400 hover:text-secondary hover:bg-secondary/5"
                }`}
              >
                {copiedCode === voucher.code ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
