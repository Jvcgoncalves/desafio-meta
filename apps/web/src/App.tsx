import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { AppHeader } from "./components/layout/AppHeader";
import { useAuth } from "./features/auth/hooks/useAuth";
import { CartDrawer } from "./features/cart/components/CartDrawer";
import { useCartContext } from "./features/cart/context/CartContext";
import { CartProvider } from "./features/cart/context/CartContext";
import { ToastProvider } from "./hooks/useToast";
import { LoginRoute } from "./routes/login.route";
import { OrdersRoute } from "./routes/orders.route";
import { OrderStatusRoute } from "./routes/order-status.route";
import { ProductsRoute } from "./routes/products.route";

function AppContent() {
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const auth = useAuth();
  const { totalItems } = useCartContext();

  return (
    <main className="min-h-screen">
      <AppHeader
        isAuthenticated={Boolean(auth.user)}
        userEmail={auth.user?.email ?? null}
        cartItemsCount={totalItems}
        onOpenCart={() => setIsCartOpen(true)}
        onLogin={() => navigate("/login")}
        onLogout={() => {
          auth.logout();
          navigate("/itens");
        }}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/itens" replace />} />
        <Route path="/itens" element={<ProductsRoute />} />
        <Route path="/pedidos" element={<OrdersRoute auth={auth} />} />
        <Route path="/pedidos/:orderId" element={<OrderStatusRoute />} />
        <Route path="/login" element={<LoginRoute auth={auth} />} />
        <Route path="*" element={<Navigate to="/itens" replace />} />
      </Routes>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        token={auth.token}
      />
    </main>
  );
}

export function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </ToastProvider>
  );
}
