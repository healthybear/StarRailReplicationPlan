import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 双角色剧情推进 DTO
 */
export class AdvanceDualDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  userInput: string;

  @IsString()
  @IsNotEmpty()
  characterId1: string;

  @IsString()
  @IsNotEmpty()
  characterId2: string;

  @IsString()
  @IsNotEmpty()
  sceneId: string;

  @IsString()
  @IsOptional()
  context?: string;
}
