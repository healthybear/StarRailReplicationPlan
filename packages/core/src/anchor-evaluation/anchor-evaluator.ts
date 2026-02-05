import { injectable } from 'tsyringe';
import type {
  Anchor,
  SessionState,
  ComparisonResult,
  ComparisonDimension,
} from '@star-rail/types';

/**
 * 锚点评估器
 * 对比当前分支与原剧情锚点的差异
 */
@injectable()
export class AnchorEvaluator {
  /**
   * 对比当前状态与锚点
   * @param session 当前会话状态
   * @param anchor 锚点数据
   */
  compare(session: SessionState, anchor: Anchor): ComparisonResult {
    const dimensions: ComparisonDimension[] = [];
    const differences: string[] = [];
    let totalDivergence = 0;
    let dimensionCount = 0;

    // 对比每个角色的状态
    for (const anchorChar of anchor.characters) {
      const currentChar = session.characters[anchorChar.characterId];

      if (!currentChar) {
        differences.push(`角色 ${anchorChar.characterName} 在当前分支中不存在`);
        continue;
      }

      // 对比已知信息
      const currentKnownIds = new Set(
        currentChar.state.knownInformation.map((k) => k.informationId)
      );
      const anchorKnownIds = new Set(anchorChar.knownInformationIds);

      const missingInfo = anchorChar.knownInformationIds.filter(
        (id) => !currentKnownIds.has(id)
      );
      const extraInfo = currentChar.state.knownInformation
        .map((k) => k.informationId)
        .filter((id) => !anchorKnownIds.has(id));

      if (missingInfo.length > 0 || extraInfo.length > 0) {
        const visionDivergence =
          (missingInfo.length + extraInfo.length) /
          Math.max(anchorKnownIds.size, currentKnownIds.size, 1);

        dimensions.push({
          name: `${anchorChar.characterName} 视野`,
          originalValue: `${anchorKnownIds.size} 条信息`,
          currentValue: `${currentKnownIds.size} 条信息`,
          difference: `缺少 ${missingInfo.length} 条，多出 ${extraInfo.length} 条`,
          divergence: Math.min(1, visionDivergence),
        });

        totalDivergence += Math.min(1, visionDivergence);
        dimensionCount++;

        if (missingInfo.length > 0) {
          differences.push(
            `${anchorChar.characterName} 缺少 ${missingInfo.length} 条原剧情中应知道的信息`
          );
        }
        if (extraInfo.length > 0) {
          differences.push(
            `${anchorChar.characterName} 多知道了 ${extraInfo.length} 条原剧情中不应知道的信息`
          );
        }
      }

      // 对比关系状态（如果锚点有记录）
      if (anchorChar.relationships) {
        for (const [targetId, anchorValue] of Object.entries(
          anchorChar.relationships
        )) {
          const currentRelationship = currentChar.state.relationships[targetId];
          if (currentRelationship) {
            // 简化：只比较 trust 维度
            const currentValue = currentRelationship.trust;
            const diff = Math.abs(currentValue - anchorValue);

            if (diff > 0.1) {
              dimensions.push({
                name: `${anchorChar.characterName} 对 ${targetId} 的信任度`,
                originalValue: anchorValue,
                currentValue: currentValue,
                difference: `差异 ${(diff * 100).toFixed(1)}%`,
                divergence: diff,
              });

              totalDivergence += diff;
              dimensionCount++;

              differences.push(
                `${anchorChar.characterName} 对 ${targetId} 的信任度与原剧情差异 ${(diff * 100).toFixed(1)}%`
              );
            }
          }
        }
      }
    }

    const overallDivergence =
      dimensionCount > 0 ? totalDivergence / dimensionCount : 0;

    return {
      anchorId: anchor.id,
      comparedAt: Date.now(),
      overallAssessment: this.generateAssessment(
        overallDivergence,
        differences
      ),
      overallDivergence,
      dimensions,
      differences,
    };
  }

  private generateAssessment(
    divergence: number,
    differences: string[]
  ): string {
    if (differences.length === 0) {
      return '当前分支与原剧情高度一致，没有明显差异。';
    }

    if (divergence < 0.2) {
      return `当前分支与原剧情基本一致，存在 ${differences.length} 处细微差异。`;
    }

    if (divergence < 0.5) {
      return `当前分支与原剧情存在一定差异（${(divergence * 100).toFixed(1)}%），共 ${differences.length} 处不同。`;
    }

    return `当前分支与原剧情差异较大（${(divergence * 100).toFixed(1)}%），共 ${differences.length} 处显著不同。`;
  }
}
