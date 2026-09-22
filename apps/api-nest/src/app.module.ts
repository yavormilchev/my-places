import { Module } from '@nestjs/common';
import { ObserveModule } from './observe.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY!,
      appSecret: process.env.OBSERVE_APP_SECRET!,
      serviceId: 'my-places',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
