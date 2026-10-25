import { Link, useLocation, useNavigate } from "react-router";
import {
  Laptop, Search, ShoppingCart, Phone, ChevronDown, MessageSquare, Heart, Coins, Menu,
  ClipboardList, UserCog, MapPin, User, Headphones, Wrench, Tag, Flame,
} from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { useEffect, useRef, useState } from "react";
import { readCartCount } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { ProductImage } from "@/components/products/ProductImage";
import { NotificationBell } from "./NotificationBell";
import { MegaMenu, type MenuCategory } from "./MegaMenu";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SITE, BRANDS, brandSlug, SUPPORT_LINKS, SERVICE_LINKS, telLink } from "@shared/site";
import { formatVND } from "@/lib/utils";

// Menu thả xuống nhỏ trên thanh trên cùng
function TopDropdown({ label, icon: Icon, links }: { label: string; icon: any; links: { label: string; href: string }[] }) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1 hover:text-white/80 py-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>
      <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-[60]">
        <div className="bg-white text-zinc-700 rounded-xl shadow-xl border border-zinc-100 py-2 w-60">
          {links.map((l) => (
            <Link key={l.href} to={l.href} className="block px-4 py-2 text-xs font-medium hover:bg-zinc-50 hover:text-primary">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Navbar() {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    api<MenuCategory[]>("/api/categories")
      .then((data) => Array.isArray(data) && setCategories(data))
      .catch((error) => console.error("Failed to fetch categories", error));
  }, []);

  // Đóng menu danh mục khi đổi trang hoặc bấm ra ngoài
  useEffect(() => setIsMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!isMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    const updateCount = () => setCartCount(readCartCount());
    updateCount();
    window.addEventListener("cart-updated", updateCount);
    return () => window.removeEventListener("cart-updated", updateCount);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const data = await api<{ count: number }>("/api/chat/unread");
        setUnreadChatCount(data.count);
      } catch {
        // Lỗi mạng tạm thời: giữ số cũ
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000); // 15s
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        setSuggestions(await api<any[]>(`/api/products/suggestions?q=${encodeURIComponent(searchQuery)}`));
        setShowSuggestions(true);
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <header className="fixed top-0 w-full z-50 flex flex-col">
      {/* 1. Thanh trên cùng */}
      <div className="bg-[#0b1f3a] text-white py-1.5 px-4 md:px-12 text-[11px] font-medium">
        <div className="container mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="truncate">{SITE.slogan}</span>
            <span className="hidden lg:inline text-white/70 before:content-['•'] before:mr-2">{t("nav.announcement")}</span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:block"><TopDropdown label={t("nav.helpMenu")} icon={Headphones} links={SUPPORT_LINKS} /></div>
            <div className="hidden md:block"><TopDropdown label={t("nav.serviceMenu")} icon={Wrench} links={SERVICE_LINKS} /></div>
            <Link to="/he-thong-showroom" className="hidden sm:flex items-center gap-1 hover:text-white/80">
              <MapPin className="w-3.5 h-3.5" /> {t("nav.findStore")}
            </Link>
            <div
              className="relative flex items-center gap-1 cursor-pointer hover:text-white/80 transition-colors"
              onClick={() => setIsLangOpen(!isLangOpen)}
            >
              <img src={language === "vi" ? "https://flagcdn.com/w20/vn.png" : "https://flagcdn.com/w20/gb.png"} width="16" alt="Flag" className="rounded-sm" />
              <span className="hidden sm:inline">{language === "vi" ? "Tiếng Việt" : "English"}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isLangOpen ? "rotate-180" : ""}`} />

              {isLangOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white text-zinc-800 rounded-lg shadow-xl z-[60] py-1.5 w-36 border border-zinc-100 font-medium overflow-hidden">
                  {(["vi", "en"] as const).map((lang) => (
                    <div
                      key={lang}
                      className="px-4 py-2 hover:bg-zinc-50 cursor-pointer flex items-center gap-2 text-xs transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLanguage(lang);
                        setIsLangOpen(false);
                      }}
                    >
                      <img src={lang === "vi" ? "https://flagcdn.com/w20/vn.png" : "https://flagcdn.com/w20/gb.png"} width="16" alt="" className="rounded-sm" />
                      {lang === "vi" ? "Tiếng Việt" : "English"}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Header chính */}
      {/* Điện thoại: ô tìm kiếm xuống hàng riêng để đủ chỗ gõ */}
      <nav className="bg-primary px-4 md:px-12 py-3 md:py-0 md:h-20 flex items-center shadow-md">
        <div className="container mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-3 md:gap-6">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6">
              <Laptop className="text-primary w-6 h-6" />
            </div>
            <span className="hidden sm:inline text-xl md:text-2xl font-black tracking-tight text-white">{SITE.name}</span>
          </Link>

          {/* Nút danh mục + menu lớn */}
          <div ref={menuRef} className="relative hidden md:block shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-colors ${isMenuOpen ? "bg-white/20" : "bg-white/10 hover:bg-white/20"}`}
            >
              <Menu className="w-5 h-5" />
              <span className="hidden lg:inline">{t("nav.allProducts")}</span>
            </button>
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-3 w-72 rounded-2xl shadow-2xl border border-zinc-100 z-[60]">
                <MegaMenu categories={categories} onNavigate={() => setIsMenuOpen(false)} className="rounded-2xl" />
              </div>
            )}
          </div>

          <form
            onSubmit={handleSearch}
            className="order-last basis-full md:order-none md:basis-auto flex-1 max-w-2xl relative"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setTimeout(() => setShowSuggestions(false), 200);
              }
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder={t("nav.searchPlaceholder")}
              className="w-full bg-white border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-white/40 transition-all outline-none text-zinc-900"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-secondary text-white p-2 rounded-lg hover:bg-secondary-dark transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-zinc-100 mt-1 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                {suggestions.map((item) => (
                  <Link
                    key={item.id}
                    to={`/products/${item.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-b-0"
                    onClick={() => {
                      setShowSuggestions(false);
                      setSearchQuery("");
                    }}
                  >
                    <div className="w-12 h-10 bg-white rounded-lg shrink-0 p-0.5">
                      <ProductImage imageUrl={item.imageUrl} name={item.name} brand={item.brand} showLabel={false} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-zinc-800 line-clamp-1">{item.name}</span>
                      <span className="text-xs font-bold text-secondary">{formatVND(item.price)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {showSuggestions && isLoadingSuggestions && suggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-zinc-100 mt-1 rounded-xl shadow-lg z-50 p-3 text-center text-sm text-zinc-500">
                {t("nav.searching")}
              </div>
            )}
          </form>

          {/* Hotline */}
          <a href={telLink(SITE.hotline)} className="hidden xl:flex items-center gap-2 text-white shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-bold text-white/70">{t("nav.callToBuy")}</p>
              <p className="text-sm font-black">{SITE.hotline}</p>
            </div>
          </a>

          <div className="flex items-center gap-0.5 md:gap-1 text-white shrink-0">
            <Link to={user && !isAdmin ? "/buyer/orders" : "/tra-cuu-don-hang"} className="flex flex-col items-center px-2 py-1 rounded-lg hover:bg-white/10 transition-all" title={t("nav.trackOrder")}>
              <ClipboardList className="w-5 h-5" />
              <span className="hidden md:block text-[10px] font-bold mt-0.5 whitespace-nowrap">{t("nav.trackOrder")}</span>
            </Link>

            {user && (
              <Link to={isAdmin ? "/admin/chat" : "/chat"} className="relative p-2 rounded-full hover:bg-white/10 transition-all" title={t("nav.chat")}>
                <MessageSquare className="w-6 h-6" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-zinc-900 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {unreadChatCount}
                  </span>
                )}
              </Link>
            )}

            {user && !isAdmin && (
              <Link to="/buyer/favorites" className="hidden sm:block p-2 rounded-full hover:bg-white/10 transition-all" title={t("nav.favorites")}>
                <Heart className="w-6 h-6" />
              </Link>
            )}

            {user && <NotificationBell />}

            <Link to="/cart" className="relative flex flex-col items-center px-2 py-1 rounded-lg hover:bg-white/10 transition-all" title={t("nav.cart")}>
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden md:block text-[10px] font-bold mt-0.5">{t("nav.cart")}</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 right-0 bg-secondary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {!user ? (
              <Link to="/login" className="flex flex-col items-center px-2 py-1 rounded-lg hover:bg-white/10 transition-all">
                <User className="w-5 h-5" />
                <span className="hidden md:block text-[10px] font-bold mt-0.5 whitespace-nowrap">{t("nav.login")}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link
                  to={isAdmin ? "/admin/dashboard" : "/buyer/settings"}
                  title={isAdmin ? t("nav.admin") : t("nav.account")}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/10"
                >
                  <span className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center font-black shrink-0">
                    {isAdmin ? <UserCog className="w-4 h-4" /> : user.name.charAt(0)}
                  </span>
                  {!isAdmin && (
                    <span className="hidden lg:flex flex-col leading-tight">
                      <span className="text-[10px] font-black uppercase">{user.rank || "BRONZE"}</span>
                      <span className="text-[10px] font-bold text-white/80 flex items-center gap-0.5">
                        <Coins className="w-3 h-3 text-yellow-300" />
                        {(user.points || 0).toLocaleString()}
                      </span>
                    </span>
                  )}
                </Link>
                <LogoutButton className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all" />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 3. Thanh liên kết nhanh */}
      <div className="bg-white border-b border-zinc-100 py-2.5 px-4 md:px-12 hidden md:block shadow-sm">
        <div className="container mx-auto flex items-center gap-5 text-xs font-bold text-zinc-600 overflow-x-auto whitespace-nowrap">
          <Link to="/products?sort=discount" className="flex items-center gap-1 text-secondary hover:text-secondary-dark">
            <Flame className="w-4 h-4" /> {t("nav.hotDeals")}
          </Link>
          <Link to="/#vouchers" className="flex items-center gap-1 hover:text-primary">
            <Tag className="w-4 h-4" /> {t("nav.vouchers")}
          </Link>
          <span className="text-zinc-300">|</span>
          {BRANDS.map((b) => (
            <Link key={b} to={`/products?brand=${brandSlug(b)}`} className="hover:text-primary transition-colors">
              Laptop {b}
            </Link>
          ))}
          <span className="text-zinc-300">|</span>
          {categories.map((c) => (
            <Link key={c.id} to={`/products?category=${c.slug}`} className="hover:text-primary transition-colors">
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
