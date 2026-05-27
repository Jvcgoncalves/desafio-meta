import {
  APP_ERROR_CODES,
  type ApiErrorResponse,
  type AppErrorCode
} from "@casecellshop/shared";
import type { FastifyError, FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { AppError } from "./app-error.js";

interface ValidationErrorDetails {
  issues: Array<{
    path: string;
    message: string;
  }>;
}

function getTraceId(requestId: unknown): string {
  return typeof requestId === "string" && requestId.length > 0
    ? requestId
    : "unknown";
}

function validationEnvelope(
  error: ZodError,
  traceId: string
): ApiErrorResponse<ValidationErrorDetails> {
  return {
    success: false,
    message: "Request validation failed.",
    error: {
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      details: {
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      }
    },
    traceId
  };
}

function appErrorEnvelope<TDetails>(
  error: AppError<TDetails>,
  traceId: string
): ApiErrorResponse<TDetails> {
  return {
    success: false,
    message: error.message,
    error: {
      code: error.code,
      ...(error.details === undefined ? {} : { details: error.details })
    },
    traceId
  };
}

function internalErrorEnvelope(
  traceId: string
): ApiErrorResponse<{ code: AppErrorCode }> {
  return {
    success: false,
    message: "Unexpected internal error.",
    error: {
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      details: { code: APP_ERROR_CODES.INTERNAL_ERROR }
    },
    traceId
  };
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    const traceId = getTraceId(request.requestId ?? request.id);

    if (error instanceof AppError) {
      reply.status(error.statusCode).send(appErrorEnvelope(error, traceId));
      return;
    }

    if (error instanceof ZodError) {
      reply.status(400).send(validationEnvelope(error, traceId));
      return;
    }

    if ("validation" in error && error.validation) {
      const envelope: ApiErrorResponse = {
        success: false,
        message: "Request validation failed.",
        error: {
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          details: error.validation
        },
        traceId
      };
      reply.status(400).send(envelope);
      return;
    }

    request.log.error({ error, traceId }, "Unhandled API error");
    reply.status(500).send(internalErrorEnvelope(traceId));
  });
}
