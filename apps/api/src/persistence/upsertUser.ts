import { pool } from "../db";

/**
 * Creates the user on first sign-in, or refreshes their stored email on
 * every one after that — email isn't the identity key (see SessionPayload),
 * but it's worth keeping current since Google's the only source of truth
 * for it and nothing else in this app can prompt for it.
 */
export async function upsertUser(id: string, email: string): Promise<void> {
  await pool.query(
    `insert into users (id, email) values ($1, $2)
     on conflict (id) do update set email = excluded.email`,
    [id, email],
  );
}
