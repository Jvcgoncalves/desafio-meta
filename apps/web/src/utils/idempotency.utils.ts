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

export function createCheckoutFingerprint(
  items: Array<{ productId: string; quantity: number }>
): string {
  const normalized = items
    .map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }))
    .sort(
      (a, b) =>
        a.productId.localeCompare(b.productId) || a.quantity - b.quantity
    );

  return JSON.stringify(normalized);
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
