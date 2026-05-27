import { APP_ERROR_CODES } from "@casecellshop/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { AppError } from "../errors/app-error.js";

export interface AuthenticatedRequestUser {
  id: string;
  email: string;
}

export const authPlugin = fp(async (app) => {
  app.decorate(
    "authenticate",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        throw new AppError({
          code: APP_ERROR_CODES.AUTH_REQUIRED,
          message: "Authentication is required.",
          statusCode: 401
        });
      }
    }
  );
});