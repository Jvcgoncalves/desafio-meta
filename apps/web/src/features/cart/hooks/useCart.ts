import type { ProductListItemDto } from "@casecellshop/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { CartItem } from "../types";

const STORAGE_KEY = "casecellshop.cart";

function clampQuantity(quantity: number, max: number) {
  const safeQuantity = Math.trunc(quantity);
  return Math.max(1, Math.min(safeQuantity, max));
}

function normalizeCartItem(item: CartItem): CartItem | null {
  const max = Math.max(0, Math.trunc(item.availableStock));

  if (max === 0) {
    return null;
  }

  const quantity = clampQuantity(item.quantity, max);

  return {
    productId: item.productId,
    name: item.name,
    model: item.model,
    priceCents: item.priceCents,
    availableStock: max,
    quantity
  };
}

function loadStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CartItem[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeCartItem(item))
      .filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => loadStoredCart());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback(
    (product: ProductListItemDto, quantity: number) => {
      const max = Math.max(0, product.availableStock);

      if (max === 0) {
        return;
      }

      setItems((current) => {
        const nextQuantity = clampQuantity(quantity, max);
        const existingIndex = current.findIndex(
          (item) => item.productId === product.id
        );

        if (existingIndex < 0) {
          return [
            ...current,
            {
              productId: product.id,
              name: product.name,
              model: product.model,
              priceCents: product.priceCents,
              availableStock: max,
              quantity: nextQuantity
            }
          ];
        }

        return current.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                name: product.name,
                model: product.model,
                priceCents: product.priceCents,
                availableStock: max,
                quantity: clampQuantity(nextQuantity, max)
              }
            : item
        );
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      current.flatMap((item) => {
        if (item.productId !== productId) {
          return [item];
        }

        if (quantity <= 0) {
          return [];
        }

        const max = Math.max(1, item.availableStock);

        return [
          {
            ...item,
            quantity: clampQuantity(quantity, max)
          }
        ];
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.priceCents, 0),
    [items]
  );

  return {
    items,
    totalItems,
    subtotalCents,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };
}
