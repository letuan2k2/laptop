// Bộ lọc dùng chung cho trang danh sách, menu danh mục và link nhanh (?price=..., ?cpu=...)

export interface FilterOption<T> {
  id: string;
  label: string;
  match: (value: T) => boolean;
}

interface LaptopLike {
  price: number;
  cpu: string;
  ramGb: number;
  storageGb: number;
  display: string;
  gpu?: string;
  os?: string | null;
}

const MILLION = 1_000_000;

const range = (min: number, max: number) => (p: LaptopLike) => p.price >= min * MILLION && p.price < max * MILLION;

export const PRICE_RANGES: FilterOption<LaptopLike>[] = [
  { id: "under-10", label: "Dưới 10 triệu", match: range(0, 10) },
  { id: "10-15", label: "10 - 15 triệu", match: range(10, 15) },
  { id: "15-20", label: "15 - 20 triệu", match: range(15, 20) },
  { id: "20-25", label: "20 - 25 triệu", match: range(20, 25) },
  { id: "25-30", label: "25 - 30 triệu", match: range(25, 30) },
  { id: "30-40", label: "30 - 40 triệu", match: range(30, 40) },
  { id: "40-50", label: "40 - 50 triệu", match: range(40, 50) },
  { id: "over-50", label: "Trên 50 triệu", match: range(50, Infinity) },
];

export const CPU_FAMILIES: FilterOption<LaptopLike>[] = [
  { id: "intel-i3", label: "Intel Core i3", match: (p) => /Core i3/i.test(p.cpu) },
  { id: "intel-i5", label: "Intel Core i5", match: (p) => /Core i5/i.test(p.cpu) },
  { id: "intel-i7", label: "Intel Core i7", match: (p) => /Core i7/i.test(p.cpu) },
  { id: "intel-i9", label: "Intel Core i9", match: (p) => /Core i9/i.test(p.cpu) },
  { id: "intel-ultra", label: "Intel Core Ultra", match: (p) => /Core Ultra/i.test(p.cpu) },
  { id: "amd-ryzen", label: "AMD Ryzen", match: (p) => /Ryzen/i.test(p.cpu) },
  { id: "apple-m", label: "Apple M", match: (p) => /Apple M/i.test(p.cpu) },
];

export const RAM_OPTIONS: FilterOption<LaptopLike>[] = [
  { id: "8", label: "8GB", match: (p) => p.ramGb === 8 },
  { id: "16", label: "16GB", match: (p) => p.ramGb === 16 },
  { id: "24-32", label: "24GB - 32GB", match: (p) => p.ramGb >= 24 && p.ramGb <= 32 },
  { id: "36+", label: "Trên 32GB", match: (p) => p.ramGb > 32 },
];

export const STORAGE_OPTIONS: FilterOption<LaptopLike>[] = [
  { id: "256", label: "256GB", match: (p) => p.storageGb === 256 },
  { id: "512", label: "512GB", match: (p) => p.storageGb === 512 },
  { id: "1tb", label: "1TB", match: (p) => p.storageGb === 1024 },
  { id: "2tb+", label: "2TB trở lên", match: (p) => p.storageGb >= 2048 },
];

export function screenInches(display: string) {
  const m = display.match(/(\d{2}(?:\.\d)?)\s*inch/i);
  return m ? parseFloat(m[1]) : 0;
}

export const SCREEN_OPTIONS: FilterOption<LaptopLike>[] = [
  { id: "13-14", label: "13 - 14 inch", match: (p) => screenInches(p.display) < 14.6 },
  { id: "15-16", label: "15 - 16 inch", match: (p) => screenInches(p.display) >= 14.6 && screenInches(p.display) < 16.5 },
  { id: "17+", label: "Trên 16 inch", match: (p) => screenInches(p.display) >= 16.5 },
];

export function refreshRate(display: string) {
  const m = display.match(/(\d{2,3})\s*Hz/i);
  return m ? parseInt(m[1], 10) : 60;
}

export const REFRESH_OPTIONS: FilterOption<LaptopLike>[] = [
  { id: "60", label: "60Hz", match: (p) => refreshRate(p.display) <= 60 },
  { id: "90-120", label: "90 - 120Hz", match: (p) => refreshRate(p.display) > 60 && refreshRate(p.display) <= 120 },
  { id: "144-165", label: "144 - 165Hz", match: (p) => refreshRate(p.display) >= 144 && refreshRate(p.display) <= 165 },
  { id: "240", label: "240Hz", match: (p) => refreshRate(p.display) >= 240 },
];

const gpuOf = (p: LaptopLike) => p.gpu || "";

export const GPU_OPTIONS: FilterOption<LaptopLike>[] = [
  { id: "integrated", label: "Card tích hợp", match: (p) => !/RTX|GTX|Radeon RX/i.test(gpuOf(p)) },
  { id: "rtx-entry", label: "RTX 2050 / 3050", match: (p) => /RTX (2050|3050)/i.test(gpuOf(p)) },
  { id: "rtx-4050", label: "RTX 4050", match: (p) => /RTX 4050/i.test(gpuOf(p)) },
  { id: "rtx-4060", label: "RTX 4060", match: (p) => /RTX 4060/i.test(gpuOf(p)) },
  { id: "rtx-4070+", label: "RTX 4070 trở lên", match: (p) => /RTX 40[7-9]0/i.test(gpuOf(p)) },
  { id: "workstation", label: "Card đồ họa chuyên dụng", match: (p) => /RTX A\d+/i.test(gpuOf(p)) },
];

export const OS_OPTIONS: FilterOption<LaptopLike>[] = [
  { id: "windows", label: "Windows", match: (p) => /Windows/i.test(p.os || "") },
  { id: "macos", label: "macOS", match: (p) => /macOS/i.test(p.os || "") },
];

export const FILTER_GROUPS = {
  price: PRICE_RANGES,
  cpu: CPU_FAMILIES,
  ram: RAM_OPTIONS,
  storage: STORAGE_OPTIONS,
  screen: SCREEN_OPTIONS,
  hz: REFRESH_OPTIONS,
  gpu: GPU_OPTIONS,
  os: OS_OPTIONS,
} as const;

export type FilterKey = keyof typeof FILTER_GROUPS;

export const FILTER_TITLES: Record<FilterKey, string> = {
  price: "Khoảng giá",
  cpu: "CPU",
  ram: "RAM",
  storage: "Ổ cứng SSD",
  screen: "Kích thước màn hình",
  hz: "Tần số màn hình",
  gpu: "Card đồ họa (VGA)",
  os: "Hệ điều hành",
};
