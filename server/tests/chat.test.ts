import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ADMIN, CUSTOMER, type PrismaMock } from "./helpers";

vi.mock("../src/lib/prisma", async () => ({ prisma: (await import("./helpers")).createPrismaMock() }));

import { prisma as realPrisma } from "../src/lib/prisma";

const prisma = realPrisma as unknown as PrismaMock;

describe("Chat với cửa hàng", () => {
  beforeEach(() => vi.clearAllMocks());

  it("số tin chưa đọc = 0 khi chưa đăng nhập", async () => {
    const res = await (await api()).get("/api/chat/unread");
    expect(res.body.count).toBe(0);
    expect(prisma.message.count).not.toHaveBeenCalled();
  });

  it("khách chỉ đếm tin do cửa hàng gửi", async () => {
    prisma.message.count.mockResolvedValue(3);
    const res = await (await api()).get("/api/chat/unread").set("Cookie", CUSTOMER);
    expect(res.body.count).toBe(3);
    expect(prisma.message.count.mock.calls[0][0].where).toMatchObject({ senderId: { not: "user1" }, isRead: false });
  });

  it("admin chỉ đếm tin do khách gửi", async () => {
    prisma.message.findMany.mockResolvedValue([
      { senderId: "u1", conversation: { userId: "u1" } },
      { senderId: "admin1", conversation: { userId: "u1" } },
    ]);
    const res = await (await api()).get("/api/chat/unread").set("Cookie", ADMIN);
    expect(res.body.count).toBe(1);
  });

  it("danh sách hội thoại yêu cầu đăng nhập", async () => {
    const res = await (await api()).get("/api/chat/conversations");
    expect(res.status).toBe(401);
  });

  it("khách chỉ thấy hội thoại của mình, admin thấy tất cả", async () => {
    prisma.conversation.findMany.mockResolvedValue([]);
    prisma.message.findMany.mockResolvedValue([]);
    const client = await api();
    await client.get("/api/chat/conversations").set("Cookie", CUSTOMER);
    expect(prisma.conversation.findMany.mock.calls[0][0].where).toEqual({ userId: "user1" });
    await client.get("/api/chat/conversations").set("Cookie", ADMIN);
    expect(prisma.conversation.findMany.mock.calls[1][0].where).toEqual({});
  });

  it("admin không tự tạo hội thoại", async () => {
    const res = await (await api()).post("/api/chat/conversations").set("Cookie", ADMIN).send({});
    expect(res.status).toBe(400);
  });

  it("mở lại hội thoại cũ thay vì tạo mới", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "p1" });
    prisma.conversation.findFirst.mockResolvedValue({ id: "c1", userId: "user1", productId: "p1" });
    const res = await (await api()).post("/api/chat/conversations").set("Cookie", CUSTOMER).send({ productId: "p1" });
    expect(res.body.id).toBe("c1");
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it("không đọc được hội thoại của người khác", async () => {
    prisma.conversation.findUnique.mockResolvedValue({ id: "c9", userId: "nguoi-khac" });
    const res = await (await api()).get("/api/chat/conversations/c9/messages").set("Cookie", CUSTOMER);
    expect(res.status).toBe(404);
    expect(prisma.message.findMany).not.toHaveBeenCalled();
  });

  it("đọc tin thì đánh dấu đã đọc các tin của phía bên kia", async () => {
    prisma.conversation.findUnique.mockResolvedValue({ id: "c1", userId: "u1" });
    prisma.message.findMany.mockResolvedValue([{ id: "m1" }]);
    const res = await (await api()).get("/api/chat/conversations/c1/messages").set("Cookie", ADMIN);
    expect(res.body).toHaveLength(1);
    expect(prisma.message.updateMany.mock.calls[0][0].where).toMatchObject({ conversationId: "c1", senderId: "u1" });
  });

  it("không gửi tin nhắn rỗng", async () => {
    prisma.conversation.findUnique.mockResolvedValue({ id: "c1", userId: "user1" });
    const res = await (await api()).post("/api/chat/conversations/c1/messages").set("Cookie", CUSTOMER).send({ content: "   " });
    expect(res.status).toBe(400);
  });

  it("gửi tin nhắn và cập nhật tin cuối của hội thoại", async () => {
    prisma.conversation.findUnique.mockResolvedValue({ id: "c1", userId: "user1" });
    prisma.message.create.mockResolvedValue({ id: "m1", content: "Còn hàng không shop?" });
    const res = await (await api())
      .post("/api/chat/conversations/c1/messages")
      .set("Cookie", CUSTOMER)
      .send({ content: "Còn hàng không shop?" });
    expect(res.body.id).toBe("m1");
    expect(prisma.message.create.mock.calls[0][0].data).toMatchObject({ senderId: "user1", conversationId: "c1" });
    expect(prisma.conversation.update).toHaveBeenCalled();
  });
});
