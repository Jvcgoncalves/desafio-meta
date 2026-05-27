import { createOrderRequestSchema } from "@casecellshop/shared";
import type { FastifyInstance } from "fastify";

import { FakeErpService } from "../../erp/services/fake-erp.service.js";
import { ProductRepository } from "../../products/models/product.repository.js";
import {
  OrdersController,
  type CreateOrderServicePort,
  type GetOrderStatusServicePort,
  type ListUserOrdersServicePort
} from "../controllers/orders.controller.js";
import { IdempotencyRepository } from "../models/idempotency.repository.js";
import { OrderRepository } from "../models/order.repository.js";
import { CreateOrderService } from "../services/create-order.service.js";
import { GetOrderStatusService } from "../services/get-order-status.service.js";
import { ListUserOrdersService } from "../services/list-user-orders.service.js";

export interface OrdersRoutesOptions {
  createOrderService?: CreateOrderServicePort;
  getOrderStatusService?: GetOrderStatusServicePort;
  listUserOrdersService?: ListUserOrdersServicePort;
}

const apiErrorResponseSchema = {
  type: "object",
  required: ["success", "message", "error", "traceId"],
  properties: {
    success: { type: "boolean", const: false },
    message: { type: "string" },
    error: {
      type: "object",
      required: ["code"],
      properties: {
        code: { type: "string" },
        details: {}
      },
      additionalProperties: false
    },
    traceId: { type: "string" }
  },
  additionalProperties: false
};

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
  const listUserOrdersService =
    options.listUserOrdersService ??
    new ListUserOrdersService(orderRepository);
  const ordersController = new OrdersController(
    createOrderService,
    getOrderStatusService,
    listUserOrdersService
  );

  app.get(
    "/",
    {
      schema: {
        tags: ["Orders"],
        summary: "List current user orders",
        description: "Returns all orders created by the authenticated user.",
        operationId: "listMyOrders",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            required: ["success", "message", "data"],
            properties: {
              success: { type: "boolean", const: true },
              message: { type: "string" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  required: [
                    "orderId",
                    "status",
                    "totalCents",
                    "createdAt",
                    "updatedAt"
                  ],
                  properties: {
                    orderId: { type: "string", format: "uuid" },
                    status: { type: "string", enum: ["PENDING_ERP", "CONFIRMED"] },
                    totalCents: { type: "integer", minimum: 0 },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" }
                  },
                  additionalProperties: false
                }
              },
              traceId: { type: "string" }
            },
            additionalProperties: false
          },
          401: apiErrorResponseSchema
        }
      },
      preHandler: async (request, reply) => {
        await app.authenticate(request, reply);
      }
    },
    ordersController.listMine
  );

  app.post(
    "/",
    {
      schema: {
        tags: ["Orders"],
        summary: "Create order",
        description:
          "Creates a new order for the authenticated user and triggers ERP processing.",
        operationId: "createOrder",
        security: [{ bearerAuth: [] }],
        headers: {
          type: "object",
          properties: {
            "idempotency-key": {
              type: "string",
              minLength: 1,
              description:
                "Unique key used to safely retry checkout requests without creating duplicates."
            },
            "x-erp-test-outcome": {
              type: "string",
              enum: ["confirmed", "delayed", "temporary_failure"],
              description: "Optional header to simulate ERP behavior in test/dev scenarios."
            }
          }
        },
        body: {
          type: "object",
          required: ["items"],
          properties: {
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: { type: "string", format: "uuid" },
                  quantity: { type: "integer", minimum: 1 }
                },
                additionalProperties: false
              }
            }
          },
          additionalProperties: false
        },
        response: {
          201: {
            type: "object",
            required: ["success", "message", "data"],
            properties: {
              success: { type: "boolean", const: true },
              message: { type: "string" },
              data: {
                type: "object",
                required: ["orderId", "status", "totalCents", "items", "createdAt"],
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  status: { type: "string", enum: ["PENDING_ERP", "CONFIRMED"] },
                  totalCents: { type: "integer", minimum: 0 },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: [
                        "productId",
                        "name",
                        "model",
                        "quantity",
                        "unitPriceCents",
                        "lineTotalCents"
                      ],
                      properties: {
                        productId: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        model: { type: "string" },
                        quantity: { type: "integer", minimum: 1 },
                        unitPriceCents: { type: "integer", minimum: 0 },
                        lineTotalCents: { type: "integer", minimum: 0 }
                      },
                      additionalProperties: false
                    }
                  },
                  createdAt: { type: "string", format: "date-time" }
                },
                additionalProperties: false
              },
              traceId: { type: "string" }
            },
            additionalProperties: false
          },
          202: {
            type: "object",
            required: ["success", "message", "data"],
            properties: {
              success: { type: "boolean", const: true },
              message: { type: "string" },
              data: {
                type: "object",
                required: ["orderId", "status", "totalCents", "items", "createdAt"],
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  status: { type: "string", enum: ["PENDING_ERP", "CONFIRMED"] },
                  totalCents: { type: "integer", minimum: 0 },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: [
                        "productId",
                        "name",
                        "model",
                        "quantity",
                        "unitPriceCents",
                        "lineTotalCents"
                      ],
                      properties: {
                        productId: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        model: { type: "string" },
                        quantity: { type: "integer", minimum: 1 },
                        unitPriceCents: { type: "integer", minimum: 0 },
                        lineTotalCents: { type: "integer", minimum: 0 }
                      },
                      additionalProperties: false
                    }
                  },
                  createdAt: { type: "string", format: "date-time" }
                },
                additionalProperties: false
              },
              traceId: { type: "string" }
            },
            additionalProperties: false
          },
          400: apiErrorResponseSchema,
          401: apiErrorResponseSchema,
          409: apiErrorResponseSchema,
          422: apiErrorResponseSchema,
          503: apiErrorResponseSchema
        }
      },
      preValidation: async (request, reply) => {
        await app.authenticate(request, reply);
      },
      preHandler: async (request, reply) => {
        request.body = createOrderRequestSchema.parse(request.body);
      }
    },
    ordersController.create
  );

  app.get(
    "/:orderId",
    {
      schema: {
        tags: ["Orders"],
        summary: "Get order status",
        description: "Returns current status details for an order.",
        operationId: "getOrderStatus",
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" }
          },
          additionalProperties: false
        },
        response: {
          200: {
            type: "object",
            required: ["success", "message", "data"],
            properties: {
              success: { type: "boolean", const: true },
              message: { type: "string" },
              data: {
                type: "object",
                required: [
                  "orderId",
                  "status",
                  "statusMessage",
                  "createdAt",
                  "updatedAt"
                ],
                properties: {
                  orderId: { type: "string", format: "uuid" },
                  status: { type: "string", enum: ["PENDING_ERP", "CONFIRMED"] },
                  statusMessage: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" }
                },
                additionalProperties: false
              },
              traceId: { type: "string" }
            },
            additionalProperties: false
          },
          404: apiErrorResponseSchema
        }
      }
    },
    ordersController.status
  );
}
