import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  configureTestDatabase,
  createIntegrationApp,
  createIntegrationPrisma,
  resetDatabase,
  runMigrations,
  TEST_PRODUCTS
} from "../helpers/integration.js";

const databaseUrl = configureTestDatabase();

describe.skipIf(!databaseUrl)("product integration", () => {
  let prisma: PrismaClient;
  let app: FastifyInstance;

  beforeAll(async () => {
    if (process.env.RUN_TEST_MIGRATIONS === "1") {
      runMigrations(databaseUrl as string);
    }
    prisma = await createIntegrationPrisma();
    app = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("lists products from PostgreSQL", async () => {
    const response = await app.inject({ method: "GET", url: "/products" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      success: true,
      message: "Products loaded successfully."
    });
    expect(response.json().data).toHaveLength(TEST_PRODUCTS.length);
  });

  it("loads product details from PostgreSQL", async () => {
    const product = TEST_PRODUCTS[0]!;
    const response = await app.inject({
      method: "GET",
      url: `/products/${product.id}`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      message: "Product loaded successfully.",
      data: {
        id: product.id,
        name: product.name,
        model: product.model,
        availableStock: product.availableStock,
        priceCents: product.priceCents
      }
    });
  });
});
