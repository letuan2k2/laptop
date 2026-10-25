import { Loader2 } from "lucide-react";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import type { Voucher } from "@/lib/types";
import { VoucherManagementClient } from "./VoucherManagementClient";

export default function AdminVouchersPage() {
  useTitle("Mã giảm giá");
  const { data, reload } = useApi<Voucher[]>("/api/admin/vouchers");
  if (!data) {
    return (
      <div className="py-32 flex justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <VoucherManagementClient vouchers={data} onChanged={reload} />
    </div>
  );
}
