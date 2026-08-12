import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";

describe("session tokens", () => {
  it("round-trips a valid token", () => {
    const token = createSessionToken({
      email: "the-allowed-user-email@gmail.com",
    });
    expect(verifySessionToken(token)).toEqual({
      email: "the-allowed-user-email@gmail.com",
    });
  });

  it("rejects a tampered token", () => {
    const token = createSessionToken({
      email: "the-allowed-user-email@gmail.com",
    });
    expect(verifySessionToken(`${token}tampered`)).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(verifySessionToken("not-a-jwt")).toBeNull();
  });
});
