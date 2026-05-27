import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuantitySelector, validateQuantity } from "./QuantitySelector";

describe("validateQuantity", () => {
  it("rejects zero, negative, and non-integer quantities", () => {
    expect(validateQuantity(0)).toBe("A quantidade deve ser no minimo 1.");
    expect(validateQuantity(-1)).toBe("A quantidade deve ser no minimo 1.");
    expect(validateQuantity(1.5)).toBe(
      "A quantidade deve ser um numero inteiro."
    );
  });

  it("allows positive integer quantities", () => {
    expect(validateQuantity(1)).toBeNull();
    expect(validateQuantity(4)).toBeNull();
  });
});

describe("QuantitySelector", () => {
  it("renders validation feedback for invalid quantities", () => {
    render(<QuantitySelector value={0} onChange={() => undefined} />);

    expect(
      screen.getByText("A quantidade deve ser no minimo 1.")
    ).toBeInTheDocument();
  });

  it("blocks decreasing below one", async () => {
    const onChange = vi.fn();

    render(<QuantitySelector value={1} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: /diminuir quantidade/i })
    );

    expect(onChange).not.toHaveBeenCalled();
  });
});
