import { injectable } from 'tsyringe';
import type {
  Anchor,
  SessionState,
  ComparisonResult,
  ComparisonDimension,
  AnchorCharacterState,
  ScoringConfig,
  WeightedComparisonResult,
} from '@star-rail/types';
import { generateAnchorId } from '@star-rail/types';
import type { StateSnapshot } from '../story-orchestrator/story-orchestrator.js';

/**
 * 锚点创建选项
 */
export interface CreateAnchorOptions {
  /** 锚点名称 */
  name: string;
  /** 节点 ID */
  nodeId: string;
  /** 剧情线 ID */
  storylineId: string;
  /** 顺序标识 */
  sequence: number;
  /** 锚点描述 */
  description?: string;
  /** 情节描述 */
  plotDescription: string;
  /** 主题标签 */
  themes?: string[];
}

/**
 * 对比选项
 */
export interface CompareOptions {
  /** 是否包含视野对比 */
  includeVision?: boolean;
  /** 是否包含关系对比 */
  includeRelationships?: boolean;
  /** 关系差异阈值（低于此值不报告） */
  relationshipThreshold?: number;
  /** 是否包含判断/决策对比（P2-AE-01） */
  includeJudgment?: boolean;
}

/**
 * 锚点评估器
 * P1-AE-01~02: 锚点数据模型与对比评估
 */
@injectable()
export class AnchorEvaluator {
  /** 锚点存储 */
  private anchors: Map<string, Anchor> = new Map();

  /** 按剧情线索引 */
  private anchorsByStoryline: Map<string, string[]> = new Map();

  /** 评分规则配置（P3-AE-02） */
  private scoringConfig: ScoringConfig | null = null;

  /** 主题配置（P3-AE-01） */
  private themeDefinitions: Map<string, string[]> = new Map();

  // ==================== P3-AE-01 主题一致性评估 ====================

  /**
   * 注册主题定义
   * P3-AE-01: 主题配置与评估维度
   * @param themeId 主题 ID
   * @param keywords 主题关键词列表（用于匹配锚点 themes 标签）
   */
  defineTheme(themeId: string, keywords: string[]): void {
    this.themeDefinitions.set(themeId, keywords);
  }

  /**
   * 评估主题一致性
   * P3-AE-01: 主题一致性得分
   * 比较当前剧情线锚点的主题标签与期望主题的覆盖程度
   * @param storylineId 剧情线 ID
   * @param expectedThemes 期望出现的主题 ID 列表
   * @returns 主题一致性得分 (0-1) 及明细
   */
  evaluateThemeConsistency(
    storylineId: string,
    expectedThemes: string[]
  ): {
    score: number;
    coveredThemes: string[];
    missingThemes: string[];
    details: Array<{
      themeId: string;
      covered: boolean;
      matchedAnchors: string[];
    }>;
  } {
    const anchors = this.getAnchorsByStoryline(storylineId);

    const details: Array<{
      themeId: string;
      covered: boolean;
      matchedAnchors: string[];
    }> = [];
    const coveredThemes: string[] = [];
    const missingThemes: string[] = [];

    for (const themeId of expectedThemes) {
      const keywords = this.themeDefinitions.get(themeId) ?? [themeId];
      // 主题覆盖：锚点 themes 中包含任意关键词即视为覆盖
      const matchedAnchors = anchors
        .filter((a) => (a.themes ?? []).some((tag) => keywords.includes(tag)))
        .map((a) => a.id);

      const covered = matchedAnchors.length > 0;
      details.push({ themeId, covered, matchedAnchors });

      if (covered) {
        coveredThemes.push(themeId);
      } else {
        missingThemes.push(themeId);
      }
    }

    // 额外奖励：锚点中出现了期望主题之外的主题标签（丰富度）
    // 此处仅计算覆盖率，不做额外奖励
    const score =
      expectedThemes.length > 0
        ? coveredThemes.length / expectedThemes.length
        : 1.0;

    // 如果没有锚点，得分为 0（无法评估）
    const finalScore =
      anchors.length === 0 && expectedThemes.length > 0 ? 0 : score;

    return {
      score: Math.min(1, Math.max(0, finalScore)),
      coveredThemes,
      missingThemes,
      details,
    };
  }

  /**
   * 获取剧情线中出现的所有主题标签
   * P3-AE-01: 辅助方法
   */
  getStorylineThemes(storylineId: string): string[] {
    const anchors = this.getAnchorsByStoryline(storylineId);
    const themes = new Set<string>(anchors.flatMap((a) => a.themes ?? []));
    return Array.from(themes);
  }

