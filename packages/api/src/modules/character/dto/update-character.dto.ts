import { IsString, IsObject, IsOptional } from 'class-validator';

export class UpdateCharacterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  personality?: Record<string, any>;

  @IsObject()
  @IsOptional()
  initialState?: Record<string, any>;

  @IsObject()
  @IsOptional()
  behaviorConfig?: Record<string, any>;
}
