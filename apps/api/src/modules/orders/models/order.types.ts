import {
  APP_ERROR_CODES,
  type CreateOrderRequest,
  type CreateOrderResponse,
  type OrderStatus
} from "@casecellshop/shared";

export { APP_ERROR_CODES };
export type { CreateOrderRequest, CreateOrderResponse, OrderStatus };

export interface AuthenticatedOrderContext {
  userId: string;
  email: string;
}

export interface CreateOrderServiceInput {
  user: AuthenticatedOrderContext;
  request: CreateOrderRequest;
  idempotencyKey: string;
  erpTestOutcome?: string;
  traceId: string;
}

export interface OrderItemRecord {
  productId: string;
  name: string;
  model: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface OrderRecord {
  id: string;
  userId: string;
  status: OrderStatus;
  totalCents: number;
  reservationExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemRecord[];
}

export interface CreateOrderServiceResult {
  response: CreateOrderResponse;
  httpStatus: 201 | 202;
  replayed: boolean;
}
