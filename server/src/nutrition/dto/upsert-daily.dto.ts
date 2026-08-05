import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpsertDailyDto {
  @IsString()
  date: string; // YYYY-MM-DD

  @IsOptional()
  @IsNumber()
  @Min(0)
  water_ml?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight_kg?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
