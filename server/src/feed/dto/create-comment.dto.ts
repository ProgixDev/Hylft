import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body!: string;

  // When provided, the comment is a reply. Only one level of nesting allowed
  // (enforced by DB trigger).
  @IsOptional()
  @IsUUID()
  parent_comment_id?: string;
}
