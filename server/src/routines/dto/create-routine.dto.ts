import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsIn,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SetTargetDto {
  @IsNumber()
  setNumber: number;

  @IsNumber()
  @Min(0)
  targetKg: number;

  @IsString()
  targetReps: string;
}

export class RoutineExerciseDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  sets: number;

  @IsString()
  reps: string;

  @IsNumber()
  @Min(0)
  restTime: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  trainingTime?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  targetWeight?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SetTargetDto)
  setTargets?: SetTargetDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateRoutineDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty: string;

  @IsArray()
  @IsOptional()
  targetMuscles?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutineExerciseDto)
  exercises: RoutineExerciseDto[];

  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;
}
