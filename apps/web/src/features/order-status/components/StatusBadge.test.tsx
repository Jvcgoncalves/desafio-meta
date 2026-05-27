import { ORDER_STATUSES } from "@casecellshop/shared";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "./StatusBadge";

const labels = {
  PENDING_ERP: "Pending ERP",
  CONFIRMED: "Confirmed",
  FAILED_TEMPORARY: "Temporary failure",
  EXPIRED: "Expired",
  REJECTED_STOCK: "Rejected stock",
  CANCELLED: "Cancelled"
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
