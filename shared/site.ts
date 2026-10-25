// Thông tin cửa hàng – sửa tại đây để đổi tên/hotline trên toàn bộ website.
// Số điện thoại, địa chỉ bên dưới là DỮ LIỆU MẪU, hãy thay bằng thông tin thật của bạn.
export const SITE = {
  name: "LAPSTORE",
  shortName: "LapStore",
  slogan: "Laptop chính hãng – Giá tốt mỗi ngày",
  hotline: "1900 6868",
  email: "support@lapstore.vn",
  address: "Số 123 Đường Láng, Đống Đa, Hà Nội",
  workingHours: "8:00 - 21:00 (cả Thứ 7, Chủ nhật)",
  onlineHours: "8h - 24h hàng ngày",
  zalo: "0900000000", // số Zalo nhận tư vấn, dùng cho link https://zalo.me/<số>
  social: {
    facebook: "https://facebook.com",
    youtube: "https://youtube.com",
    tiktok: "https://tiktok.com",
  },
};

// Bộ phận hỗ trợ (hiển thị ở trang sản phẩm và chân trang)
export const SUPPORT_TEAMS = [
  { title: "Khách hàng cá nhân", phone: "0900 000 001", email: "banhang@lapstore.vn" },
  { title: "Khách hàng doanh nghiệp", phone: "0900 000 002", email: "doanhnghiep@lapstore.vn" },
];

// Hệ thống showroom (dữ liệu mẫu)
export const SHOWROOMS = [
  { region: "Miền Bắc", name: "LapStore Đống Đa", address: "Số 123 Đường Láng, Đống Đa, Hà Nội", phone: "024 0000 0001", hours: "8:00 - 21:00" },
  { region: "Miền Bắc", name: "LapStore Cầu Giấy", address: "Số 45 Xuân Thủy, Cầu Giấy, Hà Nội", phone: "024 0000 0002", hours: "8:00 - 21:00" },
  { region: "Miền Bắc", name: "LapStore Hai Bà Trưng", address: "Số 78 Bạch Mai, Hai Bà Trưng, Hà Nội", phone: "024 0000 0003", hours: "8:00 - 21:00" },
  { region: "Miền Trung", name: "LapStore Đà Nẵng", address: "Số 12 Nguyễn Văn Linh, Hải Châu, Đà Nẵng", phone: "0236 000 0004", hours: "8:00 - 21:00" },
  { region: "Miền Nam", name: "LapStore Quận 10", address: "Số 200 Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh", phone: "028 0000 0005", hours: "8:00 - 21:30" },
  { region: "Miền Nam", name: "LapStore Thủ Đức", address: "Số 9 Võ Văn Ngân, Thủ Đức, TP. Hồ Chí Minh", phone: "028 0000 0006", hours: "8:00 - 21:30" },
];

// Menu "Hỗ trợ" và "Trung tâm dịch vụ" trên header / footer
export const SUPPORT_LINKS = [
  { label: "Chính sách bảo hành", href: "/chinh-sach/bao-hanh" },
  { label: "Chính sách đổi trả", href: "/chinh-sach/doi-tra" },
  { label: "Chính sách giao hàng", href: "/chinh-sach/giao-hang" },
  { label: "Chính sách hàng chính hãng", href: "/chinh-sach/hang-chinh-hang" },
  { label: "Chính sách bảo mật thông tin", href: "/chinh-sach/bao-mat" },
  { label: "Hướng dẫn mua hàng trực tuyến", href: "/chinh-sach/huong-dan-mua-hang" },
  { label: "Hướng dẫn thanh toán", href: "/chinh-sach/huong-dan-thanh-toan" },
  { label: "Hướng dẫn mua hàng trả góp", href: "/chinh-sach/tra-gop" },
];

export const SERVICE_LINKS = [
  { label: "Tra cứu đơn hàng", href: "/tra-cuu-don-hang" },
  { label: "Tra cứu bảo hành", href: "/tra-cuu-bao-hanh" },
  { label: "Góp ý, khiếu nại", href: "/gop-y" },
  { label: "Hệ thống showroom", href: "/he-thong-showroom" },
  { label: "Câu hỏi thường gặp", href: "/support" },
];

// Trả góp 0% (mô phỏng): số tháng cho phép và % trả trước tối thiểu
export const INSTALLMENT_MONTHS = [6, 9, 12];
export const INSTALLMENT_PREPAY = [0, 20, 30, 50];

// Số máy tối đa của mỗi sản phẩm trong một đơn (giỏ hàng và API đặt hàng cùng dùng)
export const MAX_QTY_PER_ITEM = 10;

export function zaloLink() {
  return `https://zalo.me/${SITE.zalo}`;
}

export function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

// Thứ hạng thành viên: 1 điểm cho mỗi 10.000đ của đơn hàng hoàn tất
export const POINT_UNIT_VND = 10000;
export const RANKS = ["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const;
export type RankName = (typeof RANKS)[number];

export function rankForPoints(points: number): RankName {
  if (points >= 10000) return "PLATINUM"; // ~100 triệu
  if (points >= 5000) return "GOLD"; // ~50 triệu
  if (points >= 2000) return "SILVER"; // ~20 triệu
  return "BRONZE";
}

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPING",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const;
export type OrderStatusName = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatusName, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PACKED: "Đã đóng gói",
  SHIPPING: "Đang giao hàng",
  DELIVERED: "Đã giao hàng",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

export const ORDER_STATUS_COLOR: Record<OrderStatusName, string> = {
  PENDING: "bg-orange-50 text-orange-600 border-orange-100",
  CONFIRMED: "bg-purple-50 text-purple-600 border-purple-100",
  PACKED: "bg-indigo-50 text-indigo-600 border-indigo-100",
  SHIPPING: "bg-blue-50 text-blue-600 border-blue-100",
  DELIVERED: "bg-teal-50 text-teal-600 border-teal-100",
  COMPLETED: "bg-green-50 text-green-600 border-green-100",
  CANCELLED: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

// Trạng thái kế tiếp mà admin có thể chuyển đơn sang
export const NEXT_ORDER_STATUS: Partial<Record<OrderStatusName, OrderStatusName>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PACKED",
  PACKED: "SHIPPING",
  SHIPPING: "DELIVERED",
  DELIVERED: "COMPLETED",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  VNPAY: "VNPAY",
  MOMO: "Ví MoMo",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán lỗi",
  REFUNDED: "Đã hoàn tiền",
};

export const BRANDS = ["Apple", "Dell", "ASUS", "Lenovo", "HP", "Acer", "MSI"];

export function brandSlug(brand: string) {
  return brand.toLowerCase().replace(/\s+/g, "-");
}
