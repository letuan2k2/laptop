import { Router } from "express";
import { randomInt } from "crypto";
import { prisma } from "../lib/prisma";
import { AUTH_COOKIE, authCookieOptions, comparePassword, hashPassword, signToken } from "../lib/auth";
import { sendOTPByEmail } from "../lib/mail";
import { str } from "../lib/http";
import { clearAuthCookie } from "../middleware/auth";

export const authRouter = Router();

const PUBLIC_USER = { id: true, name: true, email: true, role: true, points: true, rank: true } as const;

// POST /api/auth/register – đăng ký tài khoản khách hàng
authRouter.post("/register", async (req, res) => {
  const email = str(req.body, "email")?.toLowerCase();
  const name = str(req.body, "name");
  const password = req.body?.password ? String(req.body.password) : "";

  if (!email || !password || !name) {
    res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Email không hợp lệ" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Mật khẩu phải có ít nhất 6 ký tự" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(400).json({ error: "Email này đã được sử dụng" });
    return;
  }

  const user = await prisma.user.create({
    data: { email, name: name.slice(0, 100), passwordHash: await hashPassword(password), role: "USER" },
  });
  res.status(201).json({ message: "Đăng ký thành công", userId: user.id });
});

// POST /api/auth/login – đăng nhập, server ghi JWT vào cookie httpOnly
authRouter.post("/login", async (req, res) => {
  const email = str(req.body, "email")?.toLowerCase();
  const password = req.body?.password ? String(req.body.password) : "";
  if (!email || !password) {
    res.status(400).json({ error: "Vui lòng nhập email và mật khẩu" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
    return;
  }

  res.cookie(AUTH_COOKIE, signToken({ id: user.id, role: user.role }), authCookieOptions());
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, points: user.points, rank: user.rank },
  });
});

// POST /api/auth/logout
authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

// GET /api/auth/me – người dùng hiện tại (điểm, hạng luôn lấy mới từ CSDL)
authRouter.get("/me", async (req, res) => {
  if (!req.user) {
    res.json({ user: null });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: PUBLIC_USER });
  // Tài khoản đã bị xóa: xóa cookie cũ để trình duyệt về trạng thái chưa đăng nhập
  if (!user) clearAuthCookie(res);
  res.json({ user });
});

// POST /api/auth/forgot-password – gửi mã OTP 6 số qua Gmail
authRouter.post("/forgot-password", async (req, res) => {
  const email = str(req.body, "email")?.toLowerCase();
  if (!email) {
    res.status(400).json({ error: "Vui lòng nhập email" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ error: "Email không tồn tại trong hệ thống" });
    return;
  }

  const token = String(randomInt(100000, 1000000));
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
  });

  try {
    await sendOTPByEmail(email, token);
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ error: "Không gửi được email. Vui lòng kiểm tra cấu hình Gmail của cửa hàng." });
    return;
  }
  res.json({ message: `Mã OTP đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư.` });
});

// POST /api/auth/reset-password – đặt lại mật khẩu bằng mã OTP
authRouter.post("/reset-password", async (req, res) => {
  const token = str(req.body, "token")?.replace(/\s/g, "");
  const email = str(req.body, "email")?.toLowerCase();
  const password = req.body?.password ? String(req.body.password) : "";
  if (!token || password.length < 6) {
    res.status(400).json({ error: "Mã OTP hoặc mật khẩu mới không hợp lệ (tối thiểu 6 ký tự)" });
    return;
  }

  // Trang đặt lại mật khẩu gửi kèm email → kiểm tra mã của đúng tài khoản đó và báo lỗi cụ thể
  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetToken || !user.resetTokenExpiry) {
    res.status(400).json({ error: "Tài khoản chưa yêu cầu mã OTP hoặc mã đã được sử dụng. Vui lòng bấm gửi lại mã." });
    return;
  }
  if (user.resetTokenExpiry < new Date()) {
    res.status(400).json({ error: "Mã OTP đã hết hạn (quá 1 giờ). Vui lòng bấm gửi lại mã." });
    return;
  }
  if (user.resetToken !== token) {
    res.status(400).json({ error: "Mã OTP không đúng. Mỗi lần gửi lại, mã cũ sẽ mất hiệu lực – hãy dùng mã trong email mới nhất." });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password), resetToken: null, resetTokenExpiry: null },
  });
  res.json({ message: "Mật khẩu đã được cập nhật thành công" });
});
