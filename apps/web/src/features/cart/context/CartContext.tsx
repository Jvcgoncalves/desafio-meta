import { createContext, type PropsWithChildren, useContext } from "react";

import { useCart } from "../hooks/useCart";

type CartContextValue = ReturnType<typeof useCart>;

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const value = useCart();

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCartContext precisa ser usado dentro de CartProvider.");
  }

  return context;
}
