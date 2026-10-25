import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ADMIN, CUSTOMER, type PrismaMock } from "./helpers";

vi.mock("../src/lib/prisma", async () => ({ prisma: (await import("./helpers")).createPrismaMock() }));
vi.mock("../src/lib/mail", () => ({ sendOTPByEmail: vi.fn() }));

import { prisma as realPrisma } from "../src/lib/prisma";
import { sendOTPByEmail } from "../src/lib/mail";
import { hashPassword } from "../src/lib/auth";

const prisma = realPrisma as unknown as PrismaMock;

describe("POST /api/auth/register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("báo lỗi khi thiếu thông tin", async () => {
    const res = await (await api()).post("/api/auth/register").send({ email: "a@b.com" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Vui lòng nhập đầy đủ thông tin");
  });

  it("từ chối mật khẩu ngắn hơn 6 ký tự", async () => {
    const res = await (await api()).post("/api/auth/register").send({ email: "a@b.com", name: "A", password: "123" });
    expect(res.status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("từ chối email đã được dùng", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1" });
    const res = await (await api()).post("/api/auth/register").send({ email: "a@b.com", name: "A", password: "123456" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email này đã được sử dụng");
  });

  it("tạo tài khoản USER với mật khẩu đã băm", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "new-user" });
    const res = await (await api())
      .post("/api/auth/register")
      .send({ email: "Khach@Gmail.com", name: "Khách", password: "123456", role: "ADMIN" });

    expect(res.status).toBe(201);
    const data = prisma.user.create.mock.calls[0][0].data;
    expect(data.email).toBe("khach@gmail.com");
    expect(data.role).toBe("USER");
    expect(data.passwordHash).not.toBe("123456");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sai mật khẩu thì trả 401 và không đặt cookie", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", passwordHash: await hashPassword("dung-mat-khau") });
    const res = await (await api()).post("/api/auth/login").send({ email: "a@b.com", password: "sai" });
    expect(res.status).toBe(401);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("đúng mật khẩu thì đặt cookie httpOnly và trả thông tin người dùng", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "A",
      email: "a@b.com",
      role: "USER",
      points: 0,
      rank: "BRONZE",
      passwordHash: await hashPassword("12345678"),
    });
    const res = await (await api()).post("/api/auth/login").send({ email: "a@b.com", password: "12345678" });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: "u1", role: "USER" });
    expect(res.body.user.passwordHash).toBeUndefined();
    const cookie = String(res.headers["set-cookie"]);
    expect(cookie).toContain("lapstore_token=");
    expect(cookie).toContain("HttpOnly");
  });
});

describe("GET /api/auth/me", () => {
  beforeEach(() => vi.clearAllMocks());

  it("chưa đăng nhập thì user = null", async () => {
    const res = await (await api()).get("/api/auth/me");
    expect(res.body).toEqual({ user: null });
  });

  it("cookie giả mạo bị bỏ qua", async () => {
    const res = await (await api()).get("/api/auth/me").set("Cookie", "lapstore_token=abc.def.ghi");
    expect(res.body).toEqual({ user: null });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("đã đăng nhập thì lấy thông tin mới nhất từ CSDL", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "user1", name: "A", points: 2500, rank: "SILVER" });
    const res = await (await api()).get("/api/auth/me").set("Cookie", CUSTOMER);
    expect(res.body.user.rank).toBe("SILVER");
  });
});

describe("Quên mật khẩu bằng OTP", () => {
  beforeEach(() => vi.clearAllMocks());

  it("email không tồn tại thì báo lỗi, không gửi mail", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const res = await (await api()).post("/api/auth/forgot-password").send({ email: "x@y.com" });
    expect(res.status).toBe(404);
    expect(sendOTPByEmail).not.toHaveBeenCalled();
  });

  it("tạo mã OTP 6 số, hạn 1 giờ và gửi qua Gmail", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1" });
    const res = await (await api()).post("/api/auth/forgot-password").send({ email: "a@b.com" });

    expect(res.status).toBe(200);
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(data.resetToken).toMatch(/^\d{6}$/);
    expect(sendOTPByEmail).toHaveBeenCalledWith("a@b.com", data.resetToken);
  });

  it("mã OTP hết hạn thì không đổi được mật khẩu", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", resetToken: "123456", resetTokenExpiry: new Date(Date.now() - 1000) });
    const res = await (await api()).post("/api/auth/reset-password").send({ token: "123456", password: "matkhaumoi" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/hết hạn/);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("mã OTP hợp lệ thì đổi mật khẩu và xóa mã", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", resetToken: "123456", resetTokenExpiry: new Date(Date.now() + 60_000) });
    const res = await (await api()).post("/api/auth/reset-password").send({ token: "123456", password: "matkhaumoi" });
    expect(res.status).toBe(200);
    expect(prisma.user.update.mock.calls[0][0].data).toMatchObject({ resetToken: null, resetTokenExpiry: null });
  });

  it("gửi kèm email: tra đúng tài khoản theo email, bỏ khoảng trắng trong mã", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", resetToken: "123456", resetTokenExpiry: new Date(Date.now() + 60_000) });
    const res = await (await api())
      .post("/api/auth/reset-password")
      .send({ email: "A@B.com", token: " 123 456 ", password: "matkhaumoi" });
    expect(res.status).toBe(200);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "a@b.com" } });
  });

  it("gửi kèm email: mã cũ (đã bị mã mới thay) → báo rõ dùng email mới nhất", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", resetToken: "999999", resetTokenExpiry: new Date(Date.now() + 60_000) });
    const res = await (await api())
      .post("/api/auth/reset-password")
      .send({ email: "a@b.com", token: "123456", password: "matkhaumoi" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email mới nhất/);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("gửi kèm email: chưa yêu cầu mã hoặc mã đã dùng → báo gửi lại mã", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", resetToken: null, resetTokenExpiry: null });
    const res = await (await api())
      .post("/api/auth/reset-password")
      .send({ email: "a@b.com", token: "123456", password: "matkhaumoi" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/gửi lại mã/);
  });
});

describe("Tài khoản đã bị xóa nhưng trình duyệt còn cookie cũ", () => {
  beforeEach(() => vi.clearAllMocks());

  it("API cần đăng nhập trả 401 kèm thông báo rõ ràng và xóa cookie (không lỗi 500)", async () => {
    prisma.user.findFirst.mockResolvedValueOnce(null);
    const res = await (await api())
      .post("/api/addresses")
      .set("Cookie", CUSTOMER)
      .send({ name: "anh", phone: "0265486625", address: "tây sơn" });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain("đăng nhập lại");
    expect(String(res.headers["set-cookie"])).toContain("lapstore_token=;");
    expect(prisma.userAddress.create).not.toHaveBeenCalled();
  });

  it("GET /api/auth/me trả user = null và xóa cookie", async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const res = await (await api()).get("/api/auth/me").set("Cookie", CUSTOMER);
    expect(res.body).toEqual({ user: null });
    expect(String(res.headers["set-cookie"])).toContain("lapstore_token=;");
  });

  it("vai trò lấy từ CSDL: token ghi ADMIN nhưng tài khoản giờ là USER thì bị chặn trang quản trị", async () => {
    prisma.user.findFirst.mockResolvedValueOnce({ id: "admin1", role: "USER" });
    const res = await (await api()).get("/api/admin/dashboard").set("Cookie", ADMIN);
    expect(res.status).toBe(403);
  });
});
