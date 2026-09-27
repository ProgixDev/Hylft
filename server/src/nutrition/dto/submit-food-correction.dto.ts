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
  original_monounsaturated_fat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_polyunsaturated_fat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_trans_fat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_cholesterol?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_polyols?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_starch?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_alcohol?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_water?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_caffeine?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_potassium?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_calcium?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_magnesium?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_iron?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_zinc?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_phosphorus?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_a?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_b1?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_b2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_b3?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_b5?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_b6?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_b7?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_b9?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_b12?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_c?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_d?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_e?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  original_vitamin_k?: number;

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
  monounsaturated_fat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  polyunsaturated_fat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  trans_fat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cholesterol?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  polyols?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  starch?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  alcohol?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  water?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  caffeine?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  potassium?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calcium?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  magnesium?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  iron?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  zinc?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  phosphorus?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_a?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_b1?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_b2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_b3?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_b5?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_b6?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_b7?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_b9?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_b12?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_c?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_d?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_e?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitamin_k?: number;

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
