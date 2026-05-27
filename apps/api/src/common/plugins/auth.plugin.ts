import { APP_ERROR_CODES } from "@casecellshop/shared";
import fp from "fastify-plugin";

import { AppError } from "../errors/app-error.js";

export interface AuthenticatedRequestUser {
  id: string;
  email: string;
}

export const authPlugin = fp(async (app) => {
  app.decorate("authenticate", async (request) => {
    try {
      const payload = await request.jwtVerify<AuthenticatedRequestUser>();
      request.user = payload;
    } catch {
      throw new AppError({
        code: APP_ERROR_CODES.AUTH_REQUIRED,
        message: "Authentication is required.",
        statusCode: 401
      });
    }
  });
});
