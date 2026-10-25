import { vi } from "vitest";
import request from "supertest";
import { AUTH_COOKIE, signToken } from "../src/lib/auth";

process.env.AUTH_SECRET = "test-secret";

// Prisma giả: mỗi model là một tập hàm vi.fn(); test tự đặt giá trị trả về
const model = () => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
  groupBy: vi.fn(),
});

export function createPrismaMock() {
  const mock = {
    user: model(),
    category: model(),
    product: model(),
    priceHistory: model(),
    order: model(),
    orderItem: model(),
    review: model(),
    reviewReply: model(),
    favorite: model(),
    privateNote: model(),
    conversation: model(),
    message: model(),
    notification: model(),
    voucher: { ...model(), fields: { usageLimit: "usageLimit" } },
    userAddress: model(),
    feedback: model(),
    // Transaction gọi callback với chính prisma giả (hoặc chạy mảng promise)
    $transaction: vi.fn(),
  };
  // Middleware requireAuth kiểm tra tài khoản còn tồn tại: mặc định coi mọi id là tài khoản hợp lệ
  // (id bắt đầu bằng "admin" là ADMIN); test riêng có thể đổi để giả lập tài khoản đã bị xóa
  mock.user.findFirst.mockImplementation(async (args: { where: { id: string } }) => ({
    id: args.where.id,
    role: args.where.id.startsWith("admin") ? "ADMIN" : "USER",
  }));
  mock.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === "function" ? (arg as (tx: typeof mock) => unknown)(mock) : Promise.all(arg as unknown[])
  );
  return mock;
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;

// Cookie đăng nhập hợp lệ cho người dùng giả
export function loginCookie(user: { id: string; role?: "USER" | "ADMIN" }) {
  return `${AUTH_COOKIE}=${signToken({ id: user.id, role: user.role ?? "USER" })}`;
}

export const CUSTOMER = loginCookie({ id: "user1" });
export const ADMIN = loginCookie({ id: "admin1", role: "ADMIN" });

export async function api() {
  const { createApp } = await import("../src/app");
  return request(createApp());
}
