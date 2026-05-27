import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ProductGrid } from "../features/products/components/ProductGrid";
import { useProducts } from "../features/products/hooks/useProducts";

export function ProductsRoute() {
  const { products, refresh } = useProducts();
  const productData = products.data ?? [];

  return (
    <section className="mx-auto grid w-shell gap-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold">Itens</h1>
          <p className="max-w-2xl text-base text-muted">
            Escolha capinhas para seu smartphone, adicione ao carrinho e
            acompanhe o status do pedido.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          isLoading={products.status === "loading"}
          onClick={() => void refresh().catch(() => undefined)}
        >
          Atualizar itens
        </Button>
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
  );
}
