import { APP_ERROR_CODES, type ApiErrorResponse } from "@casecellshop/shared";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HttpClientError } from "../../../services/http-client";
import { CheckoutPanel } from "./CheckoutPanel";
import { FeedbackMessage } from "./FeedbackMessage";

const product = {
  id: "product-1",
  name: "Clear Shield Case",
  model: "iPhone 15",
  availableStock: 5,
  priceCents: 4990
};

const orderResponse = {
  orderId: "order-1",
  status: "CONFIRMED" as const,
  totalCents: 4990,
  createdAt: "2026-05-26T12:00:00.000Z",
  items: [
    {
      productId: "product-1",
      name: "Clear Shield Case",
      model: "iPhone 15",
      quantity: 1,
      unitPriceCents: 4990,
      lineTotalCents: 4990
    }
  ]
};

function errorResponse(code: ApiErrorResponse["error"]["code"]) {
  return new HttpClientError(
    {
      success: false,
      message: code,
      error: { code },
      traceId: "trace-1"
    },
    400
  );
}

describe("CheckoutPanel snapshots", () => {
  it("matches the loading snapshot", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => new Promise<Response>(() => undefined));

    const { container } = render(
      <CheckoutPanel
        product={product}
        token="token"
        onLoginRequested={() => undefined}
        onRefreshStock={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    await screen.findByRole("button", { name: "Working..." });

    expect(container.firstChild).toMatchSnapshot();

    fetchMock.mockRestore();
  });
});

describe("FeedbackMessage snapshots", () => {
  it("matches confirmed success feedback", () => {
    const { container } = render(<FeedbackMessage result={orderResponse} />);

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches insufficient stock feedback", () => {
    const { container } = render(
      <FeedbackMessage
        error={errorResponse(APP_ERROR_CODES.STOCK_INSUFFICIENT)}
        onRefreshStock={() => undefined}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches pending processing feedback", () => {
    const { container } = render(
      <FeedbackMessage
        result={{ ...orderResponse, status: "PENDING_ERP" as const }}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches temporary failure feedback", () => {
    const { container } = render(
      <FeedbackMessage
        error={errorResponse(APP_ERROR_CODES.ERP_TEMPORARY_FAILURE)}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
