import { Button } from "../../../components/ui/Button";
import {
  QuantitySelector,
  validateQuantity
} from "../../checkout/components/QuantitySelector";
import type { CartItem as CartItemType } from "../types";

interface CartItemProps {
  item: CartItemType;
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export function CartItem({ item, onRemove, onUpdateQuantity }: CartItemProps) {
  const validationMessage = validateQuantity(item.quantity);
  console.log({item})

  return (
    <article className="grid gap-3 w-full h-[250px] rounded-app border bg-gray-200 shadow-lg border-border-base p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="text-base text-muted">{item.model}</p>
          <p className="text-xs text-muted">{item.availableStock} em estoque</p>
        </div>
        <p className="shrink-0 text-lg font-bold">
          {currency.format((item.priceCents * item.quantity) / 100)}
        </p>
      </div>

      <QuantitySelector
        value={item.quantity}
        max={Math.max(item.availableStock, 1)}
        onChange={(quantity) => onUpdateQuantity(item.productId, quantity)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 text-base text-green-700">
          Unitario: {currency.format(item.priceCents / 100)}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={() => onRemove(item.productId)}
        >
          Remover
        </Button>
      </div>

      {validationMessage ? (
        <p className="text-xs text-danger">{validationMessage}</p>
      ) : null}
    </article>
  );
}
