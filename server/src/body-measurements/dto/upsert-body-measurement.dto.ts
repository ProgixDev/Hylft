import { IsDateString, IsIn, IsNumber, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

const VALID_METRICS = [
  'waist',
  'chest',
  'hips',
  'thigh',
  'arm',
  'body_fat',
  'muscle_mass',
] as const;

export class UpsertBodyMeasurementDto {
  @IsString()
  @IsIn(VALID_METRICS)
  metric!: string;

  @IsDateString()
  measurement_date!: string; // YYYY-MM-DD

  @IsNumber()
  @Min(0.1)
  @Max(999)
  @Type(() => Number)
  value!: number;
}
