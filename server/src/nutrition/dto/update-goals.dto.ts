import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateGoalsDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  calorie_goal?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  protein_goal?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  carbs_goal?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  fat_goal?: number;
}
