import type { Prisma, PrismaClient } from "@prisma/client";

import type { ProductRecord } from "./product.types.js";

type PrismaTransaction = Prisma.TransactionClient;

function toProductRecord(product: ProductRecord): ProductRecord {
  return {
    id: product.id,
    name: product.name,
    model: product.model,
    availableStock: product.availableStock,
    priceCents: product.priceCents
  };
}

export class ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<ProductRecord[]> {
    const products = await this.prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        model: true,
        availableStock: true,
        priceCents: true
      }
    });

    return products.map(toProductRecord);
  }

  async findById(productId: string): Promise<ProductRecord | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        model: true,
        availableStock: true,
        priceCents: true
      }
    });

    return product ? toProductRecord(product) : null;
  }

  async getAvailableStock(productId: string): Promise<number | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { availableStock: true }
    });

    return product?.availableStock ?? null;
  }

  async reserveStock(
    productId: string,
    quantity: number,
    transaction: PrismaTransaction
  ): Promise<ProductRecord | null> {
    const result = await transaction.product.updateMany({
      where: {
        id: productId,
        availableStock: {
          gte: quantity
        }
      },
      data: {
        availableStock: {
          decrement: quantity
        },
        reservedStock: {
          increment: quantity
        }
      }
    });

    if (result.count !== 1) {
      return null;
    }

    const product = await transaction.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        model: true,
        availableStock: true,
        priceCents: true
      }
    });

    return product ? toProductRecord(product) : null;
  }

  async releaseReservedStock(
    productId: string,
    quantity: number,
    transaction: PrismaTransaction
  ): Promise<void> {
    await transaction.product.update({
      where: { id: productId },
      data: {
        availableStock: {
          increment: quantity
        },
        reservedStock: {
          decrement: quantity
        }
      }
    });
  }

  async consumeReservedStock(
    productId: string,
    quantity: number,
    transaction: PrismaTransaction
  ): Promise<void> {
    await transaction.product.update({
      where: { id: productId },
      data: {
        reservedStock: {
          decrement: quantity
        }
      }
    });
  }
}
