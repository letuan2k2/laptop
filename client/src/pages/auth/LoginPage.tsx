import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/lib/auth";
import { useTitle } from "@/lib/useTitle";
import { Mail, Lock, ArrowRight, Laptop, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  useTitle("Đăng nhập");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered")) {
      setRegistered(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await login(formData.email, formData.password);
    if (!res.ok) {
      setLoading(false);
      setError(res.error || "Thông tin đăng nhập không chính xác");
    }
    // Đăng nhập thành công: GuestOnly (lib/auth.tsx) tự chuyển tới callbackUrl hoặc trang quản trị
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#F4F7FB] relative overflow-hidden">
      {/* Decorative Orbs */}
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
            <h1 className="text-2xl font-black text-zinc-900">Chào mừng trở lại!</h1>
            <p className="text-zinc-500 font-medium mt-2">Đăng nhập để mua sắm và theo dõi đơn hàng</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {registered && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#F4F7FB] border border-primary/20 rounded-2xl text-primary text-sm flex items-center gap-3 font-bold"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>Đăng ký thành công! Hãy đăng nhập ngay.</span>
              </motion.div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-sm font-bold">
                {error}
              </div>
            )}

            <div className="space-y-4">
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
                  placeholder="Mật khẩu"
                  required
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
              {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP NGAY"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="flex justify-end mt-4 relative z-50">
            <button 
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs font-bold text-zinc-400 hover:text-primary transition-colors inline-block py-2 cursor-pointer"
            >
              QUÊN MẬT KHẨU (BẤM VÀO ĐÂY)
            </button>
          </div>

          <p className="text-center text-zinc-500 text-sm mt-6 font-medium">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-primary hover:underline font-black">
              Đăng ký miễn phí
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
