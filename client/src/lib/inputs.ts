import type { FormEvent, KeyboardEvent } from "react";
import { PHONE_ERROR, PHONE_PATTERN } from "@shared/validate";

// Gắn vào mọi ô nhập số điện thoại: chỉ nhận số bắt đầu bằng 0, báo lỗi tiếng Việt ngay khi bấm gửi
export const phoneInputProps = {
  type: "tel",
  inputMode: "numeric" as const,
  pattern: PHONE_PATTERN,
  maxLength: 11,
  title: PHONE_ERROR,
  onInvalid: (e: FormEvent<HTMLInputElement>) => e.currentTarget.setCustomValidity(PHONE_ERROR),
  onInput: (e: FormEvent<HTMLInputElement>) => e.currentTarget.setCustomValidity(""),
};

// Ô nhập số (giá, tồn kho, số lượng…): không cho gõ dấu âm / số mũ
export function blockNegativeKeys(e: KeyboardEvent<HTMLInputElement>) {
  if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
}
