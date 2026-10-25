import { Link } from "react-router";
import { Laptop } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useTitle } from "@/lib/useTitle";

export default function NotFoundPage() {
  useTitle("Không tìm thấy trang");
  return (
    <main className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-48 pb-24">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <Laptop className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black text-zinc-900 mb-2">404</h1>
        <p className="text-zinc-500 font-medium mb-8">Trang bạn tìm không tồn tại hoặc đã bị xóa.</p>
        <Link to="/" className="px-6 py-3 bg-primary text-white rounded-xl font-black text-sm">
          Về trang chủ
        </Link>
      </div>
      <Footer />
    </main>
  );
}
