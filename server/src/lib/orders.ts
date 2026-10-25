import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { createNotification } from "./notify";
import { shortOrderId } from "../../../shared/format";
import {
  NEXT_ORDER_STATUS,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  POINT_UNIT_VND,
  rankForPoints,
  type OrderStatusName,
} from "../../../shared/site";

// Lỗi nghiệp vụ: thông báo được trả nguyên văn cho người dùng (HTTP 400)
export class OrderError extends Error {}

// Hoàn tất đơn: cộng điểm thành viên, xác nhận đã thanh toán
export async function completeOrderTx(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.update({
    where: { id: orderId },
    data: { status: "COMPLETED", paymentStatus: "PAID" },
  });

  const user = await tx.user.findUnique({ where: { id: order.userId }, select: { points: true } });
  if (user) {
    const points = user.points + Math.floor(Number(order.totalPayment) / POINT_UNIT_VND);
    await tx.user.update({
      where: { id: order.userId },
      data: { points, rank: rankForPoints(points) },
    });
  }
  return order;
}

// Hủy đơn: hoàn kho, trả lượt voucher, đánh dấu hoàn tiền nếu đã thanh toán
export async function cancelOrderTx(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });

  await tx.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      paymentStatus: order.paymentStatus === "PAID" ? "REFUNDED" : order.paymentStatus,
    },
  });

  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stockQuantity: { increment: item.quantity } },
    });
  }

  if (order.voucherId) {
    await tx.voucher.updateMany({
      where: { id: order.voucherId, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  }
  return order;
}

// Admin chuyển đơn sang trạng thái kế tiếp (hoặc hủy)
export async function adminUpdateOrderStatus(orderId: string, status: string, trackingCode?: string | null) {
  if (!ORDER_STATUSES.includes(status as OrderStatusName)) throw new OrderError("Trạng thái không hợp lệ");
  const next = status as OrderStatusName;
  const tracking = trackingCode?.trim() || "";

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new OrderError("Đơn hàng không tồn tại");

    const current = order.status as OrderStatusName;
    if (current === "COMPLETED" || current === "CANCELLED") {
      throw new OrderError("Đơn hàng đã kết thúc, không thể thay đổi");
    }

    if (next === "CANCELLED") {
      await cancelOrderTx(tx, orderId);
    } else {
      if (NEXT_ORDER_STATUS[current] !== next) {
        throw new OrderError(`Không thể chuyển từ "${ORDER_STATUS_LABEL[current]}" sang "${ORDER_STATUS_LABEL[next]}"`);
      }
      if (next === "SHIPPING" && !tracking) {
        throw new OrderError("Vui lòng nhập mã vận đơn trước khi giao hàng");
      }
      if (next === "COMPLETED") {
        await completeOrderTx(tx, orderId);
      } else {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: next,
            ...(next === "SHIPPING" ? { trackingCode: tracking } : {}),
            // COD: shipper thu tiền khi giao thành công
            ...(next === "DELIVERED" && order.paymentMethod === "COD" ? { paymentStatus: "PAID" as const } : {}),
          },
        });
      }
    }

    await createNotification(
      {
        userId: order.userId,
        title: `Đơn hàng #${shortOrderId(orderId)}: ${ORDER_STATUS_LABEL[next]}`,
        message:
          next === "SHIPPING"
            ? `Đơn hàng đã được giao cho đơn vị vận chuyển. Mã vận đơn: ${tracking}.`
            : next === "CANCELLED"
              ? "Đơn hàng đã bị hủy bởi cửa hàng. Vui lòng liên hệ hotline nếu bạn cần hỗ trợ."
              : `Trạng thái đơn hàng đã được cập nhật thành "${ORDER_STATUS_LABEL[next]}".`,
        type: "ORDER",
        link: "/buyer/orders",
      },
      tx
    );
  });
}

// Khách hủy đơn khi cửa hàng chưa đóng gói
export async function customerCancelOrder(userId: string, orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) throw new OrderError("Đơn hàng không tồn tại");
    if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
      throw new OrderError("Chỉ có thể hủy đơn hàng khi cửa hàng chưa đóng gói");
    }
    await cancelOrderTx(tx, orderId);
  });
}

// Khách xác nhận đã nhận hàng
export async function customerConfirmReceived(userId: string, orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) throw new OrderError("Đơn hàng không tồn tại");
    if (order.status !== "SHIPPING" && order.status !== "DELIVERED") {
      throw new OrderError("Đơn hàng chưa được giao, chưa thể xác nhận");
    }
    await completeOrderTx(tx, orderId);
  });
}
