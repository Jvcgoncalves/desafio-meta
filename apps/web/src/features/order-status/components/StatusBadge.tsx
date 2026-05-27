import type { OrderStatus } from "@casecellshop/shared";

import { Badge } from "../../../components/ui/Badge";

interface StatusBadgeProps {
  status: OrderStatus;
}

const labels: Record<OrderStatus, string> = {
  PENDING_ERP: "Pendente no ERP",
  CONFIRMED: "Confirmado",
  FAILED_TEMPORARY: "Falha temporaria",
  EXPIRED: "Expirado",
  REJECTED_STOCK: "Rejeitado por estoque",
  CANCELLED: "Cancelado"
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
