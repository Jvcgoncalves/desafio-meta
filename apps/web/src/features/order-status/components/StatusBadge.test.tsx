import { ORDER_STATUSES } from "@casecellshop/shared";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "./StatusBadge";

const labels = {
  PENDING_ERP: "Pendente no ERP",
  CONFIRMED: "Confirmado",
  FAILED_TEMPORARY: "Falha temporaria",
  EXPIRED: "Expirado",
  REJECTED_STOCK: "Rejeitado por estoque",
  CANCELLED: "Cancelado"
} as const;

describe("StatusBadge", () => {
  it("renders a badge label for every order status", () => {
    for (const status of ORDER_STATUSES) {
      const { unmount } = render(<StatusBadge status={status} />);

      expect(screen.getByText(labels[status])).toBeInTheDocument();

      unmount();
    }
  });
});
