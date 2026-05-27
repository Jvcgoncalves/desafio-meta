import { APP_ERROR_CODES, type LoginResponseDto } from "@casecellshop/shared";
import jwt from "@fastify/jwt";
import fastify from "fastify";
import { describe, expect, it } from "vitest";

import { AppError } from "../../../src/common/errors/app-error.js";
import { registerErrorHandler } from "../../../src/common/errors/error-handler.js";
import { authPlugin } from "../../../src/common/plugins/auth.plugin.js";
import { requestIdPlugin } from "../../../src/common/plugins/request-id.plugin.js";
import { ordersRoutes } from "../../../src/modules/orders/routes/orders.routes.js";
import { authRoutes } from "../../../src/modules/auth/routes/auth.routes.js";

const loginResponse: LoginResponseDto = {
  accessToken: "signed-token",
  user: {
    id: "2ff1fe3d-29c3-4835-a6f8-fcfa8db8d60e",
    email: "demo@casecellshop.local"
  }
};

async function buildAuthTestApp(overrides = {}) {
  const app = fastify({ logger: false });
  registerErrorHandler(app);
  await app.register(requestIdPlugin);
  await app.register(jwt, { secret: "test-secret" });
  await app.register(authPlugin);
  await app.register(authRoutes, {
    prefix: "/auth",
    authService: {
      login: async () => loginResponse,
      ...overrides
    }
  });
  return app;
}

describe("AuthController", () => {
  it("returns login success envelope", async () => {
    const app = await buildAuthTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "demo@casecellshop.local",
        password: "demo123"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      message: "Login completed successfully.",
      data: loginResponse
    });
  });

  it("returns INVALID_CREDENTIALS for failed login", async () => {
    const app = await buildAuthTestApp({
      login: async () => {
        throw new AppError({
          code: APP_ERROR_CODES.INVALID_CREDENTIALS,
          message: "Invalid email or password.",
          statusCode: 401
        });
      }
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "demo@casecellshop.local",
        password: "wrong"
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      success: false,
      message: "Invalid email or password.",
      error: { code: APP_ERROR_CODES.INVALID_CREDENTIALS }
    });
  });
});

describe("authPlugin", () => {
  it("returns AUTH_REQUIRED for protected routes without a token", async () => {
    const app = fastify({ logger: false });
    registerErrorHandler(app);
    await app.register(requestIdPlugin);
    await app.register(jwt, { secret: "test-secret" });
    await app.register(authPlugin);
    await app.register(ordersRoutes, { prefix: "/orders" });

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: {}
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      success: false,
      message: "Authentication is required.",
      error: { code: APP_ERROR_CODES.AUTH_REQUIRED }
    });
  });
});
