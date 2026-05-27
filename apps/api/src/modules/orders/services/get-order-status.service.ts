import {
  APP_ERROR_CODES,
  type OrderStatus,
  type OrderStatusResponseDto
} from "@casecellshop/shared";

import { AppError } from "../../../common/errors/app-error.js";
import type { OrderRecord } from "../models/order.types.js";

interface OrderStatusRepositoryPort {
  findById: (orderId: string) => Promise<OrderRecord | null>;
}

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  PENDING_ERP:
    "Your order is reserved and waiting for processing confirmation.",
  CONFIRMED: "Your order was confirmed successfully.",
  FAILED_TEMPORARY:
    "Order processing is temporarily unavailable. Check again later.",
  EXPIRED: "This order reservation is no longer active.",
  REJECTED_STOCK: "This order could not be completed because stock was rejected.",
  CANCELLED: "This order reservation is no longer active."
};

export class GetOrderStatusService {
  constructor(private readonly orderRepository: OrderStatusRepositoryPort) {}

  async getOrderStatus(orderId: string): Promise<OrderStatusResponseDto> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new AppError({
        code: APP_ERROR_CODES.ORDER_NOT_FOUND,
        message: "Order not found.",
        statusCode: 404
      });
    }

    return {
      orderId: order.id,
      status: order.status,
      statusMessage: STATUS_MESSAGES[order.status],
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    };
  }
}