  // ==================== P3-AE-02 评分规则配置 ====================

  /**
   * 加载评分规则配置
   * P3-AE-02: 贴合度权重与评分规则可配置
   */
  loadScoringConfig(config: ScoringConfig): void {
    this.scoringConfig = config;
  }

  /**
   * 获取当前评分配置
   */
  getScoringConfig(): ScoringConfig | null {
    return this.scoringConfig;
  }

  /**
   * 加权对比：在 compare 基础上计算加权贴合度分数
   * P3-AE-02: 至少 1 条完整剧情线含锚点，对比报告可生成
   * @param session 当前会话状态
   * @param anchor 锚点数据
   * @param options 对比选项
   */
  compareWeighted(
    session: SessionState,
    anchor: Anchor,
    options?: CompareOptions
  ): WeightedComparisonResult {
    const base = this.compare(session, anchor, options);

    const weights = this.scoringConfig?.weights ?? {};
    const visionWeight = weights.vision ?? 1.0;
    const relWeight = weights.relationships ?? 1.0;
    const judgmentWeight = weights.judgment ?? 1.0;

    const lowThreshold = this.scoringConfig?.lowThreshold ?? 0.2;
    const highThreshold = this.scoringConfig?.highThreshold ?? 0.5;

    // 按维度名称分类计算加权得分
    const dimensionScores: WeightedComparisonResult['dimensionScores'] = [];
    let weightedSum = 0;
    let totalWeight = 0;

    for (const dim of base.dimensions) {
      let weight = 1.0;
      if (dim.name.includes('视野')) weight = visionWeight;
      else if (dim.name.includes('信任度') || dim.name.includes('关系'))
        weight = relWeight;
      else if (dim.name.includes('判断')) weight = judgmentWeight;

      const weightedScore = (1 - dim.divergence) * weight;
      dimensionScores.push({
        name: dim.name,
        weight,
        rawDivergence: dim.divergence,
        weightedScore,
      });
      weightedSum += weightedScore;
      totalWeight += weight;
    }

    // 无维度时贴合度为 1（完全一致）
    const fitScore =
      totalWeight > 0
        ? Math.min(1, Math.max(0, weightedSum / totalWeight))
        : 1.0;

    // 根据阈值生成评价（覆盖 base 的 overallAssessment）
    const divergence = 1 - fitScore;
    let overallAssessment = base.overallAssessment;
    if (base.differences.length === 0) {
      overallAssessment = '当前分支与原剧情高度一致，没有明显差异。';
    } else if (divergence < lowThreshold) {
      overallAssessment = `当前分支与原剧情基本一致，贴合度 ${(fitScore * 100).toFixed(1)}%。`;
    } else if (divergence < highThreshold) {
      overallAssessment = `当前分支与原剧情存在一定差异，贴合度 ${(fitScore * 100).toFixed(1)}%。`;
    } else {
      overallAssessment = `当前分支与原剧情差异较大，贴合度 ${(fitScore * 100).toFixed(1)}%。`;
    }

    return {
      ...base,
      overallAssessment,
      fitScore,
      dimensionScores,
    };
  }

  /**
   * 对整条剧情线生成加权对比报告
   * P3-AE-02: 至少 1 条完整剧情线含锚点，对比报告可生成
   */
  compareStorylineWeighted(
    session: SessionState,
    storylineId: string,
    options?: CompareOptions
  ): WeightedComparisonResult[] {
    const anchors = this.getAnchorsByStoryline(storylineId);
    return anchors.map((anchor) =>
      this.compareWeighted(session, anchor, options)
    );
  }

  // ==================== 锚点管理 (P1-AE-01) ====================

  /**
   * 从状态快照创建锚点
   * P1-AE-01: 锚点数据模型与必填字段落地
   * @param snapshot 状态快照
   * @param options 创建选项
   */
  createAnchorFromSnapshot(
    snapshot: StateSnapshot,
    options: CreateAnchorOptions
  ): Anchor {
    const anchor: Anchor = {
      id: generateAnchorId(),
      nodeId: options.nodeId,
      storylineId: options.storylineId,
      sequence: options.sequence,
      name: options.name,
      description: options.description,
      characters: snapshot.characters,
      environmentDescription: snapshot.environmentDescription,
      plotDescription: options.plotDescription,
      themes: options.themes,
      createdAt: Date.now(),
    };

    this.addAnchor(anchor);
    return anchor;
  }

