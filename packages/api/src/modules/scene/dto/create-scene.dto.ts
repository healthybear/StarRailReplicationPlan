import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateSceneDto {
  @IsString()
  @IsNotEmpty()
  sceneId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsObject()
  @IsOptional()
  environment?: Record<string, any>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
