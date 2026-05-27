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
    "Seu pedido foi reservado e está esperando confirmação",
  CONFIRMED: "Seu pedido foi confirmado com sucesso.",
  FAILED_TEMPORARY:
    "Processamento de pedidos indisponível. Tente novamente mais tarde",
  EXPIRED: "Não está mais ativa",
  REJECTED_STOCK: "Não é possível continuar, sem estoque disponível",
  CANCELLED: "Não está mais ativa"
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
