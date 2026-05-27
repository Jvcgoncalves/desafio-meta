import {
  APP_ERROR_CODES,
  type CreateOrderResponse
} from "@casecellshop/shared";
import type { FastifyBaseLogger } from "fastify";

import { AppError } from "../../../common/errors/app-error.js";
import type { ErpGatewayPort } from "../../erp/services/fake-erp.service.js";
import type { ProductRecord } from "../../products/models/product.types.js";
import type { PrismaTransaction } from "../models/order.repository.js";
import type {
  CreateOrderServiceInput,
  CreateOrderServiceResult,
  OrderRecord
} from "../models/order.types.js";
import { hashCreateOrderRequest } from "../utils/request-hash.utils.js";

const RESERVATION_TTL_MS = 15 * 60 * 1000;

interface ProductStockRepositoryPort {
  reserveStock: (
    productId: string,
    quantity: number,
    transaction: PrismaTransaction
  ) => Promise<ProductRecord | null>;
  consumeReservedStock: (
    productId: string,
    quantity: number,
    transaction: PrismaTransaction
  ) => Promise<void>;
}

interface OrderRepositoryPort {
  transaction: <T>(
    operation: (transaction: PrismaTransaction) => Promise<T>
  ) => Promise<T>;
  create: (
    input: {
      userId: string;
      status: "PENDING_ERP";
      totalCents: number;
      reservationExpiresAt: Date;
      items: Array<{
        productId: string;
        quantity: number;
        unitPriceCents: number;
        lineTotalCents: number;
      }>;
    },
    transaction: PrismaTransaction
  ) => Promise<OrderRecord>;
  findIdempotentOrderResult: (
    userId: string,
    idempotencyKey: string
  ) => Promise<OrderRecord | null>;
  updateStatus: (
    orderId: string,
    status: "CONFIRMED",
    transaction?: PrismaTransaction,
    erpReference?: string
  ) => Promise<OrderRecord>;
}

interface IdempotencyRepositoryPort {
  findByUserAndKey: (
    userId: string,
    idempotencyKey: string
  ) => Promise<{ requestHash: string } | null>;
  create: (
    input: {
      userId: string;
      idempotencyKey: string;
      requestHash: string;
      orderId: string;
    },
    transaction: PrismaTransaction
  ) => Promise<unknown>;
}

function toCreateOrderResponse(order: OrderRecord): CreateOrderResponse {
  return {
    orderId: order.id,
    status: order.status,
    totalCents: order.totalCents,
    items: order.items,
    createdAt: order.createdAt.toISOString()
  };
}

