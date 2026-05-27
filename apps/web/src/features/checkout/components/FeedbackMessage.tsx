import type { AppErrorCode, CreateOrderResponse } from "@casecellshop/shared";
import { APP_ERROR_CODES } from "@casecellshop/shared";

import { Button } from "../../../components/ui/Button";
import { HttpClientError } from "../../../services/http-client";
import { isKnownErrorCode, mapErrorCode } from "../../../services/error-mapper";

interface FeedbackMessageProps {
  result?: CreateOrderResponse | undefined;
  error?: unknown;
  onRefreshStock?: () => void;
  onNewAttempt?: () => void;
}

function getErrorCode(error: unknown): AppErrorCode | null {
  if (
    error instanceof HttpClientError &&
    isKnownErrorCode(error.response.error.code)
  ) {
    return error.response.error.code;
  }

  return null;
}

export function FeedbackMessage({
  result,
  error,
  onRefreshStock,
  onNewAttempt
}: FeedbackMessageProps) {
  if (result) {
    const isConfirmed = result.status === "CONFIRMED";

    return (
      <div
        className={`grid gap-3 rounded-app border px-4 py-3 text-sm ${
          isConfirmed
            ? "border-green-200 bg-green-50 text-green-900"
            : "border-blue-200 bg-blue-50 text-blue-900"
        }`}
      >
        <p className="font-semibold">
          {isConfirmed
            ? "Order confirmed successfully."
            : "Order accepted and pending ERP processing."}
        </p>
        <p>
          Total: {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
          }).format(result.totalCents / 100)}
        </p>
        <a
          className="text-sm font-semibold text-primary underline underline-offset-4"
          href={`/orders/${result.orderId}`}
        >
          View order status
        </a>
      </div>
    );
  }

  if (!error) {
    return null;
  }

  const code = getErrorCode(error);
  const isStockError = code === APP_ERROR_CODES.STOCK_INSUFFICIENT;
  const isConflict = code === APP_ERROR_CODES.DUPLICATE_ORDER_CONFLICT;

  return (
    <div className="grid gap-3 rounded-app border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
      <p className="font-semibold">
        {code ? mapErrorCode(code) : "Checkout failed. Try again in a moment."}
      </p>
      <div className="flex flex-wrap gap-2">
        {isStockError && onRefreshStock ? (
          <Button type="button" variant="secondary" onClick={onRefreshStock}>
            Refresh stock
          </Button>
        ) : null}
        {isConflict && onNewAttempt ? (
          <Button type="button" variant="secondary" onClick={onNewAttempt}>
            New attempt
          </Button>
        ) : null}
      </div>
    </div>
  );
}
