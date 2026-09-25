import { IsNumber, IsString, Min } from 'class-validator';

export class UpsertFoodCustomValuesDto {
  @IsString()
  food_id: string;

  @IsString()
  food_name: string;

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
