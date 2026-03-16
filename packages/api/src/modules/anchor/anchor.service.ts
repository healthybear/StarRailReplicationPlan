import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateAnchorDto } from './dto/create-anchor.dto';
import { CompareAnchorDto } from './dto/compare-anchor.dto';
import { AnchorResponseDto } from './dto/anchor-response.dto';
import { ComparisonResponseDto } from './dto/comparison-response.dto';
import { ANCHOR_EVALUATOR } from '../../common/providers/core.provider';

/**
 * 锚点服务 - 锚点管理与对比 API
 *
 * 职责：
 * 1. 创建锚点（标记关键剧情节点）
 * 2. 列出会话的所有锚点
 * 3. 获取单个锚点详情
 * 4. 删除锚点
 * 5. 对比锚点（比较不同分支的状态差异）
 *
 * 锚点用途：
 * - 标记关键剧情节点（如重要选择、剧情转折）
 * - 对比不同分支的状态差异（角色关系、已知信息）
 * - 评估剧情分支的影响
 *
 * 与 Core 层的关系：
 * - 依赖注入 AnchorEvaluator（Core 层）
 * - 提供 REST API 接口
 * - 当前使用内存存储（Map），生产环境应使用持久化存储
 *
 * 对应 WBS：P1-SO-02（锚点对比）
 */
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
