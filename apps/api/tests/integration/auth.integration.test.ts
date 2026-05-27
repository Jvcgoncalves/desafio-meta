import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  configureTestDatabase,
  createIntegrationApp,
  createIntegrationPrisma,
  resetDatabase,
  runMigrations,
  TEST_USER
} from "../helpers/integration.js";

const databaseUrl = configureTestDatabase();

describe.skipIf(!databaseUrl)("auth integration", () => {
  let prisma: PrismaClient;
  let app: FastifyInstance;

  beforeAll(async () => {
    if (process.env.RUN_TEST_MIGRATIONS === "1") {
      runMigrations(databaseUrl as string);
    }
    prisma = await createIntegrationPrisma();
    app = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("logs in with seeded credentials", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: TEST_USER.email,
        password: TEST_USER.password
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      success: true,
      message: "Login completed successfully.",
      data: {
        user: {
          email: TEST_USER.email
        }
      }
    });
    expect(response.json().data.accessToken).toEqual(expect.any(String));
  });
});
