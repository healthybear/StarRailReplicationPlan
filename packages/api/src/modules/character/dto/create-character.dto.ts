import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateCharacterDto {
  @IsString()
  @IsNotEmpty()
  characterId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmpty()
  personality: Record<string, any>;

  @IsObject()
  @IsNotEmpty()
  initialState: Record<string, any>;

  @IsObject()
  @IsOptional()
  behaviorConfig?: Record<string, any>;
}
