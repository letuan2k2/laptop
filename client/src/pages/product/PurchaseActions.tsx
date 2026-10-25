import { maxQuantity, setBuyNowItem, useCart } from "@/lib/cart";
import { ShoppingCart, Zap, MessageSquare, Loader2, Heart, Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { apiAction } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { InstallmentButton } from "./InstallmentButton";

interface PurchaseActionsProps {
  product: {
    id: string;
    name: string;
    brand: string;
    price: number;
    imageUrl?: string | null;
    stockQuantity: number;
  };
  initialIsFavorite?: boolean;
}

export function PurchaseActions({ product, initialIsFavorite }: PurchaseActionsProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const outOfStock = product.stockQuantity <= 0;
  const isAdmin = user?.role === "ADMIN";
  const loginRedirect = () => navigate(`/login?callbackUrl=${encodeURIComponent(`/products/${product.id}`)}`);

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity,
      },
      quantity
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // Mua ngay: thanh toán riêng máy này, không thêm vào giỏ hàng
  const handleBuyNow = () => {
    if (outOfStock) return;
    setBuyNowItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      imageUrl: product.imageUrl,
      stockQuantity: product.stockQuantity,
      quantity: Math.min(quantity, maxQuantity(product)),
    });
    navigate("/checkout?mode=buy-now");
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error(t("product.loginToFavorite"));
      loginRedirect();
      return;
    }

    setIsFavoriteLoading(true);
    const res = await apiAction<{ isFavorite: boolean }>("POST", `/api/favorites/${product.id}/toggle`);
    if (res.success) {
      setIsFavorite(res.isFavorite);
      toast.success(res.isFavorite ? t("product.addedToFavorites") : t("product.removedFromFavorites"));
    } else {
      toast.error(res.error || t("common.error"));
    }
    setIsFavoriteLoading(false);
  };

  const handleChat = async () => {
    if (!user) {
      toast.error(t("product.loginToChat"));
      loginRedirect();
      return;
    }

    setIsChatLoading(true);
    const res = await apiAction<{ id: string }>("POST", "/api/chat/conversations", { productId: product.id });
    if (res.success) {
      navigate(`/chat?id=${res.id}`);
    } else {
      toast.error(res.error || t("product.chatInitError"));
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {!outOfStock && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-zinc-500">{t("product.quantity")}</span>
          <div className="flex items-center gap-1 bg-zinc-50 rounded-xl p-1 border border-zinc-100">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center hover:bg-white rounded-lg text-zinc-500"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-black w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQuantity(product), q + 1))}
              className="w-9 h-9 flex items-center justify-center hover:bg-white rounded-lg text-zinc-500"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="flex-1 bg-secondary text-white font-black py-4 rounded-2xl flex flex-col items-center justify-center hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2 text-base"><Zap className="w-5 h-5 fill-current" />{outOfStock ? t("product.outOfStock") : t("product.buyNow")}</span>
          {!outOfStock && <span className="text-[11px] font-medium opacity-90">{t("product.buyNowHint")}</span>}
        </motion.button>
        <InstallmentButton price={product.price} name={product.name} disabled={outOfStock} />
      </div>

      <div className={`grid gap-3 ${isAdmin ? "grid-cols-2" : "grid-cols-3"}`}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          disabled={outOfStock}
          className={`font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all border text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            isAdded
              ? "bg-primary/10 border-primary text-primary"
              : "bg-white border-primary/40 text-primary hover:bg-primary/5"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="truncate">{isAdded ? t("product.addedToCart") : t("product.addToCart")}</span>
        </motion.button>
        {!isAdmin && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isChatLoading}
            onClick={handleChat}
            className="bg-white border border-zinc-200 text-zinc-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all text-sm disabled:opacity-70"
          >
            {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <MessageSquare className="w-4 h-4 text-primary" />}
            <span className="truncate">{isChatLoading ? t("product.connecting") : t("product.chatWithShop")}</span>
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={isFavoriteLoading}
          onClick={handleToggleFavorite}
          className="bg-white border border-zinc-200 text-zinc-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all text-sm disabled:opacity-70"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-secondary text-secondary" : "text-zinc-400"}`} />
          <span className="truncate">{isFavorite ? t("product.removeFromFavorites") : t("product.saveToFavorites")}</span>
        </motion.button>
      </div>
    </div>
  );
}
