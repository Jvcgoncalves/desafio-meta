import { APP_ERROR_CODES } from "@casecellshop/shared";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Spinner } from "../../../components/ui/Spinner";
import { HttpClientError } from "../../../services/http-client";
import { isKnownErrorCode, mapErrorCode } from "../../../services/error-mapper";
import { useUserOrders } from "../hooks/useUserOrders";
import { StatusBadge } from "./StatusBadge";

interface UserOrdersListProps {
  token: string;
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function getKnownError(error: unknown) {
  if (
    error instanceof HttpClientError &&
    isKnownErrorCode(error.response.error.code)
  ) {
    return error.response.error.code;
  }

  return null;
}

export function UserOrdersList({ token }: UserOrdersListProps) {
  const { orders, refresh } = useUserOrders(token);
  const orderItems = orders.data ?? [];
  const errorCode = orders.status === "error" ? getKnownError(orders.error) : null;
  const isAuthError = errorCode === APP_ERROR_CODES.AUTH_REQUIRED;

  return (
    <Card className="grid gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid gap-1">
          <h2 className="text-xl font-semibold">Meus pedidos</h2>
          <p className="text-base text-muted">
            Clique em um pedido para acompanhar o status detalhado.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          isLoading={orders.status === "loading"}
          onClick={() => void refresh().catch(() => undefined)}
        >
          Atualizar pedidos
        </Button>
      </div>

      {orders.status === "loading" && orderItems.length === 0 ? (
        <div className="flex min-h-20 items-center justify-center rounded-app border border-border-base bg-surface">
          <Spinner />
        </div>
      ) : null}

      {orders.status === "error" ? (
        <div
          className={`grid gap-2 rounded-app border p-3 text-base ${
            isAuthError
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <p className="font-semibold">
            {errorCode ? mapErrorCode(errorCode) : "Nao foi possivel carregar seus pedidos."}
          </p>
          <p>
            {isAuthError
              ? "Sua sessao expirou. Entre novamente para ver seus pedidos."
              : "Tente novamente em instantes."}
          </p>
        </div>
      ) : null}

      {orders.status !== "error" && orderItems.length === 0 ? (
        <p className="rounded-app border border-border-base bg-surface px-3 py-2 text-base text-muted">
          Voce ainda nao possui pedidos.
        </p>
      ) : null}

      {orderItems.length > 0 ? (
        <ul className="grid gap-2">
          {orderItems.map((order) => (
            <li key={order.orderId}>
              <Link
                to={`/pedidos/${order.orderId}`}
                className="grid gap-2 rounded-app border border-border-base bg-surface px-3 py-3 transition hover:border-primary"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="break-all font-semibold">Pedido {order.orderId}</p>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-base text-muted">
                  <span>Total: {currency.format(order.totalCents / 100)}</span>
                  <span>Criado em: {formatDate(order.createdAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
