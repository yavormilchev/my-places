import { describe, expect, it } from "vitest";
import { parseImportInput } from "./parseImportInput";

describe("parseImportInput", () => {
  it("accepts a valid body", () => {
    expect(
      parseImportInput({ listName: "Coffee", content: "a,b\n1,2" }),
    ).toEqual({
      ok: true,
      input: { listName: "Coffee", content: "a,b\n1,2" },
    });
  });

  it("rejects a missing listName", () => {
    expect(parseImportInput({ content: "a,b" })).toEqual({
      ok: false,
      message: "listName is required",
    });
  });

  it("rejects a blank listName", () => {
    expect(parseImportInput({ listName: "   ", content: "a,b" })).toEqual({
      ok: false,
      message: "listName is required",
    });
  });

  it("rejects a missing content", () => {
    expect(parseImportInput({ listName: "Coffee" })).toEqual({
      ok: false,
      message: "content is required",
    });
  });

  it("rejects a non-object body", () => {
    expect(parseImportInput(null)).toEqual({
      ok: false,
      message: "Request body is required",
    });
    expect(parseImportInput("nope")).toEqual({
      ok: false,
      message: "Request body is required",
    });
  });
});
