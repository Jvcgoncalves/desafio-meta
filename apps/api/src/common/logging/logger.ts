import pino from "pino";

export function createLoggerOptions(): pino.LoggerOptions {
  return {
    level: process.env.LOG_LEVEL ?? "info",
    redact: {
      paths: ["req.headers.authorization", "*.password", "*.passwordHash"],
      remove: true
    }
  };
}

export function createLogger() {
  return pino(createLoggerOptions());
}
