import { useTitle } from "@/lib/useTitle";
import { SettingsClient } from "./SettingsClient";

export default function AdminSettingsPage() {
  useTitle("Cài đặt hệ thống");
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Cài đặt hệ thống</h2>
        <p className="text-zinc-500 font-medium">Thông tin cửa hàng và các quy tắc vận hành (sửa trong shared/site.ts)</p>
      </div>

      <SettingsClient />
    </div>
  );
}
