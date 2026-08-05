import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListExercisesQueryDto {
  @IsOptional()
  @IsString()
  body_part?: string;

  @IsOptional()
  @IsString()
  equipment?: string;

  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string; // last seen exercises.name for stable pagination
}
