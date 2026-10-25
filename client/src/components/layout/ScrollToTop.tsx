import { useEffect } from "react";
import { useLocation } from "react-router";

// Chuyển trang thì cuộn lên đầu (trừ khi link có #neo, VD /#vouchers)
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
