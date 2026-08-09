import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RoutineExerciseDto } from './create-routine.dto';

export class UpdateRoutineDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  targetMuscles?: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoutineExerciseDto)
  exercises?: RoutineExerciseDto[];

  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;

  @IsString()
  @IsOptional()
  wallpaperUrl?: string;
}
