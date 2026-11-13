import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

// Values are per 100 g, same convention as OpenFoodFacts products.
export class CreateUserFoodDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  brand?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  barcode?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  serving_size_g?: number;

  // Public URL returned by POST /nutrition/user-foods/image/sign-upload.
  @IsString()
  @IsOptional()
  @MaxLength(500)
  image_url?: string;

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

  // Optional detailed nutrients per 100 g (sugars, fiber, vitaminC, ...).
  // Unknown keys and invalid values are dropped by the service.
  @IsObject()
  @IsOptional()
  nutrients?: Record<string, number>;
}

/** Detailed nutrient keys accepted in `nutrients` (same names as the app's FoodItem). */
export const USER_FOOD_NUTRIENT_KEYS = [
  'sugars',
  'fiber',
  'polyols',
  'starch',
  'saturatedFat',
  'monounsaturatedFat',
  'polyunsaturatedFat',
  'transFat',
  'cholesterol',
  'salt',
  'potassium',
  'calcium',
  'magnesium',
  'iron',
  'zinc',
  'phosphorus',
  'vitaminA',
  'vitaminB1',
  'vitaminB2',
  'vitaminB3',
  'vitaminB5',
  'vitaminB6',
  'vitaminB7',
  'vitaminB9',
  'vitaminB12',
  'vitaminC',
  'vitaminD',
  'vitaminE',
  'vitaminK',
  'water',
  'alcohol',
  'caffeine',
] as const;
