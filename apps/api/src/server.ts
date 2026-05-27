import { buildApp } from "./app.js";
import { PendingOrdersWorker } from "./common/worker/pending-orders.worker.js";
import { FakeErpService } from "./modules/erp/services/fake-erp.service.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const app = await buildApp();
const worker = PendingOrdersWorker.fromPrisma(
  app.prisma,
  new FakeErpService(),
  app.log,
  Number(process.env.PENDING_ORDERS_WORKER_INTERVAL_MS ?? 10_000)
);

app.addHook("onClose", async () => {
  worker.stop();
});

try {
  await app.listen({ host, port });
  worker.start();
} catch (error) {
  app.log.error({ error }, "API startup failed");
  process.exit(1);
}
