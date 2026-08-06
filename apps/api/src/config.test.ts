import { describe, expect, it } from "vitest";
import { required } from "./config";

describe("required", () => {
  it("returns the value when it's set", () => {
    expect(required("TEST_VAR", "value")).toBe("value");
  });

  it("throws when the value is missing", () => {
    expect(() => required("TEST_VAR", undefined)).toThrow(
      "Missing required env var: TEST_VAR",
    );
  });
});
