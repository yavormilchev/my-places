import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../database/pg-pool.provider.js';

@Injectable()
export class UsersRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /**
   * Creates the user on first sign-in, or refreshes their stored email on
   * every one after that — email isn't the identity key (see
   * SessionPayload), but it's worth keeping current since Google's the
   * only source of truth for it and nothing else in this app can prompt
   * for it.
   */
  async upsert(id: string, email: string): Promise<void> {
    await this.pool.query(
      `insert into users (id, email) values ($1, $2)
       on conflict (id) do update set email = excluded.email`,
      [id, email],
    );
  }

  /**
   * Used by the CLI import to validate a --userId before doing anything
   * else.
   */
  async exists(id: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      'select 1 from users where id = $1',
      [id],
    );
    return rows.length > 0;
  }
}
