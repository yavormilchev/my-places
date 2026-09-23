import { Global, Module } from '@nestjs/common';
import { PG_POOL, PgPool } from './pg-pool.provider.js';

@Global()
@Module({
  providers: [{ provide: PG_POOL, useClass: PgPool }],
  exports: [PG_POOL],
})
export class DatabaseModule {}
