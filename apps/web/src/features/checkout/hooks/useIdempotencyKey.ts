import { useCallback, useState } from "react";

import {
  createCheckoutFingerprint,
  getOrCreateRetryKey,
  type CheckoutAttempt
} from "../../../utils/idempotency.utils";

export function useIdempotencyKey() {
  const [attempt, setAttempt] = useState<CheckoutAttempt | null>(null);

  const keyForAttempt = useCallback(
    (input: { productId: string; quantity: number }) => {
      const fingerprint = createCheckoutFingerprint(input);
      const nextAttempt = getOrCreateRetryKey(attempt, fingerprint);
      setAttempt(nextAttempt);
      return nextAttempt.key;
    },
    [attempt]
  );

  const startNewAttempt = useCallback(() => setAttempt(null), []);

  return {
    currentKey: attempt?.key ?? null,
    keyForAttempt,
    startNewAttempt
  };
}
