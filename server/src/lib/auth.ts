import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { CookieOptions } from "express";

// Đăng nhập bằng JWT lưu trong cookie httpOnly (JavaScript phía trình duyệt không đọc được token)
export const AUTH_COOKIE = "lapstore_token";
const MAX_AGE_DAYS = 30;

export interface AuthUser {
  id: string;
  role: "USER" | "ADMIN";
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Thiếu biến AUTH_SECRET trong file server/.env");
  return value;
}

export function signToken(user: AuthUser) {
  return jwt.sign({ id: user.id, role: user.role }, secret(), { expiresIn: `${MAX_AGE_DAYS}d` });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const data = jwt.verify(token, secret()) as jwt.JwtPayload;
    if (typeof data.id !== "string" || (data.role !== "USER" && data.role !== "ADMIN")) return null;
    return { id: data.id, role: data.role };
  } catch {
    return null;
  }
}

export function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);
