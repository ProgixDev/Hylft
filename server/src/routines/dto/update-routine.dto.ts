import { IsString, IsNumber, IsOptional, IsArray, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RoutineExerciseDto } from './create-routine.dto';

export class UpdateRoutineDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty?: string;

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
}
