import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { api, ApiError, SESSION_EXPIRED_EVENT } from "./api";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  points: number;
  rank: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: CurrentUser }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Lưu người dùng đang đăng nhập; phiên thật nằm trong cookie httpOnly do server Express quản lý
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ user: CurrentUser | null }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Server trả 401 ở một API cần đăng nhập → coi như đã đăng xuất (RequireAuth sẽ đưa về trang đăng nhập)
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await api<{ user: CurrentUser }>("/api/auth/login", { method: "POST", body: { email, password } });
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, error: error instanceof ApiError ? error.message : "Đã có lỗi kết nối" };
    }
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải dùng bên trong AuthProvider");
  return context;
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

// Trang cần đăng nhập: chưa đăng nhập thì chuyển tới /login?callbackUrl=...
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) {
    const callbackUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?callbackUrl=${callbackUrl}`} replace />;
  }
  return <>{children}</>;
}

// Trang quản trị: chỉ role ADMIN (server vẫn kiểm tra lại quyền ở từng API)
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to={`/login?callbackUrl=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.role !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Trang cần tới sau khi đăng nhập: callbackUrl nội bộ (chặn link ra trang ngoài), không có thì admin vào trang quản trị
export function afterLoginPath(user: CurrentUser, callbackUrl: string | null) {
  if (callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")) return callbackUrl;
  return user.role === "ADMIN" ? "/admin/dashboard" : "/";
}

// Trang đăng nhập/đăng ký: đã đăng nhập (hoặc vừa đăng nhập xong) thì chuyển tới trang phù hợp
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to={afterLoginPath(user, searchParams.get("callbackUrl"))} replace />;
  return <>{children}</>;
}
