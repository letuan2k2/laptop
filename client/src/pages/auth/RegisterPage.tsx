import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api, ApiError } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { User, Mail, Lock, Laptop, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useTitle("Đăng ký");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api("/api/auth/register", { method: "POST", body: formData });

      const callbackUrl = searchParams.get("callbackUrl");
      const redirectUrl = `/login?registered=true${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;
      navigate(redirectUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#F4F7FB] relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -mr-40 -mt-20 -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[100px] -ml-40 -mb-20 -z-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white p-10 md:p-12 rounded-[48px] shadow-2xl border border-white/50 relative overflow-hidden">
          <div className="flex flex-col items-center mb-10">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <div className="bg-primary p-2.5 rounded-2xl group-hover:rotate-12 transition-transform">
                <Laptop className="text-white w-6 h-6" />
              </div>
              <span className="text-3xl font-black tracking-tighter text-primary">LAPSTORE</span>
            </Link>
            <h1 className="text-2xl font-black text-zinc-900">Tạo tài khoản mới</h1>
            <p className="text-zinc-500 font-medium mt-2">Tạo tài khoản để mua sắm và tích điểm thành viên</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-sm font-bold">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Họ và tên"
                  required
                  className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-14 pr-6 text-sm transition-all focus:shadow-sm outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="email"
                  placeholder="Email của bạn"
                  required
                  className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-14 pr-6 text-sm transition-all focus:shadow-sm outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="password"
                  placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                  required
                  minLength={6}
                  className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-14 pr-6 text-sm transition-all focus:shadow-sm outline-none"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-secondary-dark transition-all shadow-xl shadow-secondary/20 disabled:opacity-50 mt-4 active:scale-95"
            >
              {loading ? "ĐANG TẠO TÀI KHOẢN..." : "ĐĂNG KÝ NGAY"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-10 font-medium">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-primary hover:underline font-black">
              Đăng nhập
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
