import { Link } from "react-router";
import { useLocation } from "react-router";
import { LayoutDashboard, Users, Settings, Laptop, Star, ShoppingBag, Tag, MessageSquare, MessageSquareWarning, Layers, Store } from "lucide-react";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { SITE } from "@shared/site";

const NAV = [
  { name: "Tổng quan", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Đơn hàng", href: "/admin/orders", icon: ShoppingBag },
  { name: "Sản phẩm", href: "/admin/products", icon: Laptop },
  { name: "Danh mục", href: "/admin/categories", icon: Layers },
  { name: "Mã giảm giá", href: "/admin/vouchers", icon: Tag },
  { name: "Khách hàng", href: "/admin/users", icon: Users },
  { name: "Tin nhắn", href: "/admin/chat", icon: MessageSquare },
  { name: "Đánh giá", href: "/admin/reviews", icon: Star },
  { name: "Góp ý, khiếu nại", href: "/admin/feedback", icon: MessageSquareWarning },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-72 border-r border-zinc-200 bg-white flex flex-col fixed inset-y-0 z-10">
      <div className="p-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-xl group-hover:rotate-6 transition-transform">
            <Laptop className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-primary">{SITE.name}</span>
        </Link>
        <div className="mt-4 px-2 py-1 bg-secondary/10 rounded-lg inline-block">
          <span className="text-[10px] font-black uppercase text-secondary tracking-widest">Hệ thống quản trị</span>
        </div>
      </div>

      <nav className="flex-1 px-6 py-2 space-y-1.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-500 hover:bg-zinc-50 hover:text-primary"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
        <Link
          to="/"
          className="flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all mt-4"
        >
          <Store className="w-5 h-5" />
          <span>Xem cửa hàng</span>
        </Link>
      </nav>

      <div className="p-6 border-t border-zinc-100">
        <LogoutButton variant="sidebar" label="Đăng xuất" callbackUrl="/login" />
      </div>
    </aside>
  );
}
