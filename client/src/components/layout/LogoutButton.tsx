import { useState } from "react";
import { LogOut, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface LogoutButtonProps {
  variant?: "icon" | "sidebar";
  label?: string;
  className?: string;
  iconClassName?: string;
  callbackUrl?: string;
}

export function LogoutButton({ 
  variant = "icon", 
  label, 
  className, 
  iconClassName = "w-5 h-5",
  callbackUrl = "/"
}: LogoutButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const displayLabel = label || t("logout.submit");

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate(callbackUrl);
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={() => setIsOpen(true)}
          className={className || "p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"}
          title={displayLabel}
        >
          <LogOut className={iconClassName} />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={className || "w-full flex items-center gap-4 px-4 py-3.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm group"}
        >
          <LogOut className={`${iconClassName} transition-transform group-hover:-translate-x-1`} />
          <span>{displayLabel}</span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm glass p-8 rounded-[32px] overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                   <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                
                <h3 className="text-2xl font-black text-zinc-900 mb-2">{t("logout.title")}</h3>
                <p className="text-zinc-500 text-sm font-medium mb-8">
                  {t("logout.confirm")}
                </p>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="py-3 px-6 rounded-2xl bg-zinc-100 text-zinc-600 font-bold hover:bg-zinc-200 transition-all active:scale-95"
                  >
                    {t("logout.cancel")}
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="py-3 px-6 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                  >
                    {t("logout.submit")}
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
