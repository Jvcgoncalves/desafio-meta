import { APP_ERROR_CODES } from "@casecellshop/shared";

import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { OrderStatusView } from "../features/order-status/components/OrderStatusView";
import { useOrderStatus } from "../features/order-status/hooks/useOrderStatus";
import { HttpClientError } from "../services/http-client";
import { isKnownErrorCode, mapErrorCode } from "../services/error-mapper";

interface OrderStatusRouteProps {
  orderId: string | null;
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

export function OrderStatusRoute({ orderId }: OrderStatusRouteProps) {
  const { orderStatus, refresh } = useOrderStatus(orderId);
  const errorCode =
    orderStatus.status === "error" ? getKnownError(orderStatus.error) : null;
  const isNotFound = errorCode === APP_ERROR_CODES.ORDER_NOT_FOUND;

  return (
    <section className="mx-auto grid w-shell max-w-3xl gap-6 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="grid gap-2">
          <h1 className="text-2xl font-bold">Order status</h1>
          <p className="text-sm text-muted">
            Check the latest ERP processing state for an accepted order.
          </p>
        </div>
        <a
          className="text-sm font-semibold text-primary underline underline-offset-4"
          href="/"
        >
          Back to products
        </a>
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
          className={`grid gap-3 rounded-app border p-4 text-sm ${
            isNotFound
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <p className="font-semibold">
            {errorCode
              ? mapErrorCode(errorCode)
              : "Order status could not be loaded."}
          </p>
          <p>
            {isNotFound
              ? "Confirm the order link and try again."
              : "The status view remains available. Retry when the API is reachable."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void refresh().catch(() => undefined)}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
