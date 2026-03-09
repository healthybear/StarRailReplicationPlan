export class ComparisonResponseDto {
  anchorId: string;
  sessionId: string;
  comparisonResult: {
    summary: string;
    differences: Array<{
      dimension: string;
      anchorValue: unknown;
      currentValue: unknown;
      description: string;
    }>;
    similarity: number;
  };
  comparedAt: Date;
}
