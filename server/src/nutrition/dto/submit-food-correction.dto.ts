import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SubmitFoodCorrectionDto {
  @IsString()
  food_id: string;

  @IsString()
  food_name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_calories?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_protein?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_carbs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_fat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_sugars?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_saturated_fat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_fiber?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_salt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_serving_size?: number;

  @IsNumber()
  @Min(0)
  calories: number;

  @IsNumber()
  @Min(0)
  protein: number;

  @IsNumber()
  @Min(0)
  carbs: number;

  @IsNumber()
  @Min(0)
  fat: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sugars?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saturated_fat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fiber?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serving_size?: number;
}
