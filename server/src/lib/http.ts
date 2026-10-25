import { Prisma } from "@prisma/client";

// Tiện ích đọc dữ liệu từ body JSON của request

type Body = Record<string, unknown> | undefined | null;

export function str(body: Body, key: string): string | null {
  const value = body?.[key];
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

// Số nguyên: null nếu bỏ trống, NaN nếu không hợp lệ
export function int(body: Body, key: string): number | null {
  const value = body?.[key];
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

export function bool(body: Body, key: string) {
  const value = body?.[key];
  return value === true || value === "true" || value === "on" || value === 1;
}

// Lỗi trùng khóa duy nhất của Prisma (VD: SKU, email, mã voucher)
export function isUniqueError(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

// Chuyển Decimal của Prisma thành number khi trả JSON (Decimal mặc định bị chuyển thành chuỗi).
// Dùng Prisma.Decimal.isDecimal vì tên lớp Decimal trong Prisma đã bị thu gọn khi đóng gói.
export function decimalReplacer(this: Record<string, unknown>, key: string, value: unknown) {
  const raw = this[key];
  return Prisma.Decimal.isDecimal(raw) ? Number(raw) : value;
}
