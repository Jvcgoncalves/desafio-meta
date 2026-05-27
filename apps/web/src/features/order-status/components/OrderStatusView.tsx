import type { OrderStatusResponseDto } from "@casecellshop/shared";

import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "./StatusBadge";

interface OrderStatusViewProps {
  order: OrderStatusResponseDto;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function OrderStatusView({ order }: OrderStatusViewProps) {
  return (
    <Card className="grid gap-5 p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="grid gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Pedido
          </p>
          <h1 className="break-all text-xl font-bold">{order.orderId}</h1>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <p className="rounded-app border border-border-base bg-background px-4 py-3 text-base text-text-base">
        {order.statusMessage}
      </p>
      <dl className="grid gap-4 text-base sm:grid-cols-2">
        <div className="grid gap-1">
          <dt className="font-semibold text-muted">Criado em</dt>
          <dd>{formatDate(order.createdAt)}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-semibold text-muted">Atualizado em</dt>
          <dd>{formatDate(order.updatedAt)}</dd>
        </div>
      </dl>
    </Card>
  );
}
