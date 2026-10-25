import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { apiAction } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { Mail, ArrowRight, Laptop } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useTitle("Quên mật khẩu");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await apiAction<{ message: string }>("POST", "/api/auth/forgot-password", { email });
    if (res.success) {
      toast.success(res.message || "Đã gửi mã OTP tới email của bạn", { duration: 6000 });
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
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
            <h1 className="text-2xl font-black text-zinc-900">Quên mật khẩu?</h1>
            <p className="text-zinc-500 font-medium mt-2 text-center">Đừng lo, hãy nhập Email để nhận mã khôi phục</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="email"
                placeholder="Email của bạn"
                required
                className="w-full bg-zinc-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-14 pr-6 text-sm transition-all focus:shadow-sm outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-50 active:scale-95"
            >
              {loading ? "ĐANG XỬ LÝ..." : "GỬI MÃ KHÔI PHỤC"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-10 font-medium">
            Nhớ ra mật khẩu?{" "}
            <Link to="/login" className="text-primary hover:underline font-black">
              Quay lại Đăng nhập
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
