import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFilter } from "./CategoryFilter";

describe("CategoryFilter", () => {
  it("renders nothing when there are no categories yet", () => {
    const { container } = render(
      <CategoryFilter
        categories={[]}
        excluded={new Set()}
        onToggle={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows every category pressed by default, and reports a toggle", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <CategoryFilter
        categories={["Coffee", "Parks"]}
        excluded={new Set()}
        onToggle={onToggle}
      />,
    );

    const coffee = screen.getByRole("button", { name: /coffee/i });
    expect(coffee).toHaveAttribute("aria-pressed", "true");

    await user.click(coffee);

    expect(onToggle).toHaveBeenCalledWith("Coffee");
  });

  it("shows excluded categories as not pressed", () => {
    render(
      <CategoryFilter
        categories={["Coffee"]}
        excluded={new Set(["Coffee"])}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /coffee/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
