import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  isLoading?: boolean;
  children: ReactNode;
}

const variants = {
  primary:
    "border-primary bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary",
  secondary:
    "border-border-base bg-surface text-text-base hover:border-primary hover:text-primary focus-visible:ring-primary",
  danger:
    "border-danger bg-danger text-white hover:bg-red-700 focus-visible:ring-danger"
};

export function Button({
  variant = "primary",
  isLoading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-app border px-4 py-2 text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Processando..." : children}
    </button>
  );
}
