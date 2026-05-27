import type { ProductListItemDto } from "@casecellshop/shared";

import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: ProductListItemDto[];
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
