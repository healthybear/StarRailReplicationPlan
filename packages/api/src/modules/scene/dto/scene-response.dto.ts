export class SceneResponseDto {
  sceneId: string;
  name: string;
  description: string;
  environment?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
