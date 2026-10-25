import { useEffect } from "react";
import { SITE } from "@shared/site";

// Đặt tiêu đề tab trình duyệt cho từng trang
export function useTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE.name}` : `${SITE.name} | ${SITE.slogan}`;
  }, [title]);
}
