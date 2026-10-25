import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export { formatVND, discountPercent, shortOrderId } from "@shared/format";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
