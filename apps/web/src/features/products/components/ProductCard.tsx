import type { ProductListItemDto } from "@casecellshop/shared";

import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { CheckoutPanel } from "../../checkout/components/CheckoutPanel";

interface ProductCardProps {
  product: ProductListItemDto;
  token: string | null;
  onLoginRequested: () => void;
  onRefreshStock: () => void;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export function ProductCard({
  product,
  token,
  onLoginRequested,
  onRefreshStock
}: ProductCardProps) {
  const hasStock = product.availableStock > 0;

  return (
    <Card className="grid min-h-[360px] content-between gap-5 p-5">
      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold leading-tight">
              {product.name}
            </h2>
            <p className="text-sm text-muted">{product.model}</p>
          </div>
          <Badge tone={hasStock ? "success" : "danger"}>
            {hasStock ? `${product.availableStock} in stock` : "Out"}
          </Badge>
        </div>
        <p className="text-2xl font-bold">
          {currency.format(product.priceCents / 100)}
        </p>
      </div>
      <CheckoutPanel
        product={product}
        token={token}
        onLoginRequested={onLoginRequested}
        onRefreshStock={onRefreshStock}
      />
    </Card>
  );
}
