import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ListPostsQueryDto {
  @IsOptional()
  @IsIn(['timeline', 'author'])
  scope?: 'timeline' | 'author';

  // Required when scope='author'.
  @IsOptional()
  @IsUUID()
  author_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number;

  // ISO timestamp of the last seen post's created_at; returns rows strictly older.
  @IsOptional()
  @IsString()
  cursor?: string;
}
