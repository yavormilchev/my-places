import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportDropZone } from "./ImportDropZone";
import * as uploadCsvModule from "./uploadCsv";

describe("ImportDropZone", () => {
  // vi.spyOn on an already-spied method returns the same spy rather than a
  // fresh one — without this, a later test would inherit an earlier test's
  // mockResolvedValue and call count instead of starting clean.
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uploads a selected CSV and reports the summary", async () => {
    const uploadCsv = vi
      .spyOn(uploadCsvModule, "uploadCsv")
      .mockResolvedValue({ saved: 3, deleted: 1 });
    const onImported = vi.fn();
    const user = userEvent.setup();

    render(<ImportDropZone onImported={onImported} />);

    const file = new File(["Title,Note,URL,Tags,Comment\n"], "Coffee.csv", {
      type: "text/csv",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() =>
      expect(screen.getByText(/imported 1 file/i)).toBeInTheDocument(),
    );
    expect(uploadCsv).toHaveBeenCalledWith(file);
    expect(onImported).toHaveBeenCalled();
  });

  it("ignores non-CSV files", async () => {
    const uploadCsv = vi.spyOn(uploadCsvModule, "uploadCsv");
    const onImported = vi.fn();
    const user = userEvent.setup();

    render(<ImportDropZone onImported={onImported} />);

    const file = new File(["not a csv"], "notes.txt", { type: "text/plain" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    expect(uploadCsv).not.toHaveBeenCalled();
    expect(onImported).not.toHaveBeenCalled();
  });
});
