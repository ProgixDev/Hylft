import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export type PostKind = 'standard' | 'progress_milestone';
export type PostPrivacy = 'public' | 'followers' | 'private';

export class PostMediaInputDto {
  @IsString()
  storage_path!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;
}

export class CreatePostDto {
  @IsOptional()
  @IsIn(['standard', 'progress_milestone'])
  kind?: PostKind;

  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;

  @IsIn(['public', 'followers', 'private'])
  privacy!: PostPrivacy;

  @IsOptional()
  @IsUUID()
  weight_entry_id?: string;

  // Free-form metric payload for progress_milestone posts (weight/reps/sets/duration).
  @IsOptional()
  stats?: Record<string, unknown>;

  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => PostMediaInputDto)
  media!: PostMediaInputDto[];
}
