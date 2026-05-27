import { useCallback, useEffect } from "react";

import { useAsync } from "../../../hooks/useAsync";
import { listMyOrders } from "../../../services/orders.service";

export function useUserOrders(token: string | null) {
  const { state, run, reset } = useAsync<Awaited<ReturnType<typeof listMyOrders>>>();

  const refresh = useCallback(() => {
    if (!token) {
      return Promise.resolve([]);
    }

    return run(() => listMyOrders(token));
  }, [run, token]);

  useEffect(() => {
    if (!token) {
      reset();
      return;
    }

    void refresh().catch(() => undefined);
  }, [refresh, reset, token]);

  return {
    orders: state,
    refresh
  };
}
