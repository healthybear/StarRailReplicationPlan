import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 单角色剧情推进 DTO
 */
export class AdvanceDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  userInput: string;

  @IsString()
  @IsNotEmpty()
  characterId: string;

  @IsString()
  @IsNotEmpty()
  sceneId: string;

  @IsString()
  @IsOptional()
  context?: string;
}
