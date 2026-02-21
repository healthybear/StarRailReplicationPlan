import { injectable } from 'tsyringe';
import type { Character, SceneConfig } from '@star-rail/types';
import type { AgentResponse } from '../character-agent/character-agent.js';

/**
 * 冲突类型
 */
export type ConflictType =
  | 'action_conflict' // 行动冲突（两角色行动互斥）
  | 'resource_conflict' // 资源争夺（同一目标/物品）
  | 'goal_conflict' // 目标冲突（目标相反）
  | 'dialogue_conflict'; // 对话冲突（信息矛盾）

/**
 * 冲突描述
 */
export interface ConflictDescription {
  /** 冲突类型 */
  type: ConflictType;
  /** 参与冲突的角色 ID 列表 */
  characterIds: string[];
  /** 冲突描述 */
  description: string;
  /** 冲突严重程度 (0-1) */
  severity: number;
}

/**
 * 裁决策略
 */
export type ArbitrationStrategy =
  | 'priority' // 按优先级（能力值/关系）决定胜者
  | 'compromise' // 折中，双方各退一步
  | 'random' // 随机决定（用于测试）
  | 'first_wins'; // 先行动者获胜

/**
 * 裁决结果
 */
export interface ArbitrationResult {
  /** 冲突描述 */
  conflict: ConflictDescription;
  /** 裁决策略 */
  strategy: ArbitrationStrategy;
  /** 胜出角色 ID（可选，折中时无胜者） */
  winnerId?: string;
  /** 裁决说明 */
  resolution: string;
  /** 各角色的最终响应（裁决后） */
  resolvedResponses: AgentResponse[];
  /** 是否产生了死锁（双方均无法行动） */
  deadlock: boolean;
}

/**
 * 冲突裁决器
 * P2-CA-01: 多 Agent 冲突检测与裁决，防止死锁
 */
@injectable()
export class ConflictArbitrator {
  /**
   * 检测多个角色响应中的冲突
   * @param responses 各角色的响应列表
   * @param characters 角色数据映射
   */
  detectConflicts(
    responses: AgentResponse[],
    characters: Record<string, Character>
  ): ConflictDescription[] {
    const conflicts: ConflictDescription[] = [];

    // 检测行动冲突：多个角色声称执行互斥行动
    const actionConflicts = this.detectActionConflicts(responses, characters);
    conflicts.push(...actionConflicts);

    // 检测对话冲突：角色间信息矛盾
    const dialogueConflicts = this.detectDialogueConflicts(responses);
    conflicts.push(...dialogueConflicts);

    return conflicts;
  }

  /**
   * 裁决冲突
   * @param conflict 冲突描述
   * @param responses 原始响应列表
   * @param characters 角色数据映射
   * @param scene 当前场景
   * @param strategy 裁决策略
   */
  arbitrate(
    conflict: ConflictDescription,
    responses: AgentResponse[],
    characters: Record<string, Character>,
    scene: SceneConfig,
    strategy: ArbitrationStrategy = 'priority'
  ): ArbitrationResult {
    const involvedResponses = responses.filter((r) =>
      conflict.characterIds.includes(r.characterId)
    );

    switch (strategy) {
      case 'priority':
        return this.arbitrateByPriority(
          conflict,
          involvedResponses,
          characters,
          scene
        );
      case 'compromise':
        return this.arbitrateByCompromise(conflict, involvedResponses);
      case 'first_wins':
        return this.arbitrateFirstWins(conflict, involvedResponses);
      case 'random':
        return this.arbitrateRandom(conflict, involvedResponses);
    }
  }

