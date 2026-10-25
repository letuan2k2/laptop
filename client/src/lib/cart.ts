import { useState, useEffect } from "react";
import { MAX_QTY_PER_ITEM } from "@shared/site";
import { api } from "./api";

export const CART_STORAGE_KEY = "lapstore_cart";

export interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  stockQuantity?: number;
  selected?: boolean;
}

// "Mua ngay": thanh toán riêng 1 sản phẩm, không thêm vào giỏ hàng (lưu tạm trong tab hiện tại)
const BUY_NOW_KEY = "lapstore_buy_now";

export function setBuyNowItem(item: Omit<CartItem, "selected">) {
  try {
    sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify({ ...item, selected: true }));
  } catch {
    // Trình duyệt chặn sessionStorage: trang thanh toán sẽ quay về giỏ hàng
  }
}

export function readBuyNowItem(): CartItem | null {
  try {
    const saved = sessionStorage.getItem(BUY_NOW_KEY);
    return saved ? (JSON.parse(saved) as CartItem) : null;
  } catch {
    return null;
  }
}

export function clearBuyNowItem() {
  try {
    sessionStorage.removeItem(BUY_NOW_KEY);
  } catch {
    // bỏ qua
  }
}

export function readCartCount() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return 0;
    return (JSON.parse(saved) as CartItem[]).reduce((sum, item) => sum + item.quantity, 0);
  } catch {
    return 0;
  }
}

// Số lượng tối đa được chọn: không vượt tồn kho và giới hạn mỗi đơn
export function maxQuantity(item: Pick<CartItem, "stockQuantity">) {
  return Math.max(0, Math.min(item.stockQuantity ?? MAX_QTY_PER_ITEM, MAX_QTY_PER_ITEM));
}

// Luôn đọc giỏ mới nhất từ localStorage: nhiều component (mỗi thẻ sản phẩm) cùng dùng giỏ hàng,
// nếu dùng bản sao trong state của từng component sẽ ghi đè mất sản phẩm vừa thêm ở chỗ khác
function readCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(cart: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Trình duyệt chặn localStorage: giỏ hàng chỉ còn trong phiên hiện tại
  }
  window.dispatchEvent(new Event("cart-updated"));
}

/**
 * Giỏ hàng lưu trên trình duyệt.
 * `sync: true` (trang giỏ hàng, thanh toán): cập nhật lại giá, tồn kho, tên, ảnh từ server;
 * bỏ sản phẩm đã bị xóa, giảm số lượng vượt tồn kho, tự bỏ chọn máy đã hết hàng.
 */
export function useCart({ sync = false }: { sync?: boolean } = {}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Đọc giỏ lúc mở trang và mỗi khi giỏ thay đổi ở component / tab khác
  useEffect(() => {
    const load = () => setCart(readCart());
    load();
    if (!sync) setIsLoaded(true);
    window.addEventListener("cart-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("cart-updated", load);
      window.removeEventListener("storage", load);
    };
  }, [sync]);

  useEffect(() => {
    if (!sync) return;
    let cancelled = false;
    api<{ id: string; name: string; brand: string; price: number; imageUrl: string | null; stockQuantity: number }[]>("/api/products")
      .then((products) => {
        if (cancelled) return;
        const byId = new Map(products.map((p) => [p.id, p]));
        const synced = readCart().flatMap((item) => {
          const p = byId.get(item.id);
          if (!p) return []; // sản phẩm đã ngừng bán
          const next: CartItem = { ...item, name: p.name, brand: p.brand, price: p.price, imageUrl: p.imageUrl, stockQuantity: p.stockQuantity };
          const max = maxQuantity(next);
          if (max === 0) next.selected = false;
          else next.quantity = Math.min(Math.max(1, item.quantity), max);
          return [next];
        });
        writeCart(synced);
      })
      .catch(() => undefined) // lỗi mạng: dùng tạm dữ liệu đang lưu, server vẫn kiểm tra lại khi đặt hàng
      .finally(() => !cancelled && setIsLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [sync]);

  const update = (fn: (current: CartItem[]) => CartItem[]) => writeCart(fn(readCart()));

  const addToCart = (item: Omit<CartItem, "quantity" | "selected">, quantity = 1) => {
    update((current) => {
      const existing = current.find((i) => i.id === item.id);
      const max = maxQuantity(item);
      if (existing) {
        return current.map((i) =>
          i.id === item.id ? { ...i, ...item, quantity: Math.min(i.quantity + quantity, max), selected: max > 0 } : i
        );
      }
      return [...current, { ...item, quantity: Math.min(quantity, max), selected: max > 0 }];
    });
  };

  const removeFromCart = (id: string) => update((current) => current.filter((item) => item.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    update((current) => current.map((item) => (item.id === id ? { ...item, quantity: Math.min(quantity, maxQuantity(item)) } : item)));
  };

  // Máy hết hàng không chọn được để thanh toán
  const toggleSelection = (id: string) =>
    update((current) =>
      current.map((item) => (item.id === id ? { ...item, selected: maxQuantity(item) > 0 && item.selected === false } : item))
    );

  const toggleAll = (selected: boolean) =>
    update((current) => current.map((item) => ({ ...item, selected: selected && maxQuantity(item) > 0 })));

  const clearCart = () => writeCart([]);

  const removeSelected = () => update((current) => current.filter((item) => item.selected === false));

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedTotal = cart.reduce((sum, item) => (item.selected !== false ? sum + item.price * item.quantity : sum), 0);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleSelection,
    toggleAll,
    clearCart,
    removeSelected,
    total,
    selectedTotal,
    isLoaded,
  };
}
