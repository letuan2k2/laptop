import { useState } from "react";
import { User, Phone, MapPin, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiAction } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { phoneInputProps } from "@/lib/inputs";

interface ProfileFormProps {
  user: {
    name: string;
    phoneNumber: string | null;
    address: string | null;
  };
  /** Tải lại hồ sơ sau khi lưu */
  onSaved?: () => void;
}

export function ProfileForm({ user, onSaved }: ProfileFormProps) {
  const [isPending, setIsPending] = useState(false);
  const { refresh } = useAuth();

  // Dùng onSubmit thay vì <form action>: React 19 tự xóa form về giá trị cũ sau khi action chạy xong
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsPending(true);
    const result = await apiAction("PUT", "/api/account/profile", Object.fromEntries(formData));
    if (result.success) {
      toast.success("Cập nhật hồ sơ thành công!");
      refresh(); // cập nhật tên trên thanh menu
      onSaved?.();
    } else {
      toast.error(result.error || "Đã có lỗi xảy ra");
    }
    setIsPending(false);
  }

  const fields = [
    { name: "name", label: "Họ và tên", icon: User, value: user.name, required: true },
    { name: "phoneNumber", label: "Số điện thoại", icon: Phone, value: user.phoneNumber || "" },
    { name: "address", label: "Địa chỉ liên hệ", icon: MapPin, value: user.address || "" },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-zinc-200 space-y-5">
      <h3 className="text-lg font-black flex items-center gap-2">
        <User className="w-5 h-5 text-primary" />
        Thông tin cá nhân
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.name} className={`space-y-1.5 ${f.name === "address" ? "md:col-span-2" : ""}`}>
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">{f.label}</label>
            <div className="relative">
              <f.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                name={f.name}
                {...(f.name === "phoneNumber" ? phoneInputProps : {})}
                required={f.required}
                defaultValue={f.value}
                disabled={isPending}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-3 bg-primary text-white rounded-xl font-black hover:bg-primary-dark transition-all flex items-center gap-2 disabled:opacity-70"
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
