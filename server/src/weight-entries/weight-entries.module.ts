import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WeightEntriesController } from './weight-entries.controller';
import { WeightEntriesService } from './weight-entries.service';

@Module({
  imports: [AuthModule],
  controllers: [WeightEntriesController],
  providers: [WeightEntriesService],
  exports: [WeightEntriesService],
})
export class WeightEntriesModule {}
