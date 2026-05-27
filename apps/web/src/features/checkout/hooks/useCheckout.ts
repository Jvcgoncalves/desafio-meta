import type { CreateOrderResponse } from "@casecellshop/shared";
import { useCallback } from "react";

import { useAsync } from "../../../hooks/useAsync";
import { createOrder } from "../../../services/orders.service";
import { useIdempotencyKey } from "./useIdempotencyKey";

interface CheckoutInput {
  productId: string;
  quantity: number;
  token: string;
}

export function useCheckout() {
  const {
    state: checkout,
    run: runCheckout,
    reset
  } = useAsync<CreateOrderResponse>();
  const idempotency = useIdempotencyKey();

  const submit = useCallback(
    async (input: CheckoutInput) => {
      const idempotencyKey = idempotency.keyForAttempt({
        productId: input.productId,
        quantity: input.quantity
      });

      const result = await runCheckout(() =>
        createOrder({
          request: {
            items: [{ productId: input.productId, quantity: input.quantity }]
          },
          idempotencyKey,
          token: input.token
        })
      );

      if (result.status === "CONFIRMED") {
        idempotency.startNewAttempt();
      }

      return result;
    },
    [idempotency, runCheckout]
  );

  return {
    checkout,
    submit,
    reset,
    startNewAttempt: idempotency.startNewAttempt
  };
}
