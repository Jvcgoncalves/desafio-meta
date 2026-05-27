import { describe, expect, it, vi } from "vitest";

import {
  createCheckoutFingerprint,
  generateIdempotencyKey,
  getOrCreateRetryKey
} from "./idempotency.utils";

describe("idempotency utils", () => {
  it("generates checkout-prefixed keys", () => {
    const randomUUID = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("00000000-0000-4000-8000-000000000000");

    expect(generateIdempotencyKey()).toBe(
      "checkout-00000000-0000-4000-8000-000000000000"
    );

    randomUUID.mockRestore();
  });

  it("reuses the same key for the same checkout fingerprint", () => {
    const fingerprint = createCheckoutFingerprint({
      productId: "product-1",
      quantity: 2
    });
    const attempt = {
      key: "checkout-existing",
      fingerprint
    };

    expect(getOrCreateRetryKey(attempt, fingerprint)).toBe(attempt);
  });

  it("creates a new key when checkout data changes", () => {
    const previous = {
      key: "checkout-existing",
      fingerprint: createCheckoutFingerprint({
        productId: "product-1",
        quantity: 1
      })
    };
    const next = getOrCreateRetryKey(
      previous,
      createCheckoutFingerprint({
        productId: "product-1",
        quantity: 3
      })
    );

    expect(next.key).not.toBe(previous.key);
    expect(next.fingerprint).not.toBe(previous.fingerprint);
  });
});
