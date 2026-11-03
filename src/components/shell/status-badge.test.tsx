import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STATUS_LABELS, StatusBadge } from "@/components/shell/status-badge";

describe("StatusBadge", () => {
  it.each([
    ["pending", "Pendiente"],
    ["approved", "Aprobado"],
    ["rejected", "Rechazado"],
  ] as const)(
    "shows the text label for %s (never colour alone)",
    (status, label) => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(STATUS_LABELS[status]).toBe(label);
    },
  );

  it("exposes the status as a data attribute for styling hooks", () => {
    render(<StatusBadge status="approved" />);
    expect(
      screen.getByText("Aprobado").closest("[data-status]"),
    ).toHaveAttribute("data-status", "approved");
  });
});
