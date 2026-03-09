import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

/**
 * 多角色剧情推进 DTO
 */
export class AdvanceMultiDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  userInput: string;

  @IsArray()
  @IsString({ each: true })
  characterIds: string[];

  @IsString()
  @IsNotEmpty()
  sceneId: string;

  @IsString()
  @IsOptional()
  context?: string;
}
