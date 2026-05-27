import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const handleAuthAction = () => {
    setIsMobileMenuOpen(false);

    if (isAuthenticated) {
      onLogout();
      return;
    }

    onLogin();
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border-base bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-shell items-center gap-3 py-3 max-md:justify-between">
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

        <div className="flex items-center gap-2 md:ml-auto ">
          <Button
            type="button"
            variant="secondary"
            className="text-lg md:text-base max-md:hidden"
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
            className="text-lg md:text-base max-md:hidden"
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
        <>
          <div className="fixed top-16 z-10 left-0 right-0 h-dvh bg-black/65 md:hidden">
            
          </div>
          <div className="fixed top-16 inset-0 z-[60] md:hidden">
            <div className="flex h-full flex-col">

              <div className="mx-auto grid w-shell content-start gap-3 py-4 text-left">
              <Button
                type="button"
                variant="secondary"
                overrideClass={true}
                className="text-lg flex gap-2 items-center border-none bg-transparent text-white text-left mx-0 px-0"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCart();
                }}
              >
                Carrinho
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                  {cartItemsCount}
                </span>
              </Button>
              <Link
                to="/itens"
                className="text-left text-lg font-semibold text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Itens
              </Link>
              <Link
                to="/pedidos"
                className="text-left text-lg font-semibold text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pedidos
              </Link>
              <Button
                type="button"
                variant="secondary"
                overrideClass={true}
                className="text-lg border-none bg-transparent text-white text-left mx-0 px-0"
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
        </>
      ) : null}
    </header>
  );
}
