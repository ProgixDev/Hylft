import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import {
  CurrentUser,
  AuthUser,
} from '../auth/decorators/current-user.decorator';
import { BodyMeasurementsService } from './body-measurements.service';
import { UpsertBodyMeasurementDto } from './dto/upsert-body-measurement.dto';

@Controller('body-measurements')
@UseGuards(SupabaseJwtGuard)
export class BodyMeasurementsController {
  constructor(private readonly service: BodyMeasurementsService) {}

  @Get()
  list(
    @CurrentUser() me: AuthUser,
    @Query('metric') metric?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listAll(
      me.id,
      metric,
      start,
      end,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('latest')
  latest(@CurrentUser() me: AuthUser) {
    return this.service.getLatest(me.id);
  }

  @Post()
  upsert(
    @CurrentUser() me: AuthUser,
    @Body() dto: UpsertBodyMeasurementDto,
  ) {
    return this.service.upsert(me.id, dto);
  }

  @Post('bulk')
  bulkUpsert(
    @CurrentUser() me: AuthUser,
    @Body() body: { entries: { metric: string; value: number; measurement_date: string }[] },
  ) {
    return this.service.bulkUpsert(me.id, body.entries);
  }

  @Delete(':id')
  remove(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.service.remove(me.id, id);
  }
}
