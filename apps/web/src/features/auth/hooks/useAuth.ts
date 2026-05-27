import type { LoginRequestDto, LoginResponseDto } from "@casecellshop/shared";
import { useCallback, useMemo, useState } from "react";

import { useAsync } from "../../../hooks/useAsync";
import { login as loginRequest } from "../../../services/auth.service";

const STORAGE_KEY = "casecellshop.auth";

function loadStoredAuth(): LoginResponseDto | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LoginResponseDto) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [session, setSession] = useState<LoginResponseDto | null>(() =>
    loadStoredAuth()
  );
  const {
    state: loginState,
    run: runLogin,
    reset: resetLogin
  } = useAsync<LoginResponseDto>();

  const login = useCallback(
    async (credentials: LoginRequestDto) => {
      const result = await runLogin(() => loginRequest(credentials));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      setSession(result);
      return result;
    },
    [runLogin]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    resetLogin();
  }, [resetLogin]);

  return useMemo(
    () => ({
      session,
      loginState,
      login,
      logout,
      token: session?.accessToken ?? null,
      user: session?.user ?? null,
      isAuthenticated: session !== null
    }),
    [login, loginState, logout, session]
  );
}
