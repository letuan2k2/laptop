import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, Edit2, Star } from "lucide-react";
import { api, apiAction } from "@/lib/api";
import { phoneInputProps } from "@/lib/inputs";

interface Address {
  id: string;
  title: string | null;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

export default function AddressManagement() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    name: "",
    phone: "",
    address: "",
    isDefault: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    setLoading(true);
    try {
      setAddresses(await api<Address[]>("/api/addresses"));
    } catch {
      // Giữ danh sách cũ nếu lỗi mạng
    }
    setLoading(false);
  }

  function resetForm() {
    setFormData({
      title: "",
      name: "",
      phone: "",
      address: "",
      isDefault: false,
    });
    setIsAdding(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = editingId
      ? await apiAction("PUT", `/api/addresses/${editingId}`, formData)
      : await apiAction("POST", "/api/addresses", formData);

    if (result.success) {
      resetForm();
      fetchAddresses();
    } else {
      alert(result.error || "Đã có lỗi xảy ra");
    }
    setLoading(false);
  }

  function handleEdit(addr: Address) {
    setEditingId(addr.id);
    setFormData({
      title: addr.title || "",
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      isDefault: addr.isDefault,
    });
    setIsAdding(true);
  }

  async function handleDelete(id: string) {
    if (confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      setLoading(true);
      const result = await apiAction("DELETE", `/api/addresses/${id}`);
      if (result.success) {
        fetchAddresses();
      } else {
        alert(result.error || "Lỗi khi xóa");
      }
      setLoading(false);
    }
  }

  async function handleSetDefault(id: string) {
    setLoading(true);
    const result = await apiAction("POST", `/api/addresses/${id}/default`);
    if (result.success) {
      fetchAddresses();
    } else {
      alert(result.error || "Lỗi khi cập nhật");
    }
    setLoading(false);
  }

  return (
    <div className="glass p-8 rounded-[40px] space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Địa chỉ nhận hàng
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors"
          >
            <Plus size={16} />
            Thêm địa chỉ mới
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-zinc-50 p-6 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-4">Tên gợi nhớ (Ví dụ: Nhà, Cơ quan)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 ring-primary/20 transition-all outline-none"
                placeholder="Nhà riêng"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-4">Tên người nhận</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 ring-primary/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-4">Số điện thoại</label>
              <input
                {...phoneInputProps}
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 ring-primary/20 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-4">Địa chỉ chi tiết</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 ring-primary/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="rounded border-zinc-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isDefault" className="text-sm font-bold text-zinc-600">Đặt làm địa chỉ mặc định</label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white text-sm font-black rounded-xl hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {editingId ? "Cập nhật" : "Lưu địa chỉ"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {loading && addresses.length === 0 ? (
          <div className="text-center py-4 text-zinc-400 text-sm font-medium">Đang tải...</div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-4 text-zinc-400 text-sm font-medium">Bạn chưa lưu địa chỉ nào.</div>
        ) : (
          addresses.map((addr) => (
            <div key={addr.id} className={`p-4 rounded-2xl border ${addr.isDefault ? 'border-primary/20 bg-primary/5' : 'border-zinc-100 bg-white'} hover:shadow-sm transition-all`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    {addr.title && (
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-black rounded-md uppercase">
                        {addr.title}
                      </span>
                    )}
                    <span className="font-bold text-zinc-900">{addr.name}</span>
                    <span className="text-zinc-400 text-sm font-medium">| {addr.phone}</span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded-md uppercase">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 font-medium mt-1">{addr.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="p-2 text-zinc-400 hover:text-primary transition-colors"
                      title="Đặt làm mặc định"
                    >
                      <Star size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(addr)}
                    className="p-2 text-zinc-400 hover:text-primary transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
