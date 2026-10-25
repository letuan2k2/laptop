import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE, authCookieOptions, verifyToken, type AuthUser } from "../lib/auth";
import { prisma } from "../lib/prisma";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Đọc cookie đăng nhập (nếu có) và gắn người dùng vào req.user
export function loadUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (typeof token === "string") {
    const user = verifyToken(token);
    if (user) req.user = user;
  }
  next();
}

export function clearAuthCookie(res: Response) {
  const { maxAge: _maxAge, ...options } = authCookieOptions();
  res.clearCookie(AUTH_COOKIE, options);
}

// Token hợp lệ nhưng tài khoản đã bị xóa → coi như đăng xuất; vai trò luôn lấy mới từ CSDL
async function ensureSessionUser(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: "Vui lòng đăng nhập để tiếp tục" });
    return false;
  }
  const user = await prisma.user.findFirst({ where: { id: req.user.id }, select: { id: true, role: true } });
  if (!user) {
    clearAuthCookie(res);
    req.user = undefined;
    res.status(401).json({ error: "Phiên đăng nhập không còn hợp lệ, vui lòng đăng nhập lại" });
    return false;
  }
  req.user = { id: user.id, role: user.role };
  return true;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (await ensureSessionUser(req, res)) next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(await ensureSessionUser(req, res))) return;
  if (req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Không có quyền thực hiện" });
    return;
  }
  next();
}
