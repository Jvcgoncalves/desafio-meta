import type { PrismaClient } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";

import type { AuthenticatedRequestUser } from "../plugins/auth.plugin.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    prisma: PrismaClient;
  }

  interface FastifyRequest {
    requestId: string | null;
    user: AuthenticatedRequestUser;
  }
}
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthenticatedRequestUser;
    user: AuthenticatedRequestUser;
  }
}