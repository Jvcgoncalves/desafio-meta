import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="grid gap-2 text-sm font-medium text-text-base">
      <span>{label}</span>
      <input
        id={inputId}
        className={`min-h-11 rounded-app border border-border-base bg-surface px-3 py-2 text-base text-text-base outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-blue-100 ${className}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error && inputId ? `${inputId}-error` : undefined}
        {...props}
      />
      {error ? (
        <span id={inputId ? `${inputId}-error` : undefined} className="text-xs text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
