import { useCallback, useEffect } from "react";

import { useAsync } from "../../../hooks/useAsync";
import { getOrderStatus } from "../../../services/orders.service";

export function useOrderStatus(orderId: string | null) {
  const { state, run } = useAsync<Awaited<ReturnType<typeof getOrderStatus>>>();

  const refresh = useCallback(() => {
    if (!orderId) {
      return Promise.reject(new Error("Order ID is required."));
    }

    return run(() => getOrderStatus(orderId));
  }, [orderId, run]);

  useEffect(() => {
    if (orderId) {
      void refresh().catch(() => undefined);
    }
  }, [orderId, refresh]);

  return {
    orderStatus: state,
    refresh
  };
}
