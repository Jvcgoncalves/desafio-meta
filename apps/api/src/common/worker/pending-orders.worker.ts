import type { PrismaClient } from "@prisma/client";
import type { FastifyBaseLogger } from "fastify";

import type { ErpGatewayPort } from "../../modules/erp/services/fake-erp.service.js";
import { ProductRepository } from "../../modules/products/models/product.repository.js";
import { OrderRepository } from "../../modules/orders/models/order.repository.js";
import type { OrderRecord } from "../../modules/orders/models/order.types.js";

export class PendingOrdersWorker {
  private interval: NodeJS.Timeout | undefined;
  private running = false;

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly erpGateway: ErpGatewayPort,
    private readonly logger: FastifyBaseLogger,
    private readonly intervalMs = 10_000
  ) {}

  static fromPrisma(
    prisma: PrismaClient,
    erpGateway: ErpGatewayPort,
    logger: FastifyBaseLogger,
    intervalMs?: number
  ): PendingOrdersWorker {
    return new PendingOrdersWorker(
      new OrderRepository(prisma),
      new ProductRepository(prisma),
      erpGateway,
      logger,
      intervalMs
    );
  }

  start(): void {
    if (this.interval) {
      return;
    }

    this.interval = setInterval(() => {
      void this.processOnce();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  async processOnce(now = new Date()): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const orders = await this.orderRepository.findProcessableOrders(now);

      for (const order of orders) {
        await this.processOrder(order, now);
      }
    } finally {
      this.running = false;
    }
  }

  private async processOrder(order: OrderRecord, now: Date): Promise<void> {
    if (order.reservationExpiresAt && order.reservationExpiresAt <= now) {
      await this.orderRepository.transaction(async (transaction) => {
        for (const item of order.items) {
          await this.productRepository.releaseReservedStock(
            item.productId,
            item.quantity,
            transaction
          );
        }

        await this.orderRepository.updateStatus(order.id, "EXPIRED", transaction);
      });

      this.logger.info(
        {
          orderId: order.id,
          step: "checkout.status_update",
          status: "EXPIRED"
        },
        "pending order reservation expired"
      );
      return;
    }

    if (order.status !== "PENDING_ERP") {
      return;
    }

    const erpResult = await this.erpGateway.processOrder({ orderId: order.id });

    if (erpResult.outcome === "delayed") {
      return;
    }

    if (erpResult.outcome === "temporary_failure") {
      await this.orderRepository.updateStatus(order.id, "FAILED_TEMPORARY");
      this.logger.info(
        {
          orderId: order.id,
          step: "checkout.status_update",
          status: "FAILED_TEMPORARY"
        },
        "pending order temporarily failed"
      );
      return;
    }

    await this.orderRepository.transaction(async (transaction) => {
      for (const item of order.items) {
        await this.productRepository.consumeReservedStock(
          item.productId,
          item.quantity,
          transaction
        );
      }

      await this.orderRepository.updateStatus(
        order.id,
        "CONFIRMED",
        transaction,
        erpResult.erpReference
      );
    });

    this.logger.info(
      {
        orderId: order.id,
        step: "checkout.status_update",
        status: "CONFIRMED"
      },
      "pending order confirmed"
    );
  }
}
