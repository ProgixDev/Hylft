import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  display_name?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsString()
  @IsOptional()
  fitness_goal?: string;

  @IsString()
  @IsOptional()
  experience_level?: string;

  @IsString()
  @IsOptional()
  @IsIn(['metric', 'imperial'])
  unit_system?: string;

  @IsNumber()
  @IsOptional()
  height_cm?: number;

  @IsNumber()
  @IsOptional()
  weight_kg?: number;

  @IsNumber()
  @IsOptional()
  target_weight_kg?: number;

  @IsString()
  @IsOptional()
  date_of_birth?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsNumber()
  @IsOptional()
  workout_frequency?: number;

  @IsArray()
  @IsOptional()
  focus_areas?: string[];

  @IsBoolean()
  @IsOptional()
  onboarding_completed?: boolean;
}
