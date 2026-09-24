import { Module } from '@nestjs/common';
import { ObserveModule } from './observe.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY!,
      appSecret: process.env.OBSERVE_APP_SECRET!,
      serviceId: 'my-places',
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}
