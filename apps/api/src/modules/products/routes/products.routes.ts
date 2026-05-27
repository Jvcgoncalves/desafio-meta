import type { FastifyInstance } from "fastify";

import {
  ProductsController,
  type ProductsServicePort
} from "../controllers/products.controller.js";
import { ProductRepository } from "../models/product.repository.js";
import { ProductsService } from "../services/products.service.js";

export interface ProductsRoutesOptions {
  productsService?: ProductsServicePort;
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

export async function productsRoutes(
  app: FastifyInstance,
  options: ProductsRoutesOptions = {}
): Promise<void> {
  const productsService =
    options.productsService ??
    new ProductsService(new ProductRepository(app.prisma));
  const productsController = new ProductsController(productsService);

  app.get(
    "/",
    {
      schema: {
        tags: ["Products"],
        summary: "List products",
        description: "Returns the storefront product catalog with stock and pricing.",
        operationId: "listProducts",
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
                  required: ["id", "name", "model", "availableStock", "priceCents"],
                  properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    model: { type: "string" },
                    availableStock: { type: "integer", minimum: 0 },
                    priceCents: { type: "integer", minimum: 0 }
                  },
                  additionalProperties: false
                }
              },
              traceId: { type: "string" }
            },
            additionalProperties: false
          }
        }
      }
    },
    productsController.list
  );

  app.get(
    "/:productId",
    {
      schema: {
        tags: ["Products"],
        summary: "Get product details",
        description: "Returns details for a single product.",
        operationId: "getProductById",
        params: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: { type: "string", format: "uuid" }
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
                required: ["id", "name", "model", "availableStock", "priceCents"],
                properties: {
                  id: { type: "string", format: "uuid" },
                  name: { type: "string" },
                  model: { type: "string" },
                  availableStock: { type: "integer", minimum: 0 },
                  priceCents: { type: "integer", minimum: 0 }
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
    productsController.detail
  );
}
