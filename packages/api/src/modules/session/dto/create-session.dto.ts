import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  sceneId: string;

  @IsArray()
  @IsString({ each: true })
  characterIds: string[];
}
