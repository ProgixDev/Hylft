import { IsDateString, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertWeightDto {
  @IsDateString()
  entry_date!: string; // YYYY-MM-DD

  @IsNumber()
  @Min(20)
  @Max(500)
  @Type(() => Number)
  weight_kg!: number;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;
}
