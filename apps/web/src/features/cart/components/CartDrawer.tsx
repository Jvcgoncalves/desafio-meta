import { APP_ERROR_CODES } from "@casecellshop/shared";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../hooks/useToast";
import { HttpClientError } from "../../../services/http-client";
import { isKnownErrorCode, mapErrorCode } from "../../../services/error-mapper";
import { useCheckout } from "../../checkout/hooks/useCheckout";
import { useCartContext } from "../context/CartContext";
import { CartItem } from "./CartItem";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function getErrorMessage(error: unknown): string {
  if (
    error instanceof HttpClientError &&
    isKnownErrorCode(error.response.error.code)
  ) {
    if (error.response.error.code === APP_ERROR_CODES.AUTH_REQUIRED) {
      return "Entre para finalizar o pedido.";
    }

    return mapErrorCode(error.response.error.code);
  }

  return "Nao foi possivel finalizar o pedido. Tente novamente.";
}

export function CartDrawer({ isOpen, onClose, token }: CartDrawerProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { items, subtotalCents, removeItem, updateQuantity, clearCart } =
    useCartContext();
  const checkout = useCheckout();
  const [inlineError, setInlineError] = useState<string | null>(null);

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      })),
    [items]
  );

  useEffect(() => {
    if (!isOpen) {
      setInlineError(null);
      checkout.reset();
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [checkout, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleCheckout = () => {
    if (checkoutItems.length === 0) {
      return;
    }

    if (!token) {
      showToast("Entre para finalizar o pedido.", "error");
      onClose();
      navigate("/login");
      return;
    }

    setInlineError(null);

    void checkout
      .submit({ items: checkoutItems, token })
      .then((result) => {
        clearCart();
        onClose();
        showToast("Pedido realizado!", "success");
        navigate(`/pedidos/${result.orderId}`);
      })
      .catch((error: unknown) => {
        setInlineError(getErrorMessage(error));
      });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <aside
        aria-label="Carrinho de compras"
        className="flex h-full w-full max-w-xl flex-col gap-5 bg-background p-5 shadow-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border-base pb-4">
          <div className="grid gap-1">
            <h2 className="text-2xl font-bold">Carrinho</h2>
            <p className="text-base text-muted">
              Revise seus itens antes de fechar o pedido.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </header>

        <div className="grid flex-1 gap-3 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <p className="rounded-app border border-border-base bg-surface px-4 py-3 text-base text-muted">
              Carrinho vazio.
            </p>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onRemove={removeItem}
                onUpdateQuantity={updateQuantity}
              />
            ))
          )}
        </div>

        <footer className="grid gap-3 border-t border-border-base pt-4">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Subtotal</span>
            <span>{currency.format(subtotalCents / 100)}</span>
          </div>

          {inlineError ? (
            <p className="rounded-app border border-red-200 bg-red-50 px-3 py-2 text-base text-danger">
              {inlineError}
            </p>
          ) : null}

          <Button
            type="button"
            isLoading={checkout.checkout.status === "loading"}
            disabled={items.length === 0}
            onClick={handleCheckout}
          >
            Fechar Pedido
          </Button>
        </footer>
      </aside>
    </div>
  );
}
