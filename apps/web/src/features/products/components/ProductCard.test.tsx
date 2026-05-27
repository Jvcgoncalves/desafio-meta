import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CartProvider } from "../../cart/context/CartContext";
import { ProductCard } from "./ProductCard";

const product = {
  id: "product-1",
  name: "Clear Shield Case",
  model: "iPhone 15",
  availableStock: 8,
  priceCents: 4990
};

describe("ProductCard", () => {
  it("shows add-to-cart action when stock is available", () => {
    render(
      <CartProvider>
        <ProductCard product={product} />
      </CartProvider>
    );

    expect(screen.getByText("Adicionar ao carrinho")).toBeInTheDocument();
    expect(screen.getByText("8 em estoque")).toBeInTheDocument();
  });

  it("shows unavailable stock message when product is out of stock", () => {
    render(
      <CartProvider>
        <ProductCard product={{ ...product, availableStock: 0 }} />
      </CartProvider>
    );

    expect(screen.getByText("Esgotado")).toBeInTheDocument();
    expect(screen.getByText("Estoque indisponivel.")).toBeInTheDocument();
  });
});
