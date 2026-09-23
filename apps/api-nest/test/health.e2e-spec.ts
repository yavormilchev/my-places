import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DatabaseModule } from '../src/database/database.module.js';
import { HealthModule } from '../src/health/health.module.js';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, HealthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/api/db-health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/db-health')
      .expect(200);

    expect(response.body).toMatchObject({ status: 'ok' });
    expect(response.body.postgis).toEqual(expect.any(String));
  });

  afterEach(async () => {
    await app.close();
  });
});
