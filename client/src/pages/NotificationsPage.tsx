import { useEffect } from "react";
import { Link } from "react-router";
import { Bell, Package, TrendingDown, Info, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { api, useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const { t, language: lang } = useLanguage();
  useTitle(t("notif.title"));
  const { data } = useApi<NotificationItem[]>("/api/notifications");
  const notifications = data ?? [];

  // Xem trang thông báo thì đánh dấu tất cả đã đọc
  useEffect(() => {
    if (data?.some((n) => !n.isRead)) api("/api/notifications/read-all", { method: "POST" }).catch(() => undefined);
  }, [data]);

  const getIcon = (type: string) => {
    switch (type) {
      case "ORDER": return <Package className="w-5 h-5 text-primary" />;
      case "PRICE_DROP": return <TrendingDown className="w-5 h-5 text-secondary" />;
      case "SYSTEM": return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-44 md:pt-48 pb-24 container mx-auto px-4 md:px-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-4">
            {t("notif.title")}
            {notifications.length > 0 && (
              <span className="bg-primary text-white text-xs px-3 py-1 rounded-full font-black">
                {notifications.length}
              </span>
            )}
          </h1>
          <p className="text-zinc-500 font-medium mt-2">{t("notif.subtitle")}</p>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          {!data ? (
            <div className="py-24 flex justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
              <Bell className="w-16 h-16 mb-6 opacity-20" />
              <p className="font-bold text-lg text-zinc-900">{t("notif.empty")}</p>
              <p className="font-medium">{t("notif.emptyDesc")}</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-6 hover:bg-zinc-50 transition-all flex gap-5 ${!notif.isRead ? "bg-primary/[0.03]" : ""}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-zinc-900">{notif.title}</h3>
                      <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: lang === "vi" ? vi : enUS })}
                      </span>
                    </div>
                    <p className="text-zinc-600 text-sm font-medium mb-3 leading-relaxed">{notif.message}</p>
                    {notif.link && (
                      <Link to={notif.link} className="inline-flex items-center gap-2 text-sm font-black text-primary hover:underline">
                        {t("notif.details")} →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