  /**
   * 从会话状态创建锚点
   * @param session 会话状态
   * @param options 创建选项
   */
  createAnchorFromSession(
    session: SessionState,
    options: CreateAnchorOptions
  ): Anchor {
    const characters: AnchorCharacterState[] = Object.values(
      session.characters
    ).map((char) => ({
      characterId: char.id,
      characterName: char.name,
      knownInformationIds: char.state.knownInformation.map(
        (k) => k.informationId
      ),
      relationships: this.extractRelationshipTrust(char.state.relationships),
    }));

    const anchor: Anchor = {
      id: generateAnchorId(),
      nodeId: options.nodeId,
      storylineId: options.storylineId,
      sequence: options.sequence,
      name: options.name,
      description: options.description,
      characters,
      environmentDescription: this.formatEnvironmentDescription(
        session.worldState.environment
      ),
      plotDescription: options.plotDescription,
      themes: options.themes,
      createdAt: Date.now(),
    };

    this.addAnchor(anchor);
    return anchor;
  }

  /**
   * 添加锚点
   * @param anchor 锚点数据
   */
  addAnchor(anchor: Anchor): void {
    this.anchors.set(anchor.id, anchor);

    // 更新剧情线索引
    const storylineAnchors =
      this.anchorsByStoryline.get(anchor.storylineId) || [];
    if (!storylineAnchors.includes(anchor.id)) {
      storylineAnchors.push(anchor.id);
      // 按顺序排序
      storylineAnchors.sort((a, b) => {
        const anchorA = this.anchors.get(a);
        const anchorB = this.anchors.get(b);
        return (anchorA?.sequence || 0) - (anchorB?.sequence || 0);
      });
      this.anchorsByStoryline.set(anchor.storylineId, storylineAnchors);
    }
  }

  /**
   * 获取锚点
   * @param anchorId 锚点 ID
   */
  getAnchor(anchorId: string): Anchor | undefined {
    return this.anchors.get(anchorId);
  }

  /**
   * 获取剧情线的所有锚点
   * @param storylineId 剧情线 ID
   */
  getAnchorsByStoryline(storylineId: string): Anchor[] {
    const anchorIds = this.anchorsByStoryline.get(storylineId) || [];
    return anchorIds
      .map((id) => this.anchors.get(id))
      .filter((a): a is Anchor => a !== undefined);
  }

  /**
   * 获取所有锚点
   */
  getAllAnchors(): Anchor[] {
    return Array.from(this.anchors.values());
  }

  /**
   * 删除锚点
   * @param anchorId 锚点 ID
   */
  removeAnchor(anchorId: string): boolean {
    const anchor = this.anchors.get(anchorId);
    if (!anchor) return false;

    this.anchors.delete(anchorId);

    // 更新剧情线索引
    const storylineAnchors = this.anchorsByStoryline.get(anchor.storylineId);
    if (storylineAnchors) {
      const index = storylineAnchors.indexOf(anchorId);
      if (index !== -1) {
        storylineAnchors.splice(index, 1);
      }
    }

    return true;
  }

  /**
   * 清空所有锚点
   */
  clearAnchors(): void {
    this.anchors.clear();
    this.anchorsByStoryline.clear();
  }

  // ==================== 对比评估 (P1-AE-02) ====================

