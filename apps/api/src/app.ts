import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastify, {
  type FastifyInstance
} from "fastify";
import type pino from "pino";

import { registerErrorHandler } from "./common/errors/error-handler.js";
import { createLoggerOptions } from "./common/logging/logger.js";
import { authPlugin } from "./common/plugins/auth.plugin.js";
import { loggerPlugin } from "./common/plugins/logger.plugin.js";
import { prismaPlugin } from "./common/plugins/prisma.plugin.js";
import { requestIdPlugin } from "./common/plugins/request-id.plugin.js";
import { authRoutes } from "./modules/auth/routes/auth.routes.js";
import { ordersRoutes } from "./modules/orders/routes/orders.routes.js";
import { productsRoutes } from "./modules/products/routes/products.routes.js";

export interface BuildAppDependencies {
  logger?: boolean | pino.LoggerOptions;
  skipPrisma?: boolean;
}

export async function buildApp(
  dependencies: BuildAppDependencies = {}
): Promise<FastifyInstance> {
  const logger = dependencies.logger ?? createLoggerOptions();
  const app = fastify({ logger }) as FastifyInstance;

  registerErrorHandler(app);

  await app.register(requestIdPlugin);
  await app.register(loggerPlugin);
  await app.register(cors, { origin: true });
  await app.register(swagger, {
    openapi: {
      info: {
        title: "CaseCellShop API",
        version: "0.1.0"
      }
    }
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });
  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "local-development-secret"
  });
  await app.register(authPlugin);

  if (!dependencies.skipPrisma) {
    await app.register(prismaPlugin);
  }

  app.get("/health", async () => ({
    success: true,
    message: "API is healthy.",
    data: { status: "ok" }
  }));

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(productsRoutes, { prefix: "/products" });
  await app.register(ordersRoutes, { prefix: "/orders" });

  return app;
}
