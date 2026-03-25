import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import {
  CurrentUser,
  AuthUser,
} from '../auth/decorators/current-user.decorator';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';

@Controller('routines')
@UseGuards(SupabaseJwtGuard)
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Get()
  getRoutines(@CurrentUser() user: AuthUser) {
    return this.routinesService.getRoutines(user.id);
  }

  @Get(':id')
  getRoutine(
    @CurrentUser() user: AuthUser,
    @Param('id') routineId: string,
  ) {
    return this.routinesService.getRoutine(user.id, routineId);
  }

  @Post()
  createRoutine(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRoutineDto,
  ) {
    return this.routinesService.createRoutine(user.id, dto);
  }

  @Patch(':id')
  updateRoutine(
    @CurrentUser() user: AuthUser,
    @Param('id') routineId: string,
    @Body() dto: UpdateRoutineDto,
  ) {
    return this.routinesService.updateRoutine(user.id, routineId, dto);
  }

  @Delete(':id')
  deleteRoutine(
    @CurrentUser() user: AuthUser,
    @Param('id') routineId: string,
  ) {
    return this.routinesService.deleteRoutine(user.id, routineId);
  }

  @Post(':id/completed')
  incrementCompleted(
    @CurrentUser() user: AuthUser,
    @Param('id') routineId: string,
  ) {
    return this.routinesService.incrementCompleted(user.id, routineId);
  }
}
