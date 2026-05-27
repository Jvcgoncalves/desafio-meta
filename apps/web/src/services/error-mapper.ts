import { APP_ERROR_CODES, type AppErrorCode } from "@casecellshop/shared";

const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  [APP_ERROR_CODES.VALIDATION_ERROR]:
    "Confira a quantidade selecionada e tente novamente.",
  [APP_ERROR_CODES.AUTH_REQUIRED]: "Entre antes de finalizar o pedido.",
  [APP_ERROR_CODES.INVALID_CREDENTIALS]:
    "E-mail ou senha incorretos.",
  [APP_ERROR_CODES.PRODUCT_NOT_FOUND]: "Este produto nao esta mais disponivel.",
  [APP_ERROR_CODES.ORDER_NOT_FOUND]: "Pedido nao encontrado.",
  [APP_ERROR_CODES.IDEMPOTENCY_KEY_REQUIRED]:
    "Nao foi possivel identificar a tentativa de checkout. Inicie uma nova tentativa.",
  [APP_ERROR_CODES.DUPLICATE_ORDER_CONFLICT]:
    "Esta tentativa foi reutilizada com dados diferentes. Inicie uma nova tentativa.",
  [APP_ERROR_CODES.STOCK_INSUFFICIENT]:
    "Nao ha estoque suficiente para essa quantidade.",
  [APP_ERROR_CODES.ERP_TEMPORARY_FAILURE]:
    "O processamento esta temporariamente indisponivel. Tente novamente ou consulte o status do pedido.",
  [APP_ERROR_CODES.INTERNAL_ERROR]:
    "Ocorreu um erro inesperado. Tente novamente em instantes."
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
