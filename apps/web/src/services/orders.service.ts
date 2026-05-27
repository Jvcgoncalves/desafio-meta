import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderStatusResponseDto,
  UserOrderSummaryDto
} from "@casecellshop/shared";

import { apiRequest } from "./http-client";

export async function createOrder(input: {
  request: CreateOrderRequest;
  idempotencyKey: string;
  token: string;
}): Promise<CreateOrderResponse> {
  const response = await apiRequest<CreateOrderResponse, CreateOrderRequest>(
    "/orders",
    {
      method: "POST",
      body: input.request,
      token: input.token,
      headers: {
        "Idempotency-Key": input.idempotencyKey
      }
    }
  );
  return response.data;
}

export async function getOrderStatus(
  orderId: string
): Promise<OrderStatusResponseDto> {
  const response =
    await apiRequest<OrderStatusResponseDto>(`/orders/${orderId}`);
  return response.data;
}

export async function listMyOrders(
  token: string
): Promise<UserOrderSummaryDto[]> {
  const response = await apiRequest<UserOrderSummaryDto[]>("/orders", {
    token
  });
  return response.data;
}
