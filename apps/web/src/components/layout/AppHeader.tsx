import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../ui/Button";

interface AppHeaderProps {
  isAuthenticated: boolean;
  userEmail: string | null;
  cartItemsCount: number;
  onOpenCart: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export function AppHeader({
  isAuthenticated,
  userEmail,
  cartItemsCount,
  onOpenCart,
  onLogin,
  onLogout
}: AppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAuthAction = () => {
    setIsMobileMenuOpen(false);

    if (isAuthenticated) {
      onLogout();
      return;
    }

    onLogin();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border-base bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-shell items-center gap-3 py-3">
        <Link
          to="/"
          className="text-3xl font-bold leading-none text-text-base md:text-2xl"
        >
          CaseCellShop
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-4 md:flex">
          <Link
            to="/itens"
            className="text-lg font-semibold text-text-base transition hover:text-primary md:text-base"
          >
            Itens
          </Link>
          <Link
            to="/pedidos"
            className="text-lg font-semibold text-text-base transition hover:text-primary md:text-base"
          >
            Pedidos
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="text-lg md:text-base"
            onClick={onOpenCart}
          >
            Carrinho
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
              {cartItemsCount}
            </span>
          </Button>
          {userEmail ? (
            <span className="hidden max-w-[16rem] truncate text-base text-muted lg:inline">
              {userEmail}
            </span>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="text-lg md:text-base"
            onClick={handleAuthAction}
          >
            {isAuthenticated ? "Sair" : "Entrar"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="text-lg md:hidden"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            {isMobileMenuOpen ? "Fechar" : "Menu"}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-border-base md:hidden">
          <div className="mx-auto grid w-shell gap-2 py-3">
            <Link
              to="/itens"
              className="text-lg font-semibold text-text-base"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Itens
            </Link>
            <Link
              to="/pedidos"
              className="text-lg font-semibold text-text-base"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pedidos
            </Link>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="text-lg"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleAuthAction();
                }}
              >
                {isAuthenticated ? "Sair" : "Entrar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
