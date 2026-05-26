import type { OrderStatus } from "./order-status";

export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  items: CreateOrderItem[];
}

export interface CreateOrderResponseItem {
  productId: string;
  name: string;
  model: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface CreateOrderResponse {
  orderId: string;
  status: OrderStatus;
  totalCents: number;
  items: CreateOrderResponseItem[];
  createdAt: string;
}

export interface OrderStatusResponseDto {
  orderId: string;
  status: OrderStatus;
  statusMessage: string;
  createdAt: string;
  updatedAt: string;
}
