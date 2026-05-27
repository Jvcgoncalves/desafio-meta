import { buildApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const app = await buildApp();

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error({ error }, "API startup failed");
  process.exit(1);
}