function aggregateItems(
  items: CreateOrderServiceInput["request"]["items"]
): Array<{ productId: string; quantity: number }> {
  const quantitiesByProduct = new Map<string, number>();

  for (const item of items) {
    quantitiesByProduct.set(
      item.productId,
      (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity
    );
  }

  return [...quantitiesByProduct.entries()].map(([productId, quantity]) => ({
    productId,
    quantity
  }));
}

function httpStatusForOrder(order: OrderRecord): 201 | 202 {
  return order.status === "CONFIRMED" ? 201 : 202;
}

export class CreateOrderService {
  constructor(
    private readonly orderRepository: OrderRepositoryPort,
    private readonly idempotencyRepository: IdempotencyRepositoryPort,
    private readonly productRepository: ProductStockRepositoryPort,
    private readonly erpGateway: ErpGatewayPort,
    private readonly logger: FastifyBaseLogger
  ) {}

  async createOrder(
    input: CreateOrderServiceInput
  ): Promise<CreateOrderServiceResult> {
    const idempotencyKey = input.idempotencyKey.trim();

    this.logger.info(
      {
        traceId: input.traceId,
        userId: input.user.userId,
        idempotencyKey,
        step: "checkout.received"
      },
      "checkout request received"
    );

    if (idempotencyKey.length === 0) {
      throw new AppError({
        code: APP_ERROR_CODES.IDEMPOTENCY_KEY_REQUIRED,
        message: "Idempotency-Key header is required.",
        statusCode: 400
      });
    }

    if (
      input.erpTestOutcome === "temporary_failure" ||
      process.env.FAKE_ERP_OUTCOME === "temporary_failure"
    ) {
      this.logger.info(
        {
          traceId: input.traceId,
          userId: input.user.userId,
          idempotencyKey,
          step: "checkout.erp_processing",
          result: "temporary_failure_before_acceptance"
        },
        "ERP processing unavailable"
      );
      throw new AppError({
        code: APP_ERROR_CODES.ERP_TEMPORARY_FAILURE,
        message: "Checkout processing is temporarily unavailable.",
        statusCode: 503
      });
    }

    const requestHash = hashCreateOrderRequest(input.request);
    const existingIdempotency =
      await this.idempotencyRepository.findByUserAndKey(
        input.user.userId,
        idempotencyKey
      );

    if (existingIdempotency) {
      this.logger.info(
        {
          traceId: input.traceId,
          userId: input.user.userId,
          idempotencyKey,
          step: "checkout.idempotency",
          result:
            existingIdempotency.requestHash === requestHash
              ? "replay"
              : "conflict"
        },
        "checkout idempotency record found"
      );

      if (existingIdempotency.requestHash !== requestHash) {
        throw new AppError({
          code: APP_ERROR_CODES.DUPLICATE_ORDER_CONFLICT,
          message: "Idempotency key was reused with different order data.",
          statusCode: 409
        });
      }

      const existingOrder =
        await this.orderRepository.findIdempotentOrderResult(
          input.user.userId,
          idempotencyKey
        );

      if (!existingOrder) {
        throw new AppError({
          code: APP_ERROR_CODES.INTERNAL_ERROR,
          message: "Existing idempotent order result is unavailable.",
          statusCode: 500
        });
      }

      return {
        response: toCreateOrderResponse(existingOrder),
        httpStatus: httpStatusForOrder(existingOrder),
        replayed: true
      };
    }

    const order = await this.orderRepository.transaction(async (transaction) => {
      const reservedItems = [];

      for (const item of aggregateItems(input.request.items)) {
        const product = await this.productRepository.reserveStock(
          item.productId,
          item.quantity,
          transaction
        );

        if (!product) {
          this.logger.info(
            {
              traceId: input.traceId,
              userId: input.user.userId,
              idempotencyKey,
              productId: item.productId,
              step: "checkout.stock_reservation",
              result: "insufficient"
            },
            "stock reservation failed"
          );
          throw new AppError({
            code: APP_ERROR_CODES.STOCK_INSUFFICIENT,
            message: "Insufficient stock for the requested product.",
            statusCode: 422
          });
        }

        const lineTotalCents = product.priceCents * item.quantity;
        reservedItems.push({
          productId: product.id,
          name: product.name,
          model: product.model,
          quantity: item.quantity,
          unitPriceCents: product.priceCents,
          lineTotalCents
        });
      }

      this.logger.info(
        {
          traceId: input.traceId,
          userId: input.user.userId,
          idempotencyKey,
          step: "checkout.stock_reservation",
          result: "reserved"
        },
        "stock reserved for checkout"
      );

      const persistedOrder = await this.orderRepository.create(
        {
          userId: input.user.userId,
          status: "PENDING_ERP",
          totalCents: reservedItems.reduce(
            (total, item) => total + item.lineTotalCents,
            0
          ),
          reservationExpiresAt: new Date(Date.now() + RESERVATION_TTL_MS),
          items: reservedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents
          }))
        },
        transaction
      );

      await this.idempotencyRepository.create(
        {
          userId: input.user.userId,
          idempotencyKey,
          requestHash,
          orderId: persistedOrder.id
        },
        transaction
      );

      return persistedOrder;
    });

    const erpResult = await this.erpGateway.processOrder({
      orderId: order.id,
      ...(input.erpTestOutcome === undefined
        ? {}
        : { testOutcome: input.erpTestOutcome })
    });

    this.logger.info(
      {
        traceId: input.traceId,
        userId: input.user.userId,
        orderId: order.id,
        idempotencyKey,
        step: "checkout.erp_processing",
        result: erpResult.outcome
      },
      "ERP checkout processing completed"
    );

    if (erpResult.outcome === "confirmed") {
      const confirmedOrder = await this.orderRepository.transaction(
        async (transaction) => {
          for (const item of order.items) {
            await this.productRepository.consumeReservedStock(
              item.productId,
              item.quantity,
              transaction
            );
          }

          return this.orderRepository.updateStatus(
            order.id,
            "CONFIRMED",
            transaction,
            erpResult.erpReference
          );
        }
      );

      this.logger.info(
        {
          traceId: input.traceId,
          userId: input.user.userId,
          orderId: order.id,
          step: "checkout.status_update",
          status: "CONFIRMED"
        },
        "checkout order confirmed"
      );

      return {
        response: toCreateOrderResponse(confirmedOrder),
        httpStatus: 201,
        replayed: false
      };
    }

    return {
      response: toCreateOrderResponse(order),
      httpStatus: 202,
      replayed: false
    };
  }
}
