import { defineConfig } from "vitest/config";
import { TEST_USER } from "./tests/helpers/integration.js";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    exclude: ["dist/**", "node_modules/**"],
    env: {
      TEST_DATABASE_URL: "postgresql://casecellshop:casecellshop@localhost:5432/casecellshop?schema=public",
      RUN_TEST_MIGRATIONS: "1",
    }
  }
});
