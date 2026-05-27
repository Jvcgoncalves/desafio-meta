import { useMemo } from "react";

import { useAuth } from "./features/auth/hooks/useAuth";
import { LoginRoute } from "./routes/login.route";
import { OrderStatusRoute } from "./routes/order-status.route";
import { ProductsRoute } from "./routes/products.route";

function useRoute() {
  return useMemo(() => {
    const path = window.location.pathname;
    const orderMatch = path.match(/^\/orders\/([^/]+)$/);

    if (path === "/login") {
      return { name: "login" as const };
    }

    if (orderMatch?.[1]) {
      return { name: "order-status" as const, orderId: orderMatch[1] };
    }

    return { name: "products" as const };
  }, []);
}

export function App() {
  const auth = useAuth();
  const route = useRoute();

  return (
    <main className="min-h-screen">
      {route.name === "login" ? <LoginRoute auth={auth} /> : null}
      {route.name === "order-status" ? (
        <OrderStatusRoute orderId={route.orderId} />
      ) : null}
      {route.name === "products" ? <ProductsRoute auth={auth} /> : null}
    </main>
  );
}
