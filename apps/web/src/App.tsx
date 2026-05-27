import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./features/auth/hooks/useAuth";
import { CartProvider } from "./features/cart/context/CartContext";
import { ToastProvider } from "./hooks/useToast";
import { LoginRoute } from "./routes/login.route";
import { OrderStatusRoute } from "./routes/order-status.route";
import { ProductsRoute } from "./routes/products.route";

export function App() {
  const auth = useAuth();

  return (
    <ToastProvider>
      <CartProvider>
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<ProductsRoute auth={auth} />} />
            <Route path="/login" element={<LoginRoute auth={auth} />} />
            <Route path="/pedidos/:orderId" element={<OrderStatusRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </CartProvider>
    </ToastProvider>
  );
}
