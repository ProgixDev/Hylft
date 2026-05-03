import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';
import { FatSecretClient } from './fatsecret.client';

@Module({
  imports: [AuthModule],
  controllers: [NutritionController],
  providers: [NutritionService, FatSecretClient],
  exports: [NutritionService],
})
export class NutritionModule {}
