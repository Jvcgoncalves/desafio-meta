import { APP_ERROR_CODES, type ProductListItemDto } from "@casecellshop/shared";
import fastify from "fastify";
import { describe, expect, it } from "vitest";

import { AppError } from "../../../src/common/errors/app-error.js";
import { registerErrorHandler } from "../../../src/common/errors/error-handler.js";
import { requestIdPlugin } from "../../../src/common/plugins/request-id.plugin.js";
import { productsRoutes } from "../../../src/modules/products/routes/products.routes.js";

const product: ProductListItemDto = {
  id: "0d55fcf5-74e9-45df-8f3b-94d2a9eb6bc8",
  name: "Clear Armor Case",
  model: "iPhone 15",
  availableStock: 12,
  priceCents: 7990
};

async function buildProductsTestApp(overrides = {}) {
  const app = fastify({ logger: false });
  registerErrorHandler(app);
  await app.register(requestIdPlugin);
  await app.register(productsRoutes, {
    prefix: "/products",
    productsService: {
      listProducts: async () => [product],
      getProduct: async () => product,
      ...overrides
    }
  });
  return app;
}

describe("ProductsController", () => {
  it("returns product list in the standard envelope", async () => {
    const app = await buildProductsTestApp();

    const response = await app.inject({ method: "GET", url: "/products" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      message: "Products loaded successfully.",
      data: [product]
    });
  });

  it("returns product detail in the standard envelope", async () => {
    const app = await buildProductsTestApp();

    const response = await app.inject({
      method: "GET",
      url: `/products/${product.id}`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      message: "Product loaded successfully.",
      data: product
    });
  });

  it("returns PRODUCT_NOT_FOUND for missing detail requests", async () => {
    const app = await buildProductsTestApp({
      getProduct: async () => {
        throw new AppError({
          code: APP_ERROR_CODES.PRODUCT_NOT_FOUND,
          message: "Product not found.",
          statusCode: 404
        });
      }
    });

    const response = await app.inject({
      method: "GET",
      url: "/products/0d55fcf5-74e9-45df-8f3b-94d2a9eb6bc8"
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      success: false,
      message: "Product not found.",
      error: { code: APP_ERROR_CODES.PRODUCT_NOT_FOUND }
    });
  });
});
