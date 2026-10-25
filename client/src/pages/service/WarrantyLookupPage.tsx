import { useTitle } from "@/lib/useTitle";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WarrantyLookupForm } from "./WarrantyLookupForm";
import { Link } from "react-router";

export default function WarrantyLookupPage() {
  useTitle("Tra cứu bảo hành");
  return (
    <main className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 md:px-12 pt-40 md:pt-44 pb-16 flex-1 max-w-3xl">
        <h1 className="text-3xl font-black text-zinc-900 mb-2">Tra cứu bảo hành</h1>
        <p className="text-zinc-500 font-medium mb-8">
          Nhập mã đơn hàng và số điện thoại mua hàng để xem thời hạn bảo hành của từng sản phẩm.
          Xem thêm <Link to="/chinh-sach/bao-hanh" className="text-primary font-bold hover:underline">chính sách bảo hành</Link>.
        </p>
        <WarrantyLookupForm />
      </div>
      <Footer />
    </main>
  );
}
