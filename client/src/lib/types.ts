// Kiểu dữ liệu mà REST API của server trả về (giá kiểu number, ngày kiểu chuỗi ISO)

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  stockQuantity: number;
  categoryId: string | null;
  cpu: string;
  ram: string;
  ramGb: number;
  storage: string;
  storageGb: number;
  gpu: string;
  display: string;
  battery: string | null;
  weight: string | null;
  os: string | null;
  ports: string | null;
  connectivity: string | null;
  color: string | null;
  warrantyMonths: number;
  isFeatured: boolean;
  viewCount: number;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  reviews: { rating: number }[];
}

export interface ReviewReply {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string; role: string };
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string };
  replies: ReviewReply[];
}

export interface ProductDetail extends Omit<Product, "reviews"> {
  category: Category | null;
  reviews: Review[];
}

export interface Voucher {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  expiryDate: string | null;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  minRank: string;
  createdAt: string;
  products?: { id: string }[];
  _count?: { products: number };
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subTotal: number;
  discountAmount: number;
  totalPayment: number;
  trackingCode: string | null;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}
