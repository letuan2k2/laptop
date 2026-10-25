import { useCallback, useEffect, useState } from "react";

// Gọi REST API của server Express. Khi dev, Vite chuyển tiếp /api sang http://localhost:4000.
// Nếu deploy frontend riêng, đặt VITE_API_URL = địa chỉ server (VD: https://api.lapstore.vn).
const API_BASE = import.meta.env.VITE_API_URL ?? "";
export const SESSION_EXPIRED_EVENT = "lapstore:session-expired";

export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: unknown) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function api<T = unknown>(
  path: string,
  { method = "GET", body, signal }: { method?: Method; body?: unknown; signal?: AbortSignal } = {}
): Promise<T> {
  const init: RequestInit = { method, credentials: "include", signal };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, init);
  const data = res.headers.get("content-type")?.includes("application/json") ? await res.json() : null;
  // Phiên đăng nhập hết hạn / tài khoản không còn: báo AuthProvider đưa giao diện về trạng thái chưa đăng nhập
  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  if (!res.ok) {
    throw new ApiError((data as { error?: string } | null)?.error || "Đã có lỗi xảy ra", res.status, data);
  }
  return data as T;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

// Gọi API thay đổi dữ liệu và luôn trả về { success, error } (không ném lỗi) để giao diện hiển thị thông báo
export async function apiAction<T extends object = ActionResult>(
  method: Method,
  path: string,
  body?: unknown
): Promise<T & ActionResult> {
  try {
    const data = await api<T>(path, { method, body });
    return { success: true, ...(data ?? {}) } as T & ActionResult;
  } catch (error) {
    if (error instanceof ApiError) {
      return { ...((error.data as object) ?? {}), success: false, error: error.message } as T & ActionResult;
    }
    return { success: false, error: "Đã có lỗi kết nối" } as T & ActionResult;
  }
}

// Hook lấy dữ liệu GET: trả về data, lỗi, trạng thái tải và hàm reload (tải lại sau khi thay đổi dữ liệu)
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (path === null) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    api<T>(path, { signal: controller.signal })
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err : new ApiError("Đã có lỗi kết nối", 0));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, loading, reload, setData };
}
