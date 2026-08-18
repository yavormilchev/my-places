import { beforeEach, describe, expect, it } from "vitest";
import { pool } from "../db";
import { resetDb } from "../testSupport/resetDb";
import { upsertUser } from "./upsertUser";

describe("upsertUser", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a new user", async () => {
    await upsertUser("sub-1", "first@example.com");

    const { rows } = await pool.query(
      "select id, email from users where id = $1",
      ["sub-1"],
    );
    expect(rows).toEqual([{ id: "sub-1", email: "first@example.com" }]);
  });

  it("refreshes the email on a repeat sign-in instead of duplicating the row", async () => {
    await upsertUser("sub-1", "old@example.com");
    await upsertUser("sub-1", "new@example.com");

    const { rows } = await pool.query(
      "select id, email from users where id = $1",
      ["sub-1"],
    );
    expect(rows).toEqual([{ id: "sub-1", email: "new@example.com" }]);
  });
});
