import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderStatusResponseDto
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
