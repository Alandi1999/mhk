import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its label as an accessible button", () => {
    render(<Button>Ingresar</Button>);
    expect(
      screen.getByRole("button", { name: "Ingresar" }),
    ).toBeInTheDocument();
  });

  it("is disabled and marked busy while loading", () => {
    render(<Button loading>Ingresando...</Button>);
    const button = screen.getByRole("button", { name: "Ingresando..." });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