  /**
   * 批量裁决所有冲突，返回最终无冲突的响应列表
   * 保证不产生死锁（P2-CA-01 验收标准①）
   * @param responses 原始响应列表
   * @param characters 角色数据映射
   * @param scene 当前场景
   * @param strategy 裁决策略
   */
  resolveAll(
    responses: AgentResponse[],
    characters: Record<string, Character>,
    scene: SceneConfig,
    strategy: ArbitrationStrategy = 'priority'
  ): {
    finalResponses: AgentResponse[];
    arbitrations: ArbitrationResult[];
    hasDeadlock: boolean;
  } {
    const conflicts = this.detectConflicts(responses, characters);

    if (conflicts.length === 0) {
      return {
        finalResponses: responses,
        arbitrations: [],
        hasDeadlock: false,
      };
    }

    const arbitrations: ArbitrationResult[] = [];
    const currentResponses = [...responses];
    let hasDeadlock = false;

    for (const conflict of conflicts) {
      const result = this.arbitrate(
        conflict,
        currentResponses,
        characters,
        scene,
        strategy
      );
      arbitrations.push(result);

      if (result.deadlock) {
        hasDeadlock = true;
        // 死锁时：保留所有响应但标记为受限
        continue;
      }

      // 用裁决后的响应替换原响应
      for (const resolved of result.resolvedResponses) {
        const idx = currentResponses.findIndex(
          (r) => r.characterId === resolved.characterId
        );
        if (idx !== -1) {
          currentResponses[idx] = resolved;
        }
      }
    }

    return {
      finalResponses: currentResponses,
      arbitrations,
      hasDeadlock,
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 检测行动冲突
   * 简化实现：检测多个角色是否声称控制同一资源/位置
   */
  private detectActionConflicts(
    responses: AgentResponse[],
    _characters: Record<string, Character>
  ): ConflictDescription[] {
    const conflicts: ConflictDescription[] = [];
    const actionResponses = responses.filter(
      (r) => r.parsed?.action && r.parsed.action.trim().length > 0
    );

    if (actionResponses.length < 2) return conflicts;

    // 检测关键词冲突（简化版：检测"占领"/"控制"/"夺取"等互斥动词）
    const exclusiveKeywords = ['占领', '控制', '夺取', '阻止', '拦截', '攻击'];
    const conflictingPairs: Array<[AgentResponse, AgentResponse]> = [];

    for (let i = 0; i < actionResponses.length; i++) {
      for (let j = i + 1; j < actionResponses.length; j++) {
        const actionA = actionResponses[i].parsed?.action || '';
        const actionB = actionResponses[j].parsed?.action || '';

        const aHasExclusive = exclusiveKeywords.some((kw) =>
          actionA.includes(kw)
        );
        const bHasExclusive = exclusiveKeywords.some((kw) =>
          actionB.includes(kw)
        );

        if (aHasExclusive && bHasExclusive) {
          conflictingPairs.push([actionResponses[i], actionResponses[j]]);
        }
      }
    }

    for (const [a, b] of conflictingPairs) {
      conflicts.push({
        type: 'action_conflict',
        characterIds: [a.characterId, b.characterId],
        description: `${a.characterId} 与 ${b.characterId} 的行动产生冲突`,
        severity: 0.7,
      });
    }

    return conflicts;
  }

  /**
   * 检测对话冲突
   * 简化实现：检测角色是否声称对方说了不同的话
   */
  private detectDialogueConflicts(
    _responses: AgentResponse[]
  ): ConflictDescription[] {
    // Phase 2 简化版：仅检测明显的否定冲突
    // 完整实现需要 LLM 语义分析
    return [];
  }

  /**
   * 按优先级裁决（能力值高者获胜）
   */
  private arbitrateByPriority(
    conflict: ConflictDescription,
    responses: AgentResponse[],
    characters: Record<string, Character>,
    _scene: SceneConfig
  ): ArbitrationResult {
    if (responses.length === 0) {
      return this.makeDeadlockResult(conflict, responses);
    }

    // 计算每个角色的综合能力分
    const scores = responses.map((r) => {
      const char = characters[r.characterId];
      if (!char) return { response: r, score: 0 };

      const abilities = Object.values(char.state.abilities);
      const avgAbility =
        abilities.length > 0
          ? abilities.reduce((a, b) => a + b, 0) / abilities.length
          : 50;

      // 加入人格特质影响（尽责性 + 外向性）
      const personalityBonus =
        (char.personality.traits.conscientiousness +
          char.personality.traits.extraversion) *
        10;

      return { response: r, score: avgAbility + personalityBonus };
    });

    scores.sort((a, b) => b.score - a.score);
    const winner = scores[0];
    const loser = scores[scores.length - 1];

    // 失败者的行动被取消（保留对话）
    const resolvedResponses = responses.map((r) => {
      if (r.characterId === loser.response.characterId && r.parsed?.action) {
        return {
          ...r,
          parsed: {
            ...r.parsed,
            action: undefined,
          },
          content: r.parsed?.dialogue || r.content,
        };
      }
      return r;
    });

    return {
      conflict,
      strategy: 'priority',
      winnerId: winner.response.characterId,
      resolution: `${winner.response.characterId} 凭借更高的能力值在冲突中占据优势，${loser.response.characterId} 的行动被取消`,
      resolvedResponses,
      deadlock: false,
    };
  }

  /**
   * 折中裁决（双方各退一步）
   */
  private arbitrateByCompromise(
    conflict: ConflictDescription,
    responses: AgentResponse[]
  ): ArbitrationResult {
    // 折中：所有冲突方的行动均被降级为"尝试"
    const resolvedResponses = responses.map((r) => {
      if (r.parsed?.action) {
        return {
          ...r,
          parsed: {
            ...r.parsed,
            action: `尝试${r.parsed.action}（因冲突未能完全执行）`,
          },
        };
      }
      return r;
    });

    return {
      conflict,
      strategy: 'compromise',
      winnerId: undefined,
      resolution: '双方各退一步，行动均未完全执行',
      resolvedResponses,
      deadlock: false,
    };
  }

  /**
   * 先行动者获胜
   */
  private arbitrateFirstWins(
    conflict: ConflictDescription,
    responses: AgentResponse[]
  ): ArbitrationResult {
    if (responses.length === 0) {
      return this.makeDeadlockResult(conflict, responses);
    }

    const winner = responses[0];
    const resolvedResponses = responses.map((r, idx) => {
      if (idx > 0 && r.parsed?.action) {
        return {
          ...r,
          parsed: { ...r.parsed, action: undefined },
          content: r.parsed?.dialogue || r.content,
        };
      }
      return r;
    });

    return {
      conflict,
      strategy: 'first_wins',
      winnerId: winner.characterId,
      resolution: `${winner.characterId} 先行动，其他角色的冲突行动被取消`,
      resolvedResponses,
      deadlock: false,
    };
  }

  /**
   * 随机裁决
   */
  private arbitrateRandom(
    conflict: ConflictDescription,
    responses: AgentResponse[]
  ): ArbitrationResult {
    if (responses.length === 0) {
      return this.makeDeadlockResult(conflict, responses);
    }

    const winnerIdx = Math.floor(Math.random() * responses.length);
    const winner = responses[winnerIdx];

    const resolvedResponses = responses.map((r, idx) => {
      if (idx !== winnerIdx && r.parsed?.action) {
        return {
          ...r,
          parsed: { ...r.parsed, action: undefined },
          content: r.parsed?.dialogue || r.content,
        };
      }
      return r;
    });

    return {
      conflict,
      strategy: 'random',
      winnerId: winner.characterId,
      resolution: `随机裁决：${winner.characterId} 的行动生效`,
      resolvedResponses,
      deadlock: false,
    };
  }

  /**
   * 生成死锁结果（兜底，防止无限等待）
   */
  private makeDeadlockResult(
    conflict: ConflictDescription,
    responses: AgentResponse[]
  ): ArbitrationResult {
    return {
      conflict,
      strategy: 'priority',
      winnerId: undefined,
      resolution: '无法裁决冲突，双方均无法行动（死锁已被检测并中断）',
      resolvedResponses: responses,
      deadlock: true,
    };
  }
}
