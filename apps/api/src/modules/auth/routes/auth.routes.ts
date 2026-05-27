import type { FastifyInstance } from "fastify";

import {
  AuthController,
  type AuthServicePort
} from "../controllers/auth.controller.js";
import { AuthRepository } from "../models/auth.repository.js";
import { AuthService } from "../services/auth.service.js";

export interface AuthRoutesOptions {
  authService?: AuthServicePort;
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

export async function authRoutes(
  app: FastifyInstance,
  options: AuthRoutesOptions = {}
): Promise<void> {
  const authService =
    options.authService ??
    new AuthService(new AuthRepository(app.prisma), {
      sign: async (payload) => app.jwt.sign(payload)
    });
  const authController = new AuthController(authService);

  app.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Login user",
        description: "Authenticates a user and returns a JWT access token.",
        operationId: "loginUser",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 1 }
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
                required: ["accessToken", "user"],
                properties: {
                  accessToken: { type: "string" },
                  user: {
                    type: "object",
                    required: ["id", "email"],
                    properties: {
                      id: { type: "string", format: "uuid" },
                      email: { type: "string", format: "email" }
                    },
                    additionalProperties: false
                  }
                },
                additionalProperties: false
              },
              traceId: { type: "string" }
            },
            additionalProperties: false
          },
          400: apiErrorResponseSchema,
          401: apiErrorResponseSchema
        }
      }
    },
    authController.login
  );
}
