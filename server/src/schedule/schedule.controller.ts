import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { ScheduleService } from './schedule.service';
import { UpsertAssignmentDto } from './dto/upsert-assignment.dto';

@Controller('schedule')
@UseGuards(SupabaseJwtGuard)
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get()
  list(@CurrentUser() me: AuthUser) {
    return this.schedule.list(me.id);
  }

  @Put(':dayOfWeek')
  upsert(
    @CurrentUser() me: AuthUser,
    @Param('dayOfWeek', ParseIntPipe) dayOfWeek: number,
    @Body() dto: UpsertAssignmentDto,
  ) {
    return this.schedule.upsert(me.id, dayOfWeek, dto);
  }

  @Delete(':dayOfWeek')
  remove(
    @CurrentUser() me: AuthUser,
    @Param('dayOfWeek', ParseIntPipe) dayOfWeek: number,
  ) {
    return this.schedule.remove(me.id, dayOfWeek);
  }
}
