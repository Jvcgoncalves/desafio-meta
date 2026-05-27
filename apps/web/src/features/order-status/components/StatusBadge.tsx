import type { OrderStatus } from "@casecellshop/shared";

import { Badge } from "../../../components/ui/Badge";

interface StatusBadgeProps {
  status: OrderStatus;
}

const labels: Record<OrderStatus, string> = {
  PENDING_ERP: "Pending ERP",
  CONFIRMED: "Confirmed",
  FAILED_TEMPORARY: "Temporary failure",
  EXPIRED: "Expired",
  REJECTED_STOCK: "Rejected stock",
  CANCELLED: "Cancelled"
};

const tones: Record<
  OrderStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  PENDING_ERP: "info",
  CONFIRMED: "success",
  FAILED_TEMPORARY: "warning",
  EXPIRED: "neutral",
  REJECTED_STOCK: "danger",
  CANCELLED: "neutral"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}
