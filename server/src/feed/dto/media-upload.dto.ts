import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SignMediaUploadDto {
  // Number of images the client intends to upload (1-4).
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  count!: number;

  @IsOptional()
  @IsIn(['jpg', 'jpeg', 'png', 'webp', 'heic'])
  ext?: 'jpg' | 'jpeg' | 'png' | 'webp' | 'heic';
}
