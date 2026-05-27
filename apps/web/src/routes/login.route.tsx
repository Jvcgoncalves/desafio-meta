import { LoginForm } from "../features/auth/components/LoginForm";
import type { useAuth } from "../features/auth/hooks/useAuth";

interface LoginRouteProps {
  auth: ReturnType<typeof useAuth>;
}

export function LoginRoute({ auth }: LoginRouteProps) {
  return (
    <section className="mx-auto grid w-shell gap-6 py-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold">Entrar</h1>
        <p className="max-w-2xl text-base text-muted">
          Use a conta demo para finalizar pedidos no carrinho.
        </p>
      </div>
      <div className="max-w-md">
        <LoginForm auth={auth} />
      </div>
    </section>
  );
}
