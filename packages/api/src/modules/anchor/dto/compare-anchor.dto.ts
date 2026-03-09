import { IsString, IsNotEmpty } from 'class-validator';

export class CompareAnchorDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  anchorId: string;
}
