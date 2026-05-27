import { APP_ERROR_CODES, type AppErrorCode } from "@casecellshop/shared";

const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  [APP_ERROR_CODES.VALIDATION_ERROR]:
    "Check the selected quantity and try again.",
  [APP_ERROR_CODES.AUTH_REQUIRED]: "Log in before sending this checkout.",
  [APP_ERROR_CODES.INVALID_CREDENTIALS]:
    "The email or password is incorrect.",
  [APP_ERROR_CODES.PRODUCT_NOT_FOUND]: "This product is no longer available.",
  [APP_ERROR_CODES.ORDER_NOT_FOUND]: "This order could not be found.",
  [APP_ERROR_CODES.IDEMPOTENCY_KEY_REQUIRED]:
    "The checkout attempt could not be identified. Start a new attempt.",
  [APP_ERROR_CODES.DUPLICATE_ORDER_CONFLICT]:
    "This checkout attempt was reused with different data. Start a new attempt.",
  [APP_ERROR_CODES.STOCK_INSUFFICIENT]:
    "There is not enough stock for that quantity.",
  [APP_ERROR_CODES.ERP_TEMPORARY_FAILURE]:
    "Processing is temporarily unavailable. Retry or check the order status.",
  [APP_ERROR_CODES.INTERNAL_ERROR]:
    "Something went wrong. You can retry in a moment."
};

export function mapErrorCode(code: AppErrorCode): string {
  return ERROR_MESSAGES[code];
}

export function isKnownErrorCode(value: unknown): value is AppErrorCode {
  return (
    typeof value === "string" &&
    Object.values(APP_ERROR_CODES).includes(value as AppErrorCode)
  );
}
