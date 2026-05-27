import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import type { useAuth } from "../features/auth/hooks/useAuth";
import { ProductGrid } from "../features/products/components/ProductGrid";
import { useProducts } from "../features/products/hooks/useProducts";

interface ProductsRouteProps {
  auth: ReturnType<typeof useAuth>;
}

export function ProductsRoute({ auth }: ProductsRouteProps) {
  const { products, refresh } = useProducts();
  const productData = products.data ?? [];

  return (
    <section className="mx-auto grid w-shell gap-6 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold">CaseCellShop</h1>
          <p className="max-w-2xl text-sm text-muted">
            Browse seeded phone cases, reserve stock safely, and follow ERP
            processing status after checkout.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {auth.user ? (
            <>
              <span className="text-sm text-muted">{auth.user.email}</span>
              <Button type="button" variant="secondary" onClick={auth.logout}>
                Log out
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Log in
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            isLoading={products.status === "loading"}
            onClick={() => void refresh().catch(() => undefined)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {products.status === "loading" && productData.length === 0 ? (
        <div className="flex min-h-56 items-center justify-center rounded-app border border-border-base bg-surface">
          <Spinner />
        </div>
      ) : null}

      {products.status === "error" ? (
        <div className="grid gap-3 rounded-app border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Products could not be loaded.</p>
          <p>The page is still available. Retry when the API is reachable.</p>
          <div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void refresh().catch(() => undefined)}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {productData.length > 0 ? (
        <ProductGrid
          products={productData}
          token={auth.token}
          onLoginRequested={() => {
            window.location.href = "/login";
          }}
          onRefreshStock={() => void refresh().catch(() => undefined)}
        />
      ) : null}
    </section>
  );
}
