import fp from "fastify-plugin";
import { nanoid } from "nanoid";

export const requestIdPlugin = fp(async (app) => {
  app.decorateRequest("requestId", null);

  app.addHook("onRequest", async (request) => {
    const incoming = request.headers["x-request-id"];
    request.requestId =
      typeof incoming === "string" && incoming.length > 0
        ? incoming
        : nanoid();
  });
});
