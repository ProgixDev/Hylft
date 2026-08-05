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
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { WeightEntriesService } from './weight-entries.service';
import { UpsertWeightDto } from './dto/upsert-weight.dto';

@Controller('weight')
@UseGuards(SupabaseJwtGuard)
export class WeightEntriesController {
  constructor(private readonly weight: WeightEntriesService) {}

  @Get()
  list(
    @CurrentUser() me: AuthUser,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('limit') limit?: string,
  ) {
    return this.weight.listRange(
      me.id,
      start,
      end,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Post()
  upsert(@CurrentUser() me: AuthUser, @Body() dto: UpsertWeightDto) {
    return this.weight.upsert(me.id, dto);
  }

  @Delete(':date')
  remove(@CurrentUser() me: AuthUser, @Param('date') date: string) {
    return this.weight.remove(me.id, date);
  }
}
