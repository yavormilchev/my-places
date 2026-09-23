import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { required } from '../config.js';

export const PG_POOL = 'PG_POOL';

@Injectable()
export class PgPool extends Pool implements OnModuleDestroy {
  constructor() {
    super({
      connectionString: required('DATABASE_URL', process.env.DATABASE_URL),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.end();
  }
}
