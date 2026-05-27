import { APP_ERROR_CODES } from "@casecellshop/shared";
import { hash } from "bcryptjs";
import { describe, expect, it } from "vitest";

import { AuthService } from "../../../src/modules/auth/services/auth.service.js";

describe("AuthService", () => {
  it("verifies password and returns token with user data", async () => {
    const passwordHash = await hash("demo123", 4);
    const service = new AuthService(
      {
        findUserByEmail: async () => ({
          id: "2ff1fe3d-29c3-4835-a6f8-fcfa8db8d60e",
          email: "demo@casecellshop.local",
          passwordHash
        })
      },
      { sign: async () => "signed-token" }
    );

    const result = await service.login({
      email: "demo@casecellshop.local",
      password: "demo123"
    });

    expect(result).toEqual({
      accessToken: "signed-token",
      user: {
        id: "2ff1fe3d-29c3-4835-a6f8-fcfa8db8d60e",
        email: "demo@casecellshop.local"
      }
    });
  });

  it("throws INVALID_CREDENTIALS for missing users", async () => {
    const service = new AuthService(
      { findUserByEmail: async () => null },
      { sign: async () => "unused" }
    );

    await expect(
      service.login({
        email: "demo@casecellshop.local",
        password: "demo123"
      })
    ).rejects.toMatchObject({
      code: APP_ERROR_CODES.INVALID_CREDENTIALS,
      statusCode: 401
    });
  });

  it("throws INVALID_CREDENTIALS for wrong passwords", async () => {
    const passwordHash = await hash("demo123", 4);
    const service = new AuthService(
      {
        findUserByEmail: async () => ({
          id: "2ff1fe3d-29c3-4835-a6f8-fcfa8db8d60e",
          email: "demo@casecellshop.local",
          passwordHash
        })
      },
      { sign: async () => "unused" }
    );

    await expect(
      service.login({
        email: "demo@casecellshop.local",
        password: "wrong"
      })
    ).rejects.toMatchObject({
      code: APP_ERROR_CODES.INVALID_CREDENTIALS,
      statusCode: 401
    });
  });
});
