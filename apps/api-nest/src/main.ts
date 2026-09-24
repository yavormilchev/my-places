import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(import.meta.dirname, '../../../.env') });

import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ObserveInstrument } from './observe.js';

async function bootstrap() {
  const { AppModule } = await import('./app.module.js');
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
