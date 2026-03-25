import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  Min,
} from 'class-validator';

export class CreateMealDto {
  @IsString()
  date: string; // YYYY-MM-DD

  @IsString()
  @IsIn(['breakfast', 'lunch', 'snack', 'dinner'])
  meal_type: string;

  @IsString()
  @IsOptional()
  food_id?: string; // Open Food Facts barcode

  @IsString()
  food_name: string;

  @IsNumber()
  @Min(0)
  servings: number;

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
}