  /**
   * 对比当前状态与锚点
   * P1-AE-02: 当前分支与锚点的「人物状态+视野」对比与差异说明
   * @param session 当前会话状态
   * @param anchor 锚点数据
   * @param options 对比选项
   */
  compare(
    session: SessionState,
    anchor: Anchor,
    options?: CompareOptions
  ): ComparisonResult {
    const includeVision = options?.includeVision ?? true;
    const includeRelationships = options?.includeRelationships ?? true;
    const relationshipThreshold = options?.relationshipThreshold ?? 0.1;
    const includeJudgment = options?.includeJudgment ?? true;

    const dimensions: ComparisonDimension[] = [];
    const differences: string[] = [];
    let totalDivergence = 0;
    let dimensionCount = 0;

    // 对比每个角色的状态
    for (const anchorChar of anchor.characters) {
      const currentChar = session.characters[anchorChar.characterId];

      if (!currentChar) {
        differences.push(`角色 ${anchorChar.characterName} 在当前分支中不存在`);
        dimensions.push({
          name: `${anchorChar.characterName} 存在性`,
          originalValue: '存在',
          currentValue: '不存在',
          difference: '角色缺失',
          divergence: 1,
        });
        totalDivergence += 1;
        dimensionCount++;
        continue;
      }

      // 对比已知信息（视野）
      if (includeVision) {
        const visionResult = this.compareVision(anchorChar, currentChar);
        if (visionResult.divergence > 0) {
          dimensions.push(visionResult.dimension);
          differences.push(...visionResult.differences);
          totalDivergence += visionResult.divergence;
          dimensionCount++;
        }
      }

      // 对比关系状态
      if (includeRelationships && anchorChar.relationships) {
        const relationshipResults = this.compareRelationships(
          anchorChar,
          currentChar,
          relationshipThreshold
        );
        for (const result of relationshipResults) {
          dimensions.push(result.dimension);
          differences.push(...result.differences);
          totalDivergence += result.divergence;
          dimensionCount++;
        }
      }

      // 对比判断/决策（P2-AE-01）
      if (includeJudgment && anchorChar.judgment) {
        const judgmentResult = this.compareJudgment(anchorChar, currentChar);
        if (judgmentResult) {
          dimensions.push(judgmentResult.dimension);
          differences.push(...judgmentResult.differences);
          totalDivergence += judgmentResult.divergence;
          dimensionCount++;
        }
      }
    }

    // 检查当前分支中多出的角色
    for (const charId of Object.keys(session.characters)) {
      const inAnchor = anchor.characters.some((c) => c.characterId === charId);
      if (!inAnchor) {
        const char = session.characters[charId];
        differences.push(`当前分支多出角色 ${char.name}`);
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

  /**
   * 对比当前状态与状态快照
   * @param session 当前会话状态
   * @param snapshot 状态快照
   * @param options 对比选项
   */
  compareWithSnapshot(
    session: SessionState,
    snapshot: StateSnapshot,
    options?: CompareOptions
  ): ComparisonResult {
    // 将快照转换为临时锚点进行对比
    const tempAnchor: Anchor = {
      id: `temp_${snapshot.snapshotId}`,
      nodeId: snapshot.plotNodeId || 'unknown',
      storylineId: 'temp',
      sequence: snapshot.turn,
      name: `快照 ${snapshot.turn}`,
      characters: snapshot.characters,
      environmentDescription: snapshot.environmentDescription,
      plotDescription: '',
      createdAt: snapshot.timestamp,
    };

    return this.compare(session, tempAnchor, options);
  }

  /**
   * 批量对比多个锚点
   * @param session 当前会话状态
   * @param anchorIds 锚点 ID 列表
   * @param options 对比选项
   */
  compareMultiple(
    session: SessionState,
    anchorIds: string[],
    options?: CompareOptions
  ): ComparisonResult[] {
    return anchorIds
      .map((id) => {
        const anchor = this.anchors.get(id);
        if (!anchor) return null;
        return this.compare(session, anchor, options);
      })
      .filter((r): r is ComparisonResult => r !== null);
  }

  /**
   * 对比剧情线上的所有锚点
   * @param session 当前会话状态
   * @param storylineId 剧情线 ID
   * @param options 对比选项
   */
  compareStoryline(
    session: SessionState,
    storylineId: string,
    options?: CompareOptions
  ): ComparisonResult[] {
    const anchors = this.getAnchorsByStoryline(storylineId);
    return anchors.map((anchor) => this.compare(session, anchor, options));
  }

  // ==================== 私有方法 ====================

  /**
   * 对比视野（已知信息）
   */
  private compareVision(
    anchorChar: AnchorCharacterState,
    currentChar: {
      name: string;
      state: { knownInformation: Array<{ informationId: string }> };
    }
  ): {
    dimension: ComparisonDimension;
    differences: string[];
    divergence: number;
  } {
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

    const differences: string[] = [];
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

    const visionDivergence =
      (missingInfo.length + extraInfo.length) /
      Math.max(anchorKnownIds.size, currentKnownIds.size, 1);

    return {
      dimension: {
        name: `${anchorChar.characterName} 视野`,
        originalValue: `${anchorKnownIds.size} 条信息`,
        currentValue: `${currentKnownIds.size} 条信息`,
        difference: `缺少 ${missingInfo.length} 条，多出 ${extraInfo.length} 条`,
        divergence: Math.min(1, visionDivergence),
      },
      differences,
      divergence: Math.min(1, visionDivergence),
    };
  }

  /**
   * 对比关系状态
   */
  private compareRelationships(
    anchorChar: AnchorCharacterState,
    currentChar: {
      state: {
        relationships: Record<
          string,
          {
            trust: number;
            hostility: number;
            intimacy: number;
            respect: number;
          }
        >;
      };
    },
    threshold: number
  ): Array<{
    dimension: ComparisonDimension;
    differences: string[];
    divergence: number;
  }> {
    const results: Array<{
      dimension: ComparisonDimension;
      differences: string[];
      divergence: number;
    }> = [];

    if (!anchorChar.relationships) return results;

    for (const [targetId, anchorValue] of Object.entries(
      anchorChar.relationships
    )) {
      const currentRelationship = currentChar.state.relationships[targetId];
      if (currentRelationship) {
        const currentValue = currentRelationship.trust;
        const diff = Math.abs(currentValue - anchorValue);

        if (diff > threshold) {
          results.push({
            dimension: {
              name: `${anchorChar.characterName} 对 ${targetId} 的信任度`,
              originalValue: anchorValue,
              currentValue: currentValue,
              difference: `差异 ${(diff * 100).toFixed(1)}%`,
              divergence: diff,
            },
            differences: [
              `${anchorChar.characterName} 对 ${targetId} 的信任度与原剧情差异 ${(diff * 100).toFixed(1)}%`,
            ],
            divergence: diff,
          });
        }
      } else {
        // 关系不存在
        results.push({
          dimension: {
            name: `${anchorChar.characterName} 对 ${targetId} 的关系`,
            originalValue: anchorValue,
            currentValue: '无关系',
            difference: '关系缺失',
            divergence: 1,
          },
          differences: [
            `${anchorChar.characterName} 与 ${targetId} 的关系在当前分支中不存在`,
          ],
          divergence: 1,
        });
      }
    }

    return results;
  }

  /**
   * 提取关系中的信任度
   */
  private extractRelationshipTrust(
    relationships: Record<string, { trust: number }>
  ): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [targetId, rel] of Object.entries(relationships)) {
      result[targetId] = rel.trust;
    }
    return result;
  }

  /**
   * 格式化环境描述
   */
  private formatEnvironmentDescription(environment: {
    physical: { weather?: string; lighting?: string; timeOfDay?: string };
    atmosphere: { tension: number; mood?: string };
  }): string {
    const parts: string[] = [];

    if (environment.physical.weather) {
      parts.push(`天气: ${environment.physical.weather}`);
    }
    if (environment.physical.lighting) {
      parts.push(`光照: ${environment.physical.lighting}`);
    }
    if (environment.physical.timeOfDay) {
      parts.push(`时间: ${environment.physical.timeOfDay}`);
    }
    if (environment.atmosphere.mood) {
      parts.push(`氛围: ${environment.atmosphere.mood}`);
    }
    parts.push(`紧张度: ${(environment.atmosphere.tension * 100).toFixed(0)}%`);

    return parts.join(', ');
  }

  /**
   * 生成总体评价
   */
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

  /**
   * 对比判断/决策维度（P2-AE-01）
   * 比较锚点中记录的角色判断与当前分支的判断
   */
  private compareJudgment(
    anchorChar: AnchorCharacterState,
    currentChar: {
      name: string;
      state: { knownInformation: Array<{ informationId: string }> };
    }
  ): {
    dimension: ComparisonDimension;
    differences: string[];
    divergence: number;
  } | null {
    if (!anchorChar.judgment) return null;

    // 当前分支没有记录判断时，视为完全不同
    // 实际使用中，调用方可在 AnchorCharacterState 中填入当前判断
    const currentJudgment = (currentChar as { judgment?: string }).judgment;

    if (!currentJudgment) {
      return {
        dimension: {
          name: `${anchorChar.characterName} 判断`,
          originalValue: anchorChar.judgment,
          currentValue: '（未记录）',
          difference: '当前分支未记录判断，无法对比',
          divergence: 0,
        },
        differences: [],
        divergence: 0,
      };
    }

    // 简单文本相似度：完全相同则无差异，否则标记为有差异
    const isSame = anchorChar.judgment.trim() === currentJudgment.trim();
    const divergence = isSame ? 0 : 0.5;

    return {
      dimension: {
        name: `${anchorChar.characterName} 判断`,
        originalValue: anchorChar.judgment,
        currentValue: currentJudgment,
        difference: isSame ? '判断一致' : '判断存在差异',
        divergence,
      },
      differences: isSame
        ? []
        : [
            `${anchorChar.characterName} 的判断与原剧情不同：原为「${anchorChar.judgment}」，当前为「${currentJudgment}」`,
          ],
      divergence,
    };
  }
}
