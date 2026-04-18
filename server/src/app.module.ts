import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { FeedModule } from './feed/feed.module';
import { HealthModule } from './health/health.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { RoutinesModule } from './routines/routines.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    AuthModule,
    UsersModule,
    NutritionModule,
    HealthModule,
    RoutinesModule,
    FeedModule,
  ],
})
export class AppModule {}
