import { describe, expect, it } from "vitest";

import { createOrderRequestSchema } from "../src/orders/order.schemas";

describe("createOrderRequestSchema", () => {
  const validProductId = "3d2c62a8-3d4f-4669-82bf-73f04a8937c6";

  it("rejects invalid quantities", () => {
    const result = createOrderRequestSchema.safeParse({
      items: [{ productId: validProductId, quantity: 0 }]
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty item arrays", () => {
    const result = createOrderRequestSchema.safeParse({ items: [] });

    expect(result.success).toBe(false);
  });

  it("rejects invalid product UUIDs", () => {
    const result = createOrderRequestSchema.safeParse({
      items: [{ productId: "not-a-uuid", quantity: 1 }]
    });

    expect(result.success).toBe(false);
  });
});
