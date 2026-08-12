import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignOutButton } from "./SignOutButton";
import * as auth from "./auth";

describe("SignOutButton", () => {
  it("calls logout when clicked", async () => {
    const logout = vi.spyOn(auth, "logout").mockResolvedValue();
    const user = userEvent.setup();
    render(<SignOutButton />);

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(logout).toHaveBeenCalled();
  });
});
