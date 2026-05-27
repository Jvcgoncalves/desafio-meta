import type { ProductListItemDto } from "@casecellshop/shared";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../hooks/useToast";
import {
  QuantitySelector,
  validateQuantity
} from "../../checkout/components/QuantitySelector";
import { useCartContext } from "../../cart/context/CartContext";

interface ProductCardProps {
  product: ProductListItemDto;
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem } = useCartContext();
  const { showToast } = useToast();
  const cartItem = useMemo(
    () => items.find((item) => item.productId === product.id),
    [items, product.id]
  );
  const [quantity, setQuantity] = useState(cartItem?.quantity ?? 1);
  const [isSumDialogOpen, setIsSumDialogOpen] = useState(false);

  useEffect(() => {
    if (cartItem) {
      setQuantity(cartItem.quantity);
    }
  }, [cartItem]);

  const hasStock = product.availableStock > 0;
  const validationMessage = validateQuantity(quantity);

  const applyAddToCart = (targetQuantity: number, successMessage: string) => {
    const result = addItem(product, targetQuantity);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    showToast(`${successMessage} Total no carrinho: ${result.totalQuantity}.`, "success");
  };

  const handleAddToCart = () => {
    if (!hasStock) {
      showToast("Estoque indisponivel para este item.", "error");
      return;
    }

    if (validationMessage) {
      showToast(validationMessage, "error");
      return;
    }

    if (!cartItem) {
      applyAddToCart(quantity, "Item adicionado ao carrinho.");
      return;
    }

    setIsSumDialogOpen(true);
  };

  const handleConfirmSum = () => {
    if (!cartItem) {
      setIsSumDialogOpen(false);
      return;
    }

    applyAddToCart(
      cartItem.quantity + quantity,
      "Quantidade somada ao item no carrinho."
    );
    setIsSumDialogOpen(false);
  };

  return (
    <Card className="grid min-h-[360px] content-between gap-5 p-5">
      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold leading-tight">
              {product.name}
            </h2>
            <p className="text-base text-muted">{product.model}</p>
          </div>
          <Badge tone={hasStock ? "success" : "danger"}>
            {hasStock ? `${product.availableStock} em estoque` : "Esgotado"}
          </Badge>
        </div>
        <p className="text-2xl font-bold">
          {currency.format(product.priceCents / 100)}
        </p>
      </div>
      <div className="grid gap-3 border-t border-border-base pt-4">
        <QuantitySelector
          max={Math.max(product.availableStock, 1)}
          value={quantity}
          onChange={(nextQuantity) => setQuantity(nextQuantity)}
        />
        <Button
          type="button"
          disabled={!hasStock || Boolean(validationMessage)}
          onClick={handleAddToCart}
        >
          Adicionar ao carrinho
        </Button>
        {!hasStock ? (
          <p className="text-base text-muted">Estoque indisponivel.</p>
        ) : null}
      </div>
      <ConfirmDialog
        isOpen={isSumDialogOpen}
        title="Item ja existe no carrinho"
        description={`Deseja somar ${quantity} unidade(s) de ${product.name} ao que ja esta no carrinho?`}
        confirmLabel="Somar quantidade"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmSum}
        onCancel={() => setIsSumDialogOpen(false)}
      />
    </Card>
  );
}
