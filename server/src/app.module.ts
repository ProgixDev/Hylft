import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { ExercisesModule } from './exercises/exercises.module';
import { FeedModule } from './feed/feed.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { RoutinesModule } from './routines/routines.module';
import { ScheduleModule } from './schedule/schedule.module';
import { SocialModule } from './social/social.module';
import { UsersModule } from './users/users.module';
import { WeightEntriesModule } from './weight-entries/weight-entries.module';

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
    SocialModule,
    ScheduleModule,
    WeightEntriesModule,
    NotificationsModule,
    ExercisesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
