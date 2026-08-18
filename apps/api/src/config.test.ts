import { describe, expect, it } from "vitest";
import { parseAllowedEmails, required } from "./config";

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

describe("parseAllowedEmails", () => {
  it("splits, trims, and lowercases a comma-separated list", () => {
    expect(parseAllowedEmails(" Foo@Example.com, bar@example.com ")).toEqual([
      "foo@example.com",
      "bar@example.com",
    ]);
  });

  it("drops empty entries", () => {
    expect(parseAllowedEmails("foo@example.com,,bar@example.com,")).toEqual([
      "foo@example.com",
      "bar@example.com",
    ]);
  });

  it("throws when nothing valid is left", () => {
    expect(() => parseAllowedEmails(" , ,")).toThrow(
      "ALLOWED_EMAILS resolved to zero valid addresses",
    );
  });
});
