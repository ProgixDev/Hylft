import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  Min,
  IsArray,
} from 'class-validator';

export class CreateWorkoutLogDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  workout_type?: string;

  @IsString()
  date: string; // YYYY-MM-DD

  @IsString()
  @IsOptional()
  start_time?: string; // ISO timestamp

  @IsString()
  @IsOptional()
  end_time?: string;

  @IsNumber()
  @Min(0)
  duration_minutes: number;

  @IsNumber()
  @Min(0)
  calories_burned: number;

  @IsString()
  @IsOptional()
  @IsIn(['manual', 'routine', 'health_connect', 'apple_health'])
  source?: string;

  @IsString()
  @IsOptional()
  routine_id?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  total_volume_kg?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  total_sets?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  completed_sets?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  exercise_count?: number;

  @IsArray()
  @IsOptional()
  exercises?: any[];

  @IsString()
  @IsOptional()
  notes?: string;
}
