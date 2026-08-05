import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import { ExercisesService } from './exercises.service';
import { ListExercisesQueryDto } from './dto/list-exercises-query.dto';

@Controller('exercises')
@UseGuards(SupabaseJwtGuard)
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  list(@Query() q: ListExercisesQueryDto) {
    return this.exercises.list(q);
  }

  @Get('body-parts')
  bodyParts() {
    return this.exercises.bodyParts();
  }

  @Get('equipments')
  equipments() {
    return this.exercises.equipments();
  }

  @Get('external/:externalId')
  byExternalId(@Param('externalId') externalId: string) {
    return this.exercises.byExternalId(externalId);
  }

  @Get(':id')
  byId(@Param('id', ParseUUIDPipe) id: string) {
    return this.exercises.byId(id);
  }
}
