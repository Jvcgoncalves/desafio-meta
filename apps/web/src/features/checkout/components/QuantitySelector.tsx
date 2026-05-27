import { Button } from "../../../components/ui/Button";

interface QuantitySelectorProps {
  value: number;
  max?: number;
  onChange: (value: number) => void;
}

export function validateQuantity(quantity: number): string | null {
  if (!Number.isInteger(quantity)) {
    return "A quantidade deve ser um numero inteiro.";
  }

  if (quantity <= 0) {
    return "A quantidade deve ser no minimo 1.";
  }

  return null;
}

export function QuantitySelector({
  value,
  max,
  onChange
}: QuantitySelectorProps) {
  const error = validateQuantity(value);

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <Button
          aria-label="Diminuir quantidade"
          type="button"
          variant="secondary"
          className="h-10 w-10 px-0"
          disabled={value <= 1}
          onClick={() => onChange(Math.max(1, value - 1))}
        >
          -
        </Button>
        <input
          className="h-10 w-20 rounded-app border border-border-base bg-surface px-3 text-center text-base font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
          inputMode="numeric"
          min={1}
          max={max}
          step={1}
          type="number"
          value={Number.isNaN(value) ? "" : value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <Button
          aria-label="Aumentar quantidade"
          type="button"
          variant="secondary"
          className="h-10 w-10 px-0"
          disabled={max !== undefined && value >= max}
          onClick={() => onChange(value + 1)}
        >
          +
        </Button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
