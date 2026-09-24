import { Test, TestingModule } from '@nestjs/testing';
import type { Pool } from 'pg';
import { DatabaseModule } from '../database/database.module.js';
import { PG_POOL } from '../database/pg-pool.provider.js';
import { insertTestUser } from '../testSupport/insert-test-user.js';
import { resetDb } from '../testSupport/reset-db.js';
import { UsersRepository } from './users.repository.js';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let pool: Pool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [UsersRepository],
    }).compile();

    repository = module.get(UsersRepository);
    pool = module.get(PG_POOL);
    await resetDb(pool);
  });

  describe('upsert', () => {
    it('creates a new user', async () => {
      await repository.upsert('sub-1', 'first@example.com');

      const { rows } = await pool.query(
        'select id, email from users where id = $1',
        ['sub-1'],
      );
      expect(rows).toEqual([{ id: 'sub-1', email: 'first@example.com' }]);
    });

    it('refreshes the email on a repeat sign-in instead of duplicating the row', async () => {
      await repository.upsert('sub-1', 'old@example.com');
      await repository.upsert('sub-1', 'new@example.com');

      const { rows } = await pool.query(
        'select id, email from users where id = $1',
        ['sub-1'],
      );
      expect(rows).toEqual([{ id: 'sub-1', email: 'new@example.com' }]);
    });
  });

  describe('exists', () => {
    it('returns false when no user has that id', async () => {
      expect(await repository.exists('nobody')).toBe(false);
    });

    it('returns true once that user exists', async () => {
      await insertTestUser(pool, 'sub-1');

      expect(await repository.exists('sub-1')).toBe(true);
    });
  });
});
