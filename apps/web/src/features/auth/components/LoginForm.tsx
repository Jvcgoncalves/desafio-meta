import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { HttpClientError } from "../../../services/http-client";
import { isKnownErrorCode, mapErrorCode } from "../../../services/error-mapper";
import type { useAuth } from "../hooks/useAuth";

interface LoginFormProps {
  auth: ReturnType<typeof useAuth>;
}

function loginErrorMessage(error: unknown): string {
  if (
    error instanceof HttpClientError &&
    isKnownErrorCode(error.response.error.code)
  ) {
    return mapErrorCode(error.response.error.code);
  }

  return "Login failed. Try again in a moment.";
}

export function LoginForm({ auth }: LoginFormProps) {
  const [email, setEmail] = useState("demo@casecellshop.local");
  const [password, setPassword] = useState("demo123");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void auth.login({ email, password }).catch(() => undefined);
  };

  return (
    <Card className="p-5">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">Demo login</h2>
          <p className="text-sm text-muted">
            Sign in to create checkout orders.
          </p>
        </div>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {auth.loginState.status === "error" ? (
          <p className="rounded-app border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
            {loginErrorMessage(auth.loginState.error)}
          </p>
        ) : null}
        <Button isLoading={auth.loginState.status === "loading"} type="submit">
          Log in
        </Button>
      </form>
    </Card>
  );
}
