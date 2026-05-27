import { APP_ERROR_CODES } from "@casecellshop/shared";
import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  configureTestDatabase,
  createIntegrationApp,
  createIntegrationPrisma,
  loginAsDemoUser,
  resetDatabase,
  runMigrations,
  TEST_PRODUCTS
} from "../helpers/integration.js";

const databaseUrl = configureTestDatabase();

const FIRST_PRODUCT = TEST_PRODUCTS[0]!;

function orderPayload(quantity = 1, productId = FIRST_PRODUCT.id) {
  return {
    items: [
      {
        productId,
        quantity
      }
    ]
  };
}

async function postOrder(
  app: FastifyInstance,
  token: string,
  idempotencyKey: string,
  options: {
    quantity?: number;
    productId?: string;
    erpOutcome?: string;
  } = {}
) {
  return app.inject({
    method: "POST",
    url: "/orders",
    headers: {
      authorization: `Bearer ${token}`,
      "idempotency-key": idempotencyKey,
      ...(options.erpOutcome === undefined
        ? {}
        : { "x-erp-test-outcome": options.erpOutcome })
    },
    payload: orderPayload(options.quantity ?? 1, options.productId)
  });
}

describe.skipIf(!databaseUrl)("orders integration", () => {
  let prisma: PrismaClient;
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    if (process.env.RUN_TEST_MIGRATIONS === "1") {
      runMigrations(databaseUrl as string);
    }
    prisma = await createIntegrationPrisma();
    app = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    token = await loginAsDemoUser(app);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("creates a confirmed order, persists items, and consumes reserved stock", async () => {
    const response = await postOrder(app, token, "confirmed-key", {
      erpOutcome: "confirmed"
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        status: "CONFIRMED",
        totalCents: FIRST_PRODUCT.priceCents
      }
    });

    const orderId = response.json().data.orderId as string;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    const product = await prisma.product.findUnique({
      where: { id: FIRST_PRODUCT.id }
    });

    expect(order?.items).toHaveLength(1);
    expect(order?.items[0]).toMatchObject({
      productId: FIRST_PRODUCT.id,
      quantity: 1,
      unitPriceCents: FIRST_PRODUCT.priceCents,
      lineTotalCents: FIRST_PRODUCT.priceCents
    });
    expect(product).toMatchObject({
      availableStock: FIRST_PRODUCT.availableStock - 1,
      reservedStock: 0
    });
  });

  it("replays the same idempotency key and payload without creating a duplicate order", async () => {
    const first = await postOrder(app, token, "same-payload-key");
    const second = await postOrder(app, token, "same-payload-key");

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
    expect(second.json().data.orderId).toBe(first.json().data.orderId);

    const orderCount = await prisma.order.count();
    expect(orderCount).toBe(1);
  });

  it("rejects idempotency key reuse with different payload data", async () => {
    const first = await postOrder(app, token, "different-payload-key");
    const second = await postOrder(app, token, "different-payload-key", {
      quantity: 2
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(409);
    expect(second.json()).toMatchObject({
      success: false,
      error: { code: APP_ERROR_CODES.DUPLICATE_ORDER_CONFLICT }
    });
  });

  it("allows only one concurrent checkout to reserve the last available unit", async () => {
    await prisma.product.update({
      where: { id: FIRST_PRODUCT.id },
      data: { availableStock: 1, reservedStock: 0 }
    });

    const responses = await Promise.all([
      postOrder(app, token, "concurrent-key-1", {
        erpOutcome: "delayed"
      }),
      postOrder(app, token, "concurrent-key-2", {
        erpOutcome: "delayed"
      })
    ]);
    const statusCodes = responses.map((response) => response.statusCode).sort();

    expect(statusCodes).toEqual([202, 422]);
    expect(
      responses.filter(
        (response) =>
          response.json().error?.code === APP_ERROR_CODES.STOCK_INSUFFICIENT
      )
    ).toHaveLength(1);
  });

  it("returns pending status for delayed ERP processing", async () => {
    const response = await postOrder(app, token, "delayed-key", {
      erpOutcome: "delayed"
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        status: "PENDING_ERP"
      }
    });
  });

  it("returns ERP_TEMPORARY_FAILURE before accepting unavailable checkout processing", async () => {
    const response = await postOrder(app, token, "temporary-failure-key", {
      erpOutcome: "temporary_failure"
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      success: false,
      error: { code: APP_ERROR_CODES.ERP_TEMPORARY_FAILURE }
    });
    expect(await prisma.order.count()).toBe(0);
  });
});
