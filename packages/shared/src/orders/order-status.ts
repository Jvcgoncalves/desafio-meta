export const ORDER_STATUSES = [
  "PENDING_ERP",
  "CONFIRMED",
  "FAILED_TEMPORARY",
  "EXPIRED",
  "REJECTED_STOCK",
  "CANCELLED"
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
