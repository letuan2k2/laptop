import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { apiAction } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { Lock, ArrowRight, Laptop, Key } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  useTitle("Đặt lại mật khẩu");
  const email = searchParams.get("email");

  const [formData, setFormData] = useState({
    token: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    const res = await apiAction<{ message: string }>("POST", "/api/auth/reset-password", {
      email,
      token: formData.token.trim(),
      password: formData.password,
    });
    if (res.success) {
      toast.success(res.message || "Đặt lại mật khẩu thành công");
      navigate("/login");
    } else {
      toast.error(res.error || "Có lỗi xảy ra");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#F4F7FB] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-40 -mt-20 -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] -ml-40 -mb-20 -z-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-10 md:p-12 rounded-[48px] shadow-2xl border border-white/50 relative overflow-hidden">
          <div className="flex flex-col items-center mb-10">
            <Link to="/" className="flex items-center gap-2 mb-8 group">
              <div className="bg-primary p-2.5 rounded-2xl group-hover:rotate-12 transition-transform">
                <Laptop className="text-white w-6 h-6" />
              </div>
              <span className="text-3xl font-black tracking-tighter text-primary">LAPSTORE</span>
            </Link>
            <h1 className="text-2xl font-black text-zinc-900">Đặt lại mật khẩu</h1>
            <p className="text-zinc-500 font-medium mt-2 text-center">
              Nhập mã OTP và mật khẩu mới cho tài khoản {email}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Mã OTP 6 chữ số"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-14 pr-6 text-sm transition-all focus:shadow-sm outline-none font-black tracking-widest"
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="password"
                  placeholder="Mật khẩu mới"
                  required
                  className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-14 pr-6 text-sm transition-all focus:shadow-sm outline-none"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="password"
                  placeholder="Xác nhận mật khẩu mới"
                  required
                  className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-14 pr-6 text-sm transition-all focus:shadow-sm outline-none"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-secondary-dark transition-all shadow-xl shadow-secondary/20 disabled:opacity-50 active:scale-95"
            >
              {loading ? "ĐANG CẬP NHẬT..." : "XÁC NHẬN ĐỔI MẬT KHẨU"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-zinc-500 font-medium">
            Không nhận được mã hoặc mã hết hạn?{" "}
            <Link to="/forgot-password" className="text-primary font-black hover:underline">Gửi lại mã</Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
