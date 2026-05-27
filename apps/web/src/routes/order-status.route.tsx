import { APP_ERROR_CODES } from "@casecellshop/shared";
import { Link, useParams } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { OrderStatusView } from "../features/order-status/components/OrderStatusView";
import { useOrderStatus } from "../features/order-status/hooks/useOrderStatus";
import { HttpClientError } from "../services/http-client";
import { isKnownErrorCode, mapErrorCode } from "../services/error-mapper";

function getKnownError(error: unknown) {
  if (
    error instanceof HttpClientError &&
    isKnownErrorCode(error.response.error.code)
  ) {
    return error.response.error.code;
  }

  return null;
}

export function OrderStatusRoute() {
  const { orderId = null } = useParams<{ orderId: string }>();
  const { orderStatus, refresh } = useOrderStatus(orderId);
  const errorCode =
    orderStatus.status === "error" ? getKnownError(orderStatus.error) : null;
  const isNotFound = errorCode === APP_ERROR_CODES.ORDER_NOT_FOUND;

  return (
    <section className="mx-auto grid w-shell max-w-3xl gap-6 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold">Status do pedido</h1>
          <p className="text-base text-muted">
            Acompanhe o processamento do seu pedido no ERP.
          </p>
        </div>
        <Link
          className="text-base font-semibold text-primary underline underline-offset-4"
          to="/"
        >
          Voltar aos produtos
        </Link>
      </div>

      {orderStatus.status === "loading" ? (
        <div className="flex min-h-40 items-center justify-center rounded-app border border-border-base bg-surface">
          <Spinner />
        </div>
      ) : null}

      {orderStatus.status === "success" ? (
        <OrderStatusView order={orderStatus.data} />
      ) : null}

      {orderStatus.status === "error" ? (
        <div
          className={`grid gap-3 rounded-app border p-4 text-base ${
            isNotFound
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <p className="font-semibold">
            {errorCode
              ? mapErrorCode(errorCode)
              : "Nao foi possivel carregar o status do pedido."}
          </p>
          <p>
            {isNotFound
              ? "Confirme o link do pedido e tente novamente."
              : "A tela continua disponivel. Tente novamente quando a API estiver acessivel."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void refresh().catch(() => undefined)}
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
