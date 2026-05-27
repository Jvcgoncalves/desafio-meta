import type { Prisma, PrismaClient } from "@prisma/client";
import type { OrderStatus } from "@casecellshop/shared";

import type { OrderItemRecord, OrderRecord } from "./order.types.js";

export type PrismaTransaction = Prisma.TransactionClient;

interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

interface CreateOrderInput {
  userId: string;
  status: OrderStatus;
  totalCents: number;
  reservationExpiresAt: Date;
  items: CreateOrderItemInput[];
}

const orderInclude = {
  items: {
    include: {
      product: {
        select: {
          name: true,
          model: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  }
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function toOrderRecord(order: OrderWithItems): OrderRecord {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    totalCents: order.totalCents,
    reservationExpiresAt: order.reservationExpiresAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item): OrderItemRecord => ({
      productId: item.productId,
      name: item.product.name,
      model: item.product.model,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents
    }))
  };
}

export class OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async transaction<T>(
    operation: (transaction: PrismaTransaction) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(operation);
  }

  async create(
    input: CreateOrderInput,
    transaction: PrismaTransaction
  ): Promise<OrderRecord> {
    const order = await transaction.order.create({
      data: {
        userId: input.userId,
        status: input.status,
        totalCents: input.totalCents,
        reservationExpiresAt: input.reservationExpiresAt,
        items: {
          createMany: {
            data: input.items
          }
        }
      },
      include: orderInclude
    });

    return toOrderRecord(order);
  }

  async findById(orderId: string): Promise<OrderRecord | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude
    });

    return order ? toOrderRecord(order) : null;
  }

  async findByIdForUpdate(
    orderId: string,
    transaction: PrismaTransaction
  ): Promise<OrderRecord | null> {
    const order = await transaction.order.findUnique({
      where: { id: orderId },
      include: orderInclude
    });

    return order ? toOrderRecord(order) : null;
  }

  async findIdempotentOrderResult(
    userId: string,
    idempotencyKey: string
  ): Promise<OrderRecord | null> {
    const record = await this.prisma.idempotencyKey.findUnique({
      where: {
        userId_idempotencyKey: {
          userId,
          idempotencyKey
        }
      },
      include: {
        order: {
          include: orderInclude
        }
      }
    });

    return record?.order ? toOrderRecord(record.order) : null;
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    transaction?: PrismaTransaction,
    erpReference?: string
  ): Promise<OrderRecord> {
    const client = transaction ?? this.prisma;
    const order = await client.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(erpReference === undefined ? {} : { erpReference })
      },
      include: orderInclude
    });

    return toOrderRecord(order);
  }

  async findProcessableOrders(now: Date, limit = 25): Promise<OrderRecord[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        OR: [
          { status: "PENDING_ERP" },
          {
            status: "FAILED_TEMPORARY",
            reservationExpiresAt: { lte: now }
          }
        ]
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: orderInclude
    });

    return orders.map(toOrderRecord);
  }
}
