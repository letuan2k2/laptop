import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// Tạo thông báo cho khách – hàm nội bộ của server, không mở thành API
export async function createNotification(
  {
    userId,
    title,
    message,
    type = "INFO",
    link,
  }: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
  },
  tx: Prisma.TransactionClient = prisma
) {
  try {
    await tx.notification.create({ data: { userId, title, message, type, link } });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}
