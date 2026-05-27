import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-app border border-border-base bg-surface shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
