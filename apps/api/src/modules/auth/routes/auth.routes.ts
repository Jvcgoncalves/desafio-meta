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

  app.post("/login", authController.login);
}
