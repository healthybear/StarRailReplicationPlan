import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateAnchorDto } from './dto/create-anchor.dto';
import { CompareAnchorDto } from './dto/compare-anchor.dto';
import { AnchorResponseDto } from './dto/anchor-response.dto';
import { ComparisonResponseDto } from './dto/comparison-response.dto';
import { ANCHOR_EVALUATOR } from '../../common/providers/core.provider';

@Injectable()
export class AnchorService {
  private anchors: Map<string, AnchorResponseDto> = new Map();

  constructor(
    @Inject(ANCHOR_EVALUATOR)
    private readonly anchorEvaluator: unknown,
  ) {}

  async create(createAnchorDto: CreateAnchorDto): Promise<AnchorResponseDto> {
    const anchorId = `anchor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const anchor: AnchorResponseDto = {
      anchorId,
      ...createAnchorDto,
      createdAt: new Date(),
    };

    this.anchors.set(anchorId, anchor);
    return anchor;
  }

  async findAll(sessionId: string): Promise<AnchorResponseDto[]> {
    return Array.from(this.anchors.values()).filter(
      (anchor) => anchor.sessionId === sessionId,
    );
  }

  async findOne(
    sessionId: string,
    anchorId: string,
  ): Promise<AnchorResponseDto> {
    const anchor = this.anchors.get(anchorId);

    if (!anchor || anchor.sessionId !== sessionId) {
      throw new NotFoundException(
        `Anchor with ID ${anchorId} not found in session ${sessionId}`,
      );
    }

    return anchor;
  }

  async remove(sessionId: string, anchorId: string): Promise<void> {
    await this.findOne(sessionId, anchorId);
    this.anchors.delete(anchorId);
  }

  async compare(
    compareAnchorDto: CompareAnchorDto,
  ): Promise<ComparisonResponseDto> {
    const { sessionId, anchorId } = compareAnchorDto;
    await this.findOne(sessionId, anchorId);

    // 模拟对比结果（实际应调用 anchorEvaluator）
    const comparisonResult: ComparisonResponseDto = {
      anchorId,
      sessionId,
      comparisonResult: {
        summary: '当前状态与锚点基本一致',
        differences: [
          {
            dimension: '人物关系',
            anchorValue: { trust: 80 },
            currentValue: { trust: 75 },
            description: '信任度略有下降',
          },
        ],
        similarity: 0.92,
      },
      comparedAt: new Date(),
    };

    return comparisonResult;
  }
}
