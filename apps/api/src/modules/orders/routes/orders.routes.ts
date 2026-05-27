import { APP_ERROR_CODES } from "@casecellshop/shared";
import type { FastifyInstance } from "fastify";

import { AppError } from "../../../common/errors/app-error.js";

export async function ordersRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/",
    {
      preHandler: async (request, reply) => {
        await app.authenticate(request, reply);
      }
    },
    async () => {
      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Order creation validation is not implemented yet.",
        statusCode: 400
      });
    }
  );
}
