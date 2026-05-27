import { APP_ERROR_CODES, type OrderStatus } from "@casecellshop/shared";
import { describe, expect, it } from "vitest";

import { GetOrderStatusService } from "../../../src/modules/orders/services/get-order-status.service.js";
import type { OrderRecord } from "../../../src/modules/orders/models/order.types.js";

function orderWithStatus(status: OrderStatus): OrderRecord {
  return {
    id: "9f434c19-cd5c-41d8-9d1a-a51f564d75d2",
    userId: "2ff1fe3d-29c3-4835-a6f8-fcfa8db8d60e",
    status,
    totalCents: 7990,
    reservationExpiresAt: null,
    createdAt: new Date("2026-01-01T10:00:00.000Z"),
    updatedAt: new Date("2026-01-01T10:05:00.000Z"),
    items: []
  };
}

describe("GetOrderStatusService", () => {
  it.each([
    ["PENDING_ERP", "reserved and waiting"],
    ["CONFIRMED", "confirmed successfully"],
    ["FAILED_TEMPORARY", "temporarily unavailable"],
    ["EXPIRED", "no longer active"],
    ["CANCELLED", "no longer active"],
    ["REJECTED_STOCK", "stock was rejected"]
  ] as const)("maps %s to a user-facing message", async (status, text) => {
    const service = new GetOrderStatusService({
      findById: async () => orderWithStatus(status)
    });

    const result = await service.getOrderStatus(
      "9f434c19-cd5c-41d8-9d1a-a51f564d75d2"
    );

    expect(result).toMatchObject({
      orderId: "9f434c19-cd5c-41d8-9d1a-a51f564d75d2",
      status,
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:05:00.000Z"
    });
    expect(result.statusMessage).toContain(text);
  });

  it("throws ORDER_NOT_FOUND for missing orders", async () => {
    const service = new GetOrderStatusService({
      findById: async () => null
    });

    await expect(
      service.getOrderStatus("9f434c19-cd5c-41d8-9d1a-a51f564d75d2")
    ).rejects.toMatchObject({
      code: APP_ERROR_CODES.ORDER_NOT_FOUND,
      statusCode: 404
    });
  });
});
