import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpsertSnapshotDto {
  @IsString()
  date: string; // YYYY-MM-DD

  @IsNumber()
  @Min(0)
  steps: number;

  @IsNumber()
  @Min(0)
  calories_burned: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  active_minutes?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  distance_km?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  water_ml?: number;
}
