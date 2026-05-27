import { useEffect } from "react";

interface ToastProps {
  id: string;
  message: string;
  variant: "success" | "error";
  onDismiss: (id: string) => void;
}

const variantClasses = {
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-red-200 bg-red-50 text-red-900"
};

export function Toast({ id, message, variant, onDismiss }: ToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => onDismiss(id), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [id, onDismiss]);

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-app border px-4 py-3 text-base shadow-md ${variantClasses[variant]}`}
    >
      <p className="font-medium">{message}</p>
      <button
        type="button"
        className="rounded-full px-2 py-1 text-base font-semibold"
        aria-label="Fechar notificacao"
        onClick={() => onDismiss(id)}
      >
        x
      </button>
    </div>
  );
}
