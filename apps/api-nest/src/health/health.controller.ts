import {
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../database/pg-pool.provider.js';

@Controller()
export class HealthController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Get('db-health')
  async getDbHealth(): Promise<Record<string, unknown>> {
    try {
      const result = await this.pool.query(
        'select now() as now, postgis_version() as postgis',
      );
      return { status: 'ok', ...result.rows[0] };
    } catch (err) {
      throw new InternalServerErrorException((err as Error).message);
    }
  }
}
