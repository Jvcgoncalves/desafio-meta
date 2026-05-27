import { LoginForm } from "../features/auth/components/LoginForm";
import type { useAuth } from "../features/auth/hooks/useAuth";

interface LoginRouteProps {
  auth: ReturnType<typeof useAuth>;
}

export function LoginRoute({ auth }: LoginRouteProps) {
  return (
    <section className="mx-auto grid w-shell gap-6 py-8">
      <div className="grid gap-2">
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="max-w-2xl text-sm text-muted">
          Use the seeded demo account to submit checkout requests.
        </p>
      </div>
      <div className="max-w-md">
        <LoginForm auth={auth} />
      </div>
    </section>
  );
}
