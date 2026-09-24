import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { GoogleOAuthService } from './google-oauth.service.js';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [GoogleOAuthService, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
