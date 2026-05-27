import type {
  ApiSuccessResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderStatusResponseDto
} from "@casecellshop/shared";
import type { FastifyReply, FastifyRequest } from "fastify";

import type { CreateOrderServiceInput } from "../models/order.types.js";

export interface CreateOrderServicePort {
  createOrder: (
    input: CreateOrderServiceInput
  ) => Promise<{
    response: CreateOrderResponse;
    httpStatus: 201 | 202;
    replayed: boolean;
  }>;
}

export interface GetOrderStatusServicePort {
  getOrderStatus: (orderId: string) => Promise<OrderStatusResponseDto>;
}

interface OrderParams {
  orderId: string;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export class OrdersController {
  constructor(
    private readonly createOrderService: CreateOrderServicePort,
    private readonly getOrderStatusService: GetOrderStatusServicePort
  ) {}

  create = async (
    request: FastifyRequest<{ Body: CreateOrderRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    const idempotencyKey = headerValue(request.headers["idempotency-key"]);
    const erpTestOutcome = headerValue(request.headers["x-erp-test-outcome"]);
    const result = await this.createOrderService.createOrder({
      user: {
        userId: request.user.id,
        email: request.user.email
      },
      request: request.body,
      idempotencyKey: idempotencyKey ?? "",
      ...(erpTestOutcome === undefined ? {} : { erpTestOutcome }),
      traceId: request.requestId ?? request.id
    });
    const response: ApiSuccessResponse<CreateOrderResponse> = {
      success: true,
      message:
        result.response.status === "CONFIRMED"
          ? "Order confirmed successfully."
          : "Order accepted and pending ERP processing.",
      data: result.response
    };

    reply.status(result.httpStatus).send(response);
  };

  status = async (
    request: FastifyRequest<{ Params: OrderParams }>,
    reply: FastifyReply
  ): Promise<void> => {
    const status = await this.getOrderStatusService.getOrderStatus(
      request.params.orderId
    );
    const response: ApiSuccessResponse<OrderStatusResponseDto> = {
      success: true,
      message: "Order status loaded successfully.",
      data: status
    };

    reply.status(200).send(response);
  };
}
