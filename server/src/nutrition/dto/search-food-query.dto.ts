import { IsString, IsOptional, IsIn } from 'class-validator';

export class SearchFoodQueryDto {
  @IsString()
  q: string;

  @IsOptional()
  @IsIn(['fr', 'en'])
  lang?: 'fr' | 'en';
}
