import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { useToast } from "../../../hooks/useToast";
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

  return "Falha no login. Tente novamente em instantes.";
}

export function LoginForm({ auth }: LoginFormProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("demo@casecellshop.local");
  const [password, setPassword] = useState("demo123");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void auth
      .login({ email, password })
      .then(() => {
        showToast("Login realizado com sucesso!", "success");
        navigate("/");
      })
      .catch(() => undefined);
  };

  return (
    <Card className="p-5">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-1">
          <h2 className="text-xl font-semibold">Acesso demo</h2>
          <p className="text-base text-muted">
            Entre para finalizar os pedidos do carrinho.
          </p>
        </div>
        <Input
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {auth.loginState.status === "error" ? (
          <p className="rounded-app border border-red-200 bg-red-50 px-3 py-2 text-base text-danger">
            {loginErrorMessage(auth.loginState.error)}
          </p>
        ) : null}
        <Button isLoading={auth.loginState.status === "loading"} type="submit">
          Entrar
        </Button>
      </form>
    </Card>
  );
}
