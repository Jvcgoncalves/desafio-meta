import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    exclude: ["dist/**", "node_modules/**"],
    env: {
      TEST_DATABASE_URL: "postgresql://casecellshop:casecellshop@localhost:5432/casecellshop?schema=public", // remove it if want to skip integration tests
      RUN_TEST_MIGRATIONS: "2",
    },
    fileParallelism: false,
  }
});
