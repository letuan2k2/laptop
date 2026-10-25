import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black text-sm hover:bg-primary-dark"
    >
      <Printer className="w-4 h-4" /> In hóa đơn
    </button>
  );
}
