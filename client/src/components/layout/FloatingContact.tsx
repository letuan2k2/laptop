import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useLocation } from "react-router";
import { Phone, MessageCircle, MessageSquare, ArrowUp } from "lucide-react";
import { SITE, telLink, zaloLink } from "@shared/site";

// Nút liên hệ nổi góc phải màn hình (ẩn trong trang quản trị và trang chat)
export function FloatingContact() {
  const { pathname } = useLocation();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/chat") || pathname.startsWith("/invoice")) return null;

  const button = "w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110";

  return (
    <div className="fixed right-4 bottom-6 z-40 flex flex-col items-end gap-3">
      <a href={zaloLink()} target="_blank" rel="noreferrer" title="Chat Zalo" className={`${button} bg-[#0068ff]`}>
        <MessageCircle className="w-6 h-6" />
      </a>
      <Link to="/chat" title="Chat với cửa hàng" className={`${button} bg-primary`}>
        <MessageSquare className="w-6 h-6" />
      </Link>
      <a href={telLink(SITE.hotline)} title={`Gọi ${SITE.hotline}`} className="group flex items-center gap-2">
        <span className="hidden sm:block px-3 py-1.5 rounded-full bg-secondary text-white text-xs font-black shadow-lg">{SITE.hotline}</span>
        <span className={`${button} bg-secondary animate-pulse`}>
          <Phone className="w-6 h-6" />
        </span>
      </a>
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="Lên đầu trang"
          className={`${button} bg-zinc-800`}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
