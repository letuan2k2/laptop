// Hàm định dạng dùng chung cho cả client (React) và server (Express)

export function formatVND(value: number | string | null | undefined) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

// % giảm so với giá niêm yết, trả về 0 nếu không giảm
export function discountPercent(price: number, originalPrice?: number | null) {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

// Mã đơn hiển thị cho khách: 8 ký tự đầu của id, viết hoa
export function shortOrderId(id: string) {
  return id.slice(0, 8).toUpperCase();
}
