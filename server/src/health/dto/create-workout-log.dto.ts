import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  Min,
  IsObject,
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
  @IsIn(['manual', 'health_connect', 'apple_health'])
  source?: string;

  @IsObject()
  @IsOptional()
  exercises?: any;

  @IsString()
  @IsOptional()
  notes?: string;
}
