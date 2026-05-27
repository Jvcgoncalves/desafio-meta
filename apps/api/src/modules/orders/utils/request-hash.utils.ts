import { createHash } from "node:crypto";

import type { CreateOrderRequest } from "@casecellshop/shared";

interface NormalizedOrderItem {
  productId: string;
  quantity: number;
}

export function normalizeCreateOrderRequest(
  request: CreateOrderRequest
): { items: NormalizedOrderItem[] } {
  const quantitiesByProduct = new Map<string, number>();

  for (const item of request.items) {
    quantitiesByProduct.set(
      item.productId,
      (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity
    );
  }

  return {
    items: [...quantitiesByProduct.entries()]
      .map(([productId, quantity]) => ({ productId, quantity }))
      .sort((left, right) => left.productId.localeCompare(right.productId))
  };
}

export function hashCreateOrderRequest(request: CreateOrderRequest): string {
  return createHash("sha256")
    .update(JSON.stringify(normalizeCreateOrderRequest(request)))
    .digest("hex");
}
