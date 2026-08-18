import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { env } from "../config";
import { createSessionToken, verifySessionToken } from "./session";

const PAYLOAD = { userId: "google-sub-123", email: "someone@gmail.com" };

describe("session tokens", () => {
  it("round-trips a valid token", () => {
    const token = createSessionToken(PAYLOAD);
    expect(verifySessionToken(token)).toEqual(PAYLOAD);
  });

  it("rejects a tampered token", () => {
    const token = createSessionToken(PAYLOAD);
    expect(verifySessionToken(`${token}tampered`)).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(verifySessionToken("not-a-jwt")).toBeNull();
  });

  it("rejects a validly-signed token missing userId", () => {
    const token = jwt.sign({ email: "someone@gmail.com" }, env.sessionSecret);
    expect(verifySessionToken(token)).toBeNull();
  });
});
