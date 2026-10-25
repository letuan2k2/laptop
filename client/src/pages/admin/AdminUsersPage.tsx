import { Users, Mail, UserCheck, Calendar, Shield, Phone, Trophy, Loader2 } from "lucide-react";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { formatVND } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: "USER" | "ADMIN";
  points: number;
  rank: string;
  createdAt: string;
  spent: number;
  _count: { orders: number };
}

export default function AdminUsersPage() {
  useTitle("Khách hàng");
  const { data } = useApi<{ users: AdminUser[]; buyers: number }>("/api/admin/users");
  if (!data) {
    return (
      <div className="py-32 flex justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  const { users, buyers } = data;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Khách hàng</h2>
        <p className="text-zinc-500 font-medium">Danh sách tài khoản, hạng thành viên và lịch sử mua hàng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Tổng tài khoản", value: users.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Quản trị viên", value: users.filter((u) => u.role === "ADMIN").length, icon: Shield, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Khách đã mua hàng", value: buyers, icon: UserCheck, color: "text-primary", bg: "bg-primary/10" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="glass rounded-3xl overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {["Người dùng", "Vai trò", "Hạng / Điểm", "Đơn hàng", "Đã chi tiêu", "Ngày tham gia"].map((h) => (
                <th key={h} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{user.name}</p>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400"><Mail size={10} />{user.email}</div>
                      {user.phoneNumber && <div className="flex items-center gap-1 text-[11px] text-zinc-400"><Phone size={10} />{user.phoneNumber}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${user.role === "ADMIN" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}>
                    {user.role === "ADMIN" ? "Quản trị" : "Khách hàng"}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs">
                  {user.role === "USER" ? (
                    <>
                      <p className="font-black flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-500" />{user.rank}</p>
                      <p className="text-zinc-400">{user.points.toLocaleString()} điểm</p>
                    </>
                  ) : "—"}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-zinc-700">{user._count.orders}</td>
                <td className="px-6 py-4 text-sm font-black text-zinc-900">{formatVND(user.spent)}</td>
                <td className="px-6 py-4 text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
