import { Test, TestingModule } from '@nestjs/testing';
import type { Pool } from 'pg';
import { PG_POOL } from '../database/pg-pool.provider.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;
  let pool: { query: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    pool = { query: vi.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PG_POOL, useValue: pool as unknown as Pool }],
    }).compile();

    controller = module.get(HealthController);
  });

  describe('getHealth', () => {
    it('returns ok without touching the database', () => {
      expect(controller.getHealth()).toEqual({ status: 'ok' });
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('getDbHealth', () => {
    it('returns ok plus the query row on success', async () => {
      pool.query.mockResolvedValue({
        rows: [{ now: '2026-09-22', postgis: '3.6' }],
      });

      await expect(controller.getDbHealth()).resolves.toEqual({
        status: 'ok',
        now: '2026-09-22',
        postgis: '3.6',
      });
    });

    it('throws a 500 with the underlying message on failure', async () => {
      pool.query.mockRejectedValue(new Error('connection refused'));

      await expect(controller.getDbHealth()).rejects.toThrow(
        'connection refused',
      );
    });
  });
});
