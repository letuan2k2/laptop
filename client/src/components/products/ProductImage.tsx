import { useState } from "react";
import { cn } from "@/lib/utils";

const BRAND_COLORS: Record<string, [string, string]> = {
  Apple: ["#3a3a3c", "#8e8e93"],
  Dell: ["#0062a8", "#2fa4e7"],
  ASUS: ["#0b2a5b", "#2f6bd8"],
  Lenovo: ["#a8101a", "#e2231a"],
  HP: ["#00508a", "#0096d6"],
  Acer: ["#3d6b0f", "#83b81a"],
  MSI: ["#7a0010", "#e60012"],
};

interface ProductImageProps {
  imageUrl?: string | null;
  name: string;
  brand: string;
  className?: string;
  /** Hiển thị tên máy trên màn hình minh họa */
  showLabel?: boolean;
}

// Ảnh sản phẩm; khi chưa có ảnh (hoặc ảnh lỗi) thì vẽ laptop minh họa theo màu thương hiệu
export function ProductImage({ imageUrl, name, brand, className, showLabel = true }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    const src = imageUrl.startsWith("/") ? imageUrl : `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    return (
      <img
        src={src}
        alt={name}
        className={cn("w-full h-full object-contain", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  const [dark, light] = BRAND_COLORS[brand] || ["#1f2937", "#6b7280"];
  const gradientId = `screen-${brand}-${name.length}`;
  const model = name.split(/[/(]/)[0].replace(brand, "").trim();

  return (
    <svg viewBox="0 0 400 300" className={cn("w-full h-full", className)} role="img" aria-label={name}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={dark} />
          <stop offset="100%" stopColor={light} />
        </linearGradient>
      </defs>
      {/* Màn hình */}
      <rect x="62" y="38" width="276" height="180" rx="12" fill="#1c1c1e" />
      <rect x="72" y="48" width="256" height="160" rx="4" fill={`url(#${gradientId})`} />
      <circle cx="200" cy="43" r="2" fill="#3a3a3c" />
      {showLabel && (
        <>
          <text x="200" y="118" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="800" fontFamily="Inter, sans-serif" letterSpacing="1">
            {brand.toUpperCase()}
          </text>
          <text x="200" y="146" textAnchor="middle" fill="#ffffffcc" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">
            {model.length > 34 ? `${model.slice(0, 32)}…` : model}
          </text>
        </>
      )}
      {/* Thân máy */}
      <path d="M30 222 H370 L356 244 Q352 250 344 250 H56 Q48 250 44 244 Z" fill="#d1d5db" />
      <rect x="170" y="222" width="60" height="6" rx="3" fill="#9ca3af" />
    </svg>
  );
}
