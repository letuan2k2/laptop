// Kiểm tra dữ liệu dùng chung cho client (React) và server (Express)

// Số điện thoại Việt Nam: bắt đầu bằng 0, gồm 10 chữ số (di động) hoặc 11 chữ số (máy bàn, VD 024 xxxx xxxx)
export const PHONE_PATTERN = "0[0-9]{9,10}";
export const PHONE_ERROR = "Số điện thoại phải bắt đầu bằng số 0 và gồm 10–11 chữ số";

// Bỏ khoảng trắng, dấu chấm, gạch ngang khách hay gõ (VD "0987 654 321" → "0987654321")
export function normalizePhone(phone: string) {
  return phone.replace(/[\s.\-()]/g, "");
}

export function isValidPhone(phone: string) {
  return new RegExp(`^${PHONE_PATTERN}$`).test(normalizePhone(phone));
}
