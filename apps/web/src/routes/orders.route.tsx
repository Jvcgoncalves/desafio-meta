import { Navigate } from "react-router-dom";

import type { useAuth } from "../features/auth/hooks/useAuth";
import { UserOrdersList } from "../features/order-status/components/UserOrdersList";

interface OrdersRouteProps {
  auth: ReturnType<typeof useAuth>;
}

export function OrdersRoute({ auth }: OrdersRouteProps) {
  if (!auth.token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="mx-auto grid w-shell gap-6 py-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="max-w-2xl text-base text-muted">
          Acompanhe todos os pedidos da sua conta em um unico lugar.
        </p>
      </div>

      <UserOrdersList token={auth.token} />
    </section>
  );
}
