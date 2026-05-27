import type { ProductListItemDto } from "@casecellshop/shared";
import { useState } from "react";

import { Button } from "../../../components/ui/Button";
import { useCheckout } from "../hooks/useCheckout";
import { FeedbackMessage } from "./FeedbackMessage";
import { QuantitySelector, validateQuantity } from "./QuantitySelector";

interface CheckoutPanelProps {
  product: ProductListItemDto;
  token: string | null;
  onLoginRequested: () => void;
  onRefreshStock: () => void;
}

export function CheckoutPanel({
  product,
  token,
  onLoginRequested,
  onRefreshStock
}: CheckoutPanelProps) {
  const [quantity, setQuantity] = useState(1);
  const checkout = useCheckout();
  const validationMessage = validateQuantity(quantity);
  const isOutOfStock = product.availableStock <= 0;

  const handleCheckout = () => {
    if (!token) {
      onLoginRequested();
      return;
    }

    if (validationMessage || isOutOfStock) {
      return;
    }

    void checkout
      .submit({ productId: product.id, quantity, token })
      .catch(() => undefined);
  };

  return (
    <div className="grid gap-3 border-t border-border-base pt-4">
      <QuantitySelector
        max={Math.max(product.availableStock, 1)}
        value={quantity}
        onChange={(nextQuantity) => {
          setQuantity(nextQuantity);
          checkout.startNewAttempt();
        }}
      />
      <Button
        type="button"
        isLoading={checkout.checkout.status === "loading"}
        disabled={Boolean(validationMessage) || isOutOfStock}
        onClick={handleCheckout}
      >
        {token ? "Checkout" : "Log in to checkout"}
      </Button>
      {isOutOfStock ? (
        <p className="text-sm text-muted">Stock is currently unavailable.</p>
      ) : null}
      <FeedbackMessage
        result={
          checkout.checkout.status === "success"
            ? checkout.checkout.data
            : undefined
        }
        error={
          checkout.checkout.status === "error"
            ? checkout.checkout.error
            : undefined
        }
        onRefreshStock={onRefreshStock}
        onNewAttempt={checkout.startNewAttempt}
      />
    </div>
  );
}
