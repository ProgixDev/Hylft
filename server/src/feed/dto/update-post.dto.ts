import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { PostPrivacy } from './create-post.dto';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;

  @IsOptional()
  @IsIn(['public', 'followers', 'private'])
  privacy?: PostPrivacy;
}
