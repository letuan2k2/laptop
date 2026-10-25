import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

// Ảnh admin tải lên được lưu ở server/uploads/products và phục vụ qua GET /uploads/products/:name
export const UPLOAD_DIR = fileURLToPath(new URL("../../uploads/products/", import.meta.url));
export const UPLOAD_URL_PREFIX = "/uploads/products/";
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const IMAGE_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Tên file hợp lệ do server tự sinh (chặn ../ và ký tự lạ)
export const UPLOAD_NAME_PATTERN = /^[a-z0-9-]+\.(jpg|png|webp)$/;

// Nhận diện định dạng theo chữ ký đầu file, không tin phần mở rộng hay MIME do trình duyệt gửi
export function detectImageType(bytes: Uint8Array): "jpg" | "png" | "webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "png";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export function newUploadName(ext: string) {
  return `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
}
