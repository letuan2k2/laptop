import { Router, type Request } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

// Chat giữa khách và cửa hàng: khách chỉ thấy hội thoại của mình, admin (nhân viên) thấy tất cả
export const chatRouter = Router();

// GET /api/chat/unread – số tin chưa đọc (không bắt buộc đăng nhập)
chatRouter.get("/unread", async (req, res) => {
  if (!req.user) {
    res.json({ count: 0 });
    return;
  }

  if (req.user.role === "ADMIN") {
    // Tin khách gửi mà shop chưa đọc
    const unread = await prisma.message.findMany({
      where: { isRead: false },
      select: { senderId: true, conversation: { select: { userId: true } } },
    });
    res.json({ count: unread.filter((m) => m.senderId === m.conversation.userId).length });
    return;
  }

  const count = await prisma.message.count({
    where: { conversation: { userId: req.user.id }, senderId: { not: req.user.id }, isRead: false },
  });
  res.json({ count });
});

chatRouter.use("/conversations", requireAuth);

// GET /api/chat/conversations
chatRouter.get("/conversations", async (req, res) => {
  const { id: userId, role } = req.user!;
  const isAdmin = role === "ADMIN";

  const conversations = await prisma.conversation.findMany({
    where: isAdmin ? {} : { userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, imageUrl: true, brand: true } },
    },
    orderBy: { lastMsgAt: "desc" },
  });

  // Tin chưa đọc: với khách là tin do shop gửi, với admin là tin do khách gửi
  const unreadMessages = await prisma.message.findMany({
    where: { conversationId: { in: conversations.map((c) => c.id) }, isRead: false },
    select: { conversationId: true, senderId: true },
  });

  const unreadByConversation = new Map<string, number>();
  for (const m of unreadMessages) {
    const conv = conversations.find((c) => c.id === m.conversationId);
    const fromCustomer = m.senderId === conv?.userId;
    if (isAdmin ? fromCustomer : m.senderId !== userId) {
      unreadByConversation.set(m.conversationId, (unreadByConversation.get(m.conversationId) || 0) + 1);
    }
  }

  res.json(conversations.map((c) => ({ ...c, unreadCount: unreadByConversation.get(c.id) || 0 })));
});

// POST /api/chat/conversations – khách mở (hoặc tạo) hội thoại, có thể kèm sản phẩm đang hỏi
chatRouter.post("/conversations", async (req, res) => {
  const { id: userId, role } = req.user!;
  if (role === "ADMIN") {
    res.status(400).json({ error: "Tài khoản quản trị không thể tự tạo hội thoại" });
    return;
  }

  const productId = typeof req.body?.productId === "string" && req.body.productId ? req.body.productId : null;
  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      res.status(400).json({ error: "Sản phẩm không tồn tại" });
      return;
    }
  }

  const conversation =
    (await prisma.conversation.findFirst({ where: { userId, productId } })) ??
    (await prisma.conversation.create({ data: { userId, productId } }));
  res.json(conversation);
});

async function getAccessibleConversation(req: Request) {
  const { id: userId, role } = req.user!;
  const conversation = await prisma.conversation.findUnique({ where: { id: String(req.params.id) } });
  if (!conversation || (role !== "ADMIN" && conversation.userId !== userId)) return null;
  return conversation;
}

// GET /api/chat/conversations/:id/messages – đọc tin nhắn và đánh dấu đã đọc
chatRouter.get("/conversations/:id/messages", async (req, res) => {
  const conversation = await getAccessibleConversation(req);
  if (!conversation) {
    res.status(404).json({ error: "Không tìm thấy cuộc hội thoại" });
    return;
  }
  const { id: userId, role } = req.user!;

  // Khách đọc tin của shop, admin đọc tin của khách
  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      isRead: false,
      ...(role === "ADMIN" ? { senderId: conversation.userId } : { senderId: { not: userId } }),
    },
    data: { isRead: true },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
});

// POST /api/chat/conversations/:id/messages – gửi tin nhắn
chatRouter.post("/conversations/:id/messages", async (req, res) => {
  const conversation = await getAccessibleConversation(req);
  if (!conversation) {
    res.status(404).json({ error: "Không tìm thấy cuộc hội thoại" });
    return;
  }

  const text = String(req.body?.content || "").trim();
  if (!text) {
    res.status(400).json({ error: "Tin nhắn không được để trống" });
    return;
  }

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: { conversationId: conversation.id, senderId: req.user!.id, content: text.slice(0, 2000) },
    });
    await tx.conversation.update({
      where: { id: conversation.id },
      data: { lastMessage: text.slice(0, 200), lastMsgAt: new Date() },
    });
    return msg;
  });
  res.json(message);
});
