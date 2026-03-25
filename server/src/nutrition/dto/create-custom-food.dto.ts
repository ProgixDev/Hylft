import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCustomFoodDto {
  @IsString()
  name: string;

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

  @IsString()
  @IsOptional()
  serving_size?: string;
}
