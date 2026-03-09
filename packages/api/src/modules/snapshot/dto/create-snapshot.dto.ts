import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 创建快照 DTO
 */
export class CreateSnapshotDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
