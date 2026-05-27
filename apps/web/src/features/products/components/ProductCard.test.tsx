import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCard } from "./ProductCard";

const product = {
  id: "product-1",
  name: "Clear Shield Case",
  model: "iPhone 15",
  availableStock: 8,
  priceCents: 4990
};

describe("ProductCard", () => {
  it("matches the available-stock snapshot", () => {
    const { container } = render(
      <ProductCard
        product={product}
        token="token"
        onLoginRequested={() => undefined}
        onRefreshStock={() => undefined}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches the zero-stock snapshot", () => {
    const { container } = render(
      <ProductCard
        product={{ ...product, availableStock: 0 }}
        token="token"
        onLoginRequested={() => undefined}
        onRefreshStock={() => undefined}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
