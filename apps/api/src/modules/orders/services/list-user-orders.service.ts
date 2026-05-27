import type { UserOrderSummaryDto } from "@casecellshop/shared";

import type { OrderRecord } from "../models/order.types.js";

interface UserOrdersRepositoryPort {
  findByUserId: (userId: string, limit?: number) => Promise<OrderRecord[]>;
}

export class ListUserOrdersService {
  constructor(private readonly orderRepository: UserOrdersRepositoryPort) {}

  async getUserOrders(userId: string): Promise<UserOrderSummaryDto[]> {
    const orders = await this.orderRepository.findByUserId(userId, 20);

    return orders.map((order) => ({
      orderId: order.id,
      status: order.status,
      totalCents: order.totalCents,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    }));
  }
}
