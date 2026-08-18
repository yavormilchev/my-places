import { beforeEach, describe, expect, it } from "vitest";
import { insertTestUser } from "../testSupport/insertTestUser";
import { resetDb } from "../testSupport/resetDb";
import { userExists } from "./userExists";

describe("userExists", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns false when no user has that id", async () => {
    expect(await userExists("nobody")).toBe(false);
  });

  it("returns true once that user exists", async () => {
    await insertTestUser("sub-1");

    expect(await userExists("sub-1")).toBe(true);
  });
});
