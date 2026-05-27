import fp from "fastify-plugin";

export const loggerPlugin = fp(async (app) => {
  app.addHook("onRequest", async (request) => {
    request.log.info(
      {
        traceId: request.requestId,
        method: request.method,
        url: request.url
      },
      "request received"
    );
  });

  app.addHook("onResponse", async (request, reply) => {
    request.log.info(
      {
        traceId: request.requestId,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode
      },
      "request completed"
    );
  });
});
