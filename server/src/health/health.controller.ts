import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import {
  CurrentUser,
  AuthUser,
} from '../auth/decorators/current-user.decorator';
import { HealthService } from './health.service';
import { UpsertSnapshotDto } from './dto/upsert-snapshot.dto';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';

@Controller('health')
@UseGuards(SupabaseJwtGuard)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // ── Daily Snapshots ────────────────────────────────────────────────────

  @Get('snapshots')
  getSnapshot(
    @CurrentUser() user: AuthUser,
    @Query('date') date: string,
  ) {
    return this.healthService.getSnapshot(user.id, date);
  }

  @Get('snapshots/range')
  getSnapshotsRange(
    @CurrentUser() user: AuthUser,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    return this.healthService.getSnapshotsRange(user.id, startDate, endDate);
  }

  @Post('snapshots')
  upsertSnapshot(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertSnapshotDto,
  ) {
    return this.healthService.upsertSnapshot(user.id, dto);
  }

  // ── Workout Logs ───────────────────────────────────────────────────────

  @Get('workouts')
  getWorkouts(
    @CurrentUser() user: AuthUser,
    @Query('date') date: string,
  ) {
    return this.healthService.getWorkouts(user.id, date);
  }

  @Get('workouts/range')
  getWorkoutsRange(
    @CurrentUser() user: AuthUser,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    return this.healthService.getWorkoutsRange(user.id, startDate, endDate);
  }

  @Post('workouts')
  addWorkout(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateWorkoutLogDto,
  ) {
    return this.healthService.addWorkout(user.id, dto);
  }

  @Delete('workouts/:id')
  deleteWorkout(
    @CurrentUser() user: AuthUser,
    @Param('id') workoutId: string,
  ) {
    return this.healthService.deleteWorkout(user.id, workoutId);
  }
}
