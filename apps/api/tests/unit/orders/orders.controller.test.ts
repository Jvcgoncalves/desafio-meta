import {
  APP_ERROR_CODES,
  type CreateOrderResponse,
  type OrderStatusResponseDto,
  type UserOrderSummaryDto
} from "@casecellshop/shared";
import jwt from "@fastify/jwt";
import fastify from "fastify";
import { describe, expect, it } from "vitest";

import { AppError } from "../../../src/common/errors/app-error.js";
import { registerErrorHandler } from "../../../src/common/errors/error-handler.js";
import { authPlugin } from "../../../src/common/plugins/auth.plugin.js";
import { requestIdPlugin } from "../../../src/common/plugins/request-id.plugin.js";
import { ordersRoutes } from "../../../src/modules/orders/routes/orders.routes.js";

const user = {
  id: "2ff1fe3d-29c3-4835-a6f8-fcfa8db8d60e",
  email: "demo@casecellshop.local"
};

const orderResponse: CreateOrderResponse = {
  orderId: "9f434c19-cd5c-41d8-9d1a-a51f564d75d2",
  status: "CONFIRMED",
  totalCents: 7990,
  items: [
    {
      productId: "0d55fcf5-74e9-45df-8f3b-94d2a9eb6bc8",
      name: "Clear Armor Case",
      model: "iPhone 15",
      quantity: 1,
      unitPriceCents: 7990,
      lineTotalCents: 7990
    }
  ],
  createdAt: "2026-01-01T10:00:00.000Z"
};

const statusResponse: OrderStatusResponseDto = {
  orderId: "9f434c19-cd5c-41d8-9d1a-a51f564d75d2",
  status: "CONFIRMED",
  statusMessage: "Seu pedido foi confirmado com sucesso.",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:05:00.000Z"
};

const userOrdersResponse: UserOrderSummaryDto[] = [
  {
    orderId: "9f434c19-cd5c-41d8-9d1a-a51f564d75d2",
    status: "CONFIRMED",
    totalCents: 7990,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:05:00.000Z"
  }
];

async function buildOrdersTestApp(
  overrides: {
    createOrder?: () => Promise<{
      response: CreateOrderResponse;
      httpStatus: 201 | 202;
      replayed: boolean;
    }>;
    getOrderStatus?: () => Promise<OrderStatusResponseDto>;
    getUserOrders?: () => Promise<UserOrderSummaryDto[]>;
  } = {}
) {
  const app = fastify({ logger: false });
  registerErrorHandler(app);
  await app.register(requestIdPlugin);
  await app.register(jwt, { secret: "test-secret" });
  await app.register(authPlugin);
  await app.register(ordersRoutes, {
    prefix: "/orders",
    createOrderService: {
      createOrder:
        overrides.createOrder ??
        (async () => ({
          response: orderResponse,
          httpStatus: 201,
          replayed: false
        }))
    },
    getOrderStatusService: {
      getOrderStatus:
        overrides.getOrderStatus ?? (async () => statusResponse)
    },
    listUserOrdersService: {
      getUserOrders:
        overrides.getUserOrders ?? (async () => userOrdersResponse)
    }
  });

  return app;
}

describe("OrdersController", () => {
  it("returns 201 for confirmed order creation", async () => {
    const app = await buildOrdersTestApp();
    const token = app.jwt.sign(user);

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      headers: {
        authorization: `Bearer ${token}`,
        "idempotency-key": "checkout-key-1"
      },
      payload: {
        items: [
          {
            productId: "0d55fcf5-74e9-45df-8f3b-94d2a9eb6bc8",
            quantity: 1
          }
        ]
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      success: true,
      message: "Order confirmed successfully.",
      data: orderResponse
    });
  });

  it("returns validation errors before order creation", async () => {
    const app = await buildOrdersTestApp();
    const token = app.jwt.sign(user);

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      headers: {
        authorization: `Bearer ${token}`,
        "idempotency-key": "checkout-key-1"
      },
      payload: { items: [] }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      success: false,
      error: { code: APP_ERROR_CODES.VALIDATION_ERROR }
    });
  });

  it("returns IDEMPOTENCY_KEY_REQUIRED when the service rejects a missing key", async () => {
    const app = await buildOrdersTestApp({
      createOrder: async () => {
        throw new AppError({
          code: APP_ERROR_CODES.IDEMPOTENCY_KEY_REQUIRED,
          message: "Idempotency-Key header is required.",
          statusCode: 400
        });
      }
    });
    const token = app.jwt.sign(user);

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        items: [
          {
            productId: "0d55fcf5-74e9-45df-8f3b-94d2a9eb6bc8",
            quantity: 1
          }
        ]
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      success: false,
      message: "Idempotency-Key header is required.",
      error: { code: APP_ERROR_CODES.IDEMPOTENCY_KEY_REQUIRED }
    });
  });

  it("returns order status in the standard envelope", async () => {
    const app = await buildOrdersTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/orders/9f434c19-cd5c-41d8-9d1a-a51f564d75d2"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      message: "Order status loaded successfully.",
      data: statusResponse
    });
  });

  it("returns authenticated user order list in the standard envelope", async () => {
    const app = await buildOrdersTestApp();
    const token = app.jwt.sign(user);

    const response = await app.inject({
      method: "GET",
      url: "/orders",
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      message: "Orders loaded successfully.",
      data: userOrdersResponse
    });
  });
});
