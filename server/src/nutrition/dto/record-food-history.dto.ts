import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordFoodHistoryDto {
  @IsString()
  food_id: string;

  @IsString()
  food_name: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  protein?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carbs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fat?: number;
}
