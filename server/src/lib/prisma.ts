import { PrismaClient } from "@prisma/client";

// Một kết nối dùng chung cho toàn bộ server
export const prisma = new PrismaClient();
