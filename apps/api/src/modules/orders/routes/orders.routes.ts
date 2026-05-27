import { createOrderRequestSchema } from "@casecellshop/shared";
import type { FastifyInstance } from "fastify";

import { FakeErpService } from "../../erp/services/fake-erp.service.js";
import { ProductRepository } from "../../products/models/product.repository.js";
import {
  OrdersController,
  type CreateOrderServicePort,
  type GetOrderStatusServicePort
} from "../controllers/orders.controller.js";
import { IdempotencyRepository } from "../models/idempotency.repository.js";
import { OrderRepository } from "../models/order.repository.js";
import { CreateOrderService } from "../services/create-order.service.js";
import { GetOrderStatusService } from "../services/get-order-status.service.js";

export interface OrdersRoutesOptions {
  createOrderService?: CreateOrderServicePort;
  getOrderStatusService?: GetOrderStatusServicePort;
}

export async function ordersRoutes(
  app: FastifyInstance,
  options: OrdersRoutesOptions = {}
): Promise<void> {
  const orderRepository = new OrderRepository(app.prisma);
  const createOrderService =
    options.createOrderService ??
    new CreateOrderService(
      orderRepository,
      new IdempotencyRepository(app.prisma),
      new ProductRepository(app.prisma),
      new FakeErpService(),
      app.log
    );
  const getOrderStatusService =
    options.getOrderStatusService ??
    new GetOrderStatusService(orderRepository);
  const ordersController = new OrdersController(
    createOrderService,
    getOrderStatusService
  );

  app.post(
    "/",
    {
      preHandler: async (request, reply) => {
        await app.authenticate(request, reply);
        request.body = createOrderRequestSchema.parse(request.body);
      }
    },
    ordersController.create
  );

  app.get("/:orderId", ordersController.status);
}
