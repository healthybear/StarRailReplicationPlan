export class AnchorResponseDto {
  anchorId: string;
  sessionId: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
