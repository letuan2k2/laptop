import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Link, useLocation } from "react-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function NotificationBell() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Cập nhật mỗi 30 giây và mỗi khi đổi trang (VD: vừa xem trang thông báo)
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const data = await api<{ count: number }>("/api/notifications/unread-count");
        setUnreadCount(data.count);
      } catch {
        // Bỏ qua lỗi mạng tạm thời
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user, pathname]);

  return (
    <Link to="/notifications" className="relative p-2 text-white hover:bg-white/10 rounded-full transition-all">
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-primary">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
