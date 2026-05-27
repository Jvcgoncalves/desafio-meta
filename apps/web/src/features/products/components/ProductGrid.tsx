import type { ProductListItemDto } from "@casecellshop/shared";

import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: ProductListItemDto[];
  token: string | null;
  onLoginRequested: () => void;
  onRefreshStock: () => void;
}

export function ProductGrid({
  products,
  token,
  onLoginRequested,
  onRefreshStock
}: ProductGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          token={token}
          onLoginRequested={onLoginRequested}
          onRefreshStock={onRefreshStock}
        />
      ))}
    </div>
  );
}
