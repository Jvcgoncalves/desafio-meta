import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "./order.repository.js";

export interface IdempotencyRecord {
  id: string;
  userId: string;
  idempotencyKey: string;
  requestHash: string;
  orderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class IdempotencyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserAndKey(
    userId: string,
    idempotencyKey: string
  ): Promise<IdempotencyRecord | null> {
    return this.prisma.idempotencyKey.findUnique({
      where: {
        userId_idempotencyKey: {
          userId,
          idempotencyKey
        }
      }
    });
  }

  async create(
    input: {
      userId: string;
      idempotencyKey: string;
      requestHash: string;
      orderId: string;
    },
    transaction: PrismaTransaction
  ): Promise<IdempotencyRecord> {
    return transaction.idempotencyKey.create({
      data: input
    });
  }
}
