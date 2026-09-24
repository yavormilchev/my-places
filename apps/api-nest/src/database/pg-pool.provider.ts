import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { env } from '../config.js';

export const PG_POOL = 'PG_POOL';

@Injectable()
export class PgPool extends Pool implements OnModuleDestroy {
  constructor() {
    super({ connectionString: env.databaseUrl });
  }

  async onModuleDestroy(): Promise<void> {
    await this.end();
  }
}
