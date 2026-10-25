import { useTitle } from "@/lib/useTitle";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { OrderLookupForm } from "./OrderLookupForm";

export default function OrderLookupPage() {
  useTitle("Tra cứu đơn hàng");
  return (
    <main className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 md:px-12 pt-40 md:pt-44 pb-16 flex-1 max-w-3xl">
        <h1 className="text-3xl font-black text-zinc-900 mb-2">Tra cứu đơn hàng</h1>
        <p className="text-zinc-500 font-medium mb-8">
          Nhập mã đơn hàng (8 ký tự, ví dụ <b>#A1B2C3D4</b>) và số điện thoại nhận hàng để xem trạng thái đơn.
        </p>
        <OrderLookupForm />
      </div>
      <Footer />
    </main>
  );
}
