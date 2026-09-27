import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewFoodCorrectionDto {
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
