import { Outlet } from "react-router";
import { ShieldCheck } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/lib/auth";

// Khung chung của trang quản trị (route đã được bọc RequireAdmin)
export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <AdminSidebar />

      <main className="flex-1 ml-72">
        <header className="h-20 bg-white border-b border-zinc-100 flex items-center justify-between px-10 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/10 flex items-center justify-center text-secondary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="font-black text-zinc-900 tracking-tight">Quản trị cửa hàng</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-zinc-900">{user?.name}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Quản trị viên</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-black shadow-sm">
              A
            </div>
          </div>
        </header>
        <div className="p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
