import { RANKS } from "../../../shared/site";

// Tính tiền giảm của voucher – dùng chung cho kiểm tra voucher ở checkout và API đặt hàng.
// Voucher không gắn sản phẩm nào thì áp dụng cho toàn bộ đơn hàng.

export interface VoucherLike {
  isActive: boolean;
  expiryDate: Date | string | null;
  usedCount: number;
  usageLimit: number;
  minOrderAmount: number | { toString(): string };
  maxDiscount: number | { toString(): string } | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number | { toString(): string };
  minRank: string;
  products: { id: string }[];
}

export interface PricedItem {
  id: string;
  price: number;
  quantity: number;
}

export type VoucherResult =
  | { ok: true; discount: number }
  | { ok: false; error: string; params?: Record<string, string> };

export function computeVoucherDiscount(
  voucher: VoucherLike,
  items: PricedItem[],
  userRank: string | null | undefined
): VoucherResult {
  if (!voucher.isActive) return { ok: false, error: "voucher.inactive" };
  if (voucher.expiryDate && new Date(voucher.expiryDate) < new Date()) {
    return { ok: false, error: "voucher.expired" };
  }
  if (voucher.usedCount >= voucher.usageLimit) return { ok: false, error: "voucher.usageLimitExceeded" };

  const rank = userRank || "BRONZE";
  if (RANKS.indexOf(rank as any) < RANKS.indexOf(voucher.minRank as any)) {
    return { ok: false, error: "voucher.rankRequired", params: { rank: voucher.minRank } };
  }

  const orderAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const minOrder = Number(voucher.minOrderAmount);
  if (orderAmount < minOrder) {
    return {
      ok: false,
      error: "voucher.minOrderAmountRequired",
      params: { amount: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(minOrder) },
    };
  }

  const eligible = voucher.products.length === 0
    ? items
    : items.filter((i) => voucher.products.some((p) => p.id === i.id));
  if (eligible.length === 0) return { ok: false, error: "voucher.notApplicable" };

  const eligibleAmount = eligible.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let discount: number;
  if (voucher.discountType === "PERCENTAGE") {
    discount = eligibleAmount * (Number(voucher.discountValue) / 100);
    if (voucher.maxDiscount !== null && discount > Number(voucher.maxDiscount)) {
      discount = Number(voucher.maxDiscount);
    }
  } else {
    discount = Number(voucher.discountValue);
  }

  return { ok: true, discount: Math.max(0, Math.min(Math.round(discount), eligibleAmount)) };
}
