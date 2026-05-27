import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import type { useAuth } from "../features/auth/hooks/useAuth";
import { useCartContext } from "../features/cart/context/CartContext";
import { CartDrawer } from "../features/cart/components/CartDrawer";
import { ProductGrid } from "../features/products/components/ProductGrid";
import { useProducts } from "../features/products/hooks/useProducts";

interface ProductsRouteProps {
  auth: ReturnType<typeof useAuth>;
}

export function ProductsRoute({ auth }: ProductsRouteProps) {
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { totalItems } = useCartContext();
  const { products, refresh } = useProducts();
  const productData = products.data ?? [];

  return (
    <>
      <section className="mx-auto grid w-shell gap-6 py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="grid gap-2">
            <h1 className="text-3xl font-bold">CaseCellShop</h1>
            <p className="max-w-2xl text-base text-muted">
              Escolha capinhas para seu smartphone, adicione ao carrinho e
              acompanhe o status do pedido.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              Carrinho
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                {totalItems}
              </span>
            </Button>
            {auth.user ? (
              <>
                <span className="text-base text-muted">{auth.user.email}</span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={auth.logout}
                >
                  Sair
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  navigate("/login");
                }}
              >
                Entrar
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              isLoading={products.status === "loading"}
              onClick={() => void refresh().catch(() => undefined)}
            >
              Atualizar
            </Button>
          </div>
        </div>

      {products.status === "loading" && productData.length === 0 ? (
        <div className="flex min-h-56 items-center justify-center rounded-app border border-border-base bg-surface">
          <Spinner />
        </div>
      ) : null}

      {products.status === "error" ? (
        <div className="grid gap-3 rounded-app border border-red-200 bg-red-50 p-4 text-base text-red-900">
          <p className="font-semibold">Produtos indisponiveis.</p>
          <p>
            A pagina continua disponivel. Tente novamente quando a API estiver
            acessivel.
          </p>
          <div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void refresh().catch(() => undefined)}
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      ) : null}

        {productData.length > 0 ? <ProductGrid products={productData} /> : null}

      </section>
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        token={auth.token}
      />
    </>
  );
}
