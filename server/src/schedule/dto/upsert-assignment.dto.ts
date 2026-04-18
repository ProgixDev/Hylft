import { IsBoolean, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpsertAssignmentDto {
  @IsBoolean()
  is_rest_day!: boolean;

  // Required when is_rest_day === false.
  @ValidateIf((o: UpsertAssignmentDto) => !o.is_rest_day)
  @IsString()
  @IsOptional()
  routine_id?: string | null;
}
