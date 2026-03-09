export class CharacterResponseDto {
  characterId: string;
  name: string;
  personality: Record<string, any>;
  initialState: Record<string, any>;
  behaviorConfig?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
