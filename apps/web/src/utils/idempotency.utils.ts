const IDEMPOTENCY_PREFIX = "checkout";

export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${IDEMPOTENCY_PREFIX}-${crypto.randomUUID()}`;
  }

  return `${IDEMPOTENCY_PREFIX}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export interface CheckoutAttempt {
  key: string;
  fingerprint: string;
}

export function createCheckoutFingerprint(input: {
  productId: string;
  quantity: number;
}): string {
  return JSON.stringify({
    productId: input.productId,
    quantity: input.quantity
  });
}

export function getOrCreateRetryKey(
  currentAttempt: CheckoutAttempt | null,
  fingerprint: string
): CheckoutAttempt {
  if (currentAttempt?.fingerprint === fingerprint) {
    return currentAttempt;
  }

  return {
    key: generateIdempotencyKey(),
    fingerprint
  };
}
