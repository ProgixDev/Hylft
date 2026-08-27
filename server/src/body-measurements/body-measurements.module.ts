import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BodyMeasurementsController } from './body-measurements.controller';
import { BodyMeasurementsService } from './body-measurements.service';

@Module({
  imports: [AuthModule],
  controllers: [BodyMeasurementsController],
  providers: [BodyMeasurementsService],
  exports: [BodyMeasurementsService],
})
export class BodyMeasurementsModule {}
