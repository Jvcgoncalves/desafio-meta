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

export async function productsRoutes(
  app: FastifyInstance,
  options: ProductsRoutesOptions = {}
): Promise<void> {
  const productsService =
    options.productsService ??
    new ProductsService(new ProductRepository(app.prisma));
  const productsController = new ProductsController(productsService);

  app.get("/", productsController.list);
  app.get("/:productId", productsController.detail);
}
