import { useCallback, useEffect } from "react";

import { useAsync } from "../../../hooks/useAsync";
import { listProducts } from "../../../services/products.service";

export function useProducts() {
  const { state, run } = useAsync<Awaited<ReturnType<typeof listProducts>>>();

  const refresh = useCallback(() => run(listProducts), [run]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return {
    products: state,
    refresh
  };
}
