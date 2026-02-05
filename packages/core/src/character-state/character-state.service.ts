import { injectable } from 'tsyringe';
import type {
  Character,
  Relationship,
  TriggerRule,
  TriggerTableConfig,
} from '@star-rail/types';
import { createDefaultRelationship } from '@star-rail/types';
import { BehaviorEngine, TriggerEngine } from './behavior-engine.js';

/**
 * 状态变更记录
 */
export interface StateChangeRecord {
  /** 变更时间戳 */
  timestamp: number;
  /** 事件类型 */
  eventType: string;
  /** 变更目标 */
  target: string;
  /** 变更前的值 */
  oldValue: number;
  /** 变更后的值 */
  newValue: number;
  /** 变更原因（规则 ID） */
  ruleId?: string;
  /** 相关人物 ID */
  relatedCharacterId?: string;
}

/**
 * 状态变更事件监听器
 */
export type StateChangeListener = (
  character: Character,
  change: StateChangeRecord
) => void;

/**
 * 人物状态服务
 * 管理人物状态的读写和演化
 */
@injectable()
export class CharacterStateService {
  private triggerRules: TriggerRule[] = [];
  private stateChangeHistory: Map<string, StateChangeRecord[]> = new Map();
  private listeners: StateChangeListener[] = [];

  constructor(
    private behaviorEngine: BehaviorEngine,
    private triggerEngine: TriggerEngine
  ) {}

  /**
   * 加载触发表配置
   * @param config 触发表配置
   */
  loadTriggerTable(config: TriggerTableConfig): void {
    this.triggerRules = [...config.rules].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );
  }

  /**
   * 追加触发规则
   * @param rules 触发规则列表
   */
  appendTriggerRules(rules: TriggerRule[]): void {
    this.triggerRules = [...this.triggerRules, ...rules].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );
  }

  /**
   * 获取已加载的触发规则
   */
  getTriggerRules(): TriggerRule[] {
    return [...this.triggerRules];
  }

  /**
   * 按事件类型获取触发规则
   * @param eventType 事件类型
   */
  getRulesByEventType(eventType: string): TriggerRule[] {
    return this.triggerRules.filter((rule) => rule.eventType === eventType);
  }

  /**
   * 添加状态变更监听器
   * @param listener 监听器函数
   */
  addStateChangeListener(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * 移除状态变更监听器
   * @param listener 监听器函数
   */
  removeStateChangeListener(listener: StateChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 获取人物与另一人物的关系
   * 如果不存在则创建默认关系
   */
  getRelationship(character: Character, targetId: string): Relationship {
    if (!character.state.relationships[targetId]) {
      character.state.relationships[targetId] = createDefaultRelationship();
    }
    return character.state.relationships[targetId];
  }

  /**
   * 更新人物关系
   */
  updateRelationship(
    character: Character,
    targetId: string,
    updates: Partial<Relationship>
  ): void {
    const relationship = this.getRelationship(character, targetId);
    const oldValues: Record<string, number> = {};

    // 记录旧值
    for (const key of Object.keys(updates) as (keyof Relationship)[]) {
      if (key !== 'custom') {
        oldValues[key] = relationship[key] as number;
      }
    }

    // 应用更新
    Object.assign(relationship, updates);

    // 记录变更
    for (const key of Object.keys(updates) as (keyof Relationship)[]) {
      if (key !== 'custom' && oldValues[key] !== undefined) {
        const newValue = relationship[key] as number;
        if (oldValues[key] !== newValue) {
          this.recordStateChange(character, {
            timestamp: Date.now(),
            eventType: 'manual_update',
            target: `relationship.${key}`,
            oldValue: oldValues[key],
            newValue,
            relatedCharacterId: targetId,
          });
        }
      }
    }
  }

  /**
   * 获取人物能力值
   */
  getAbility(character: Character, abilityName: string): number {
    return character.state.abilities[abilityName] || 0;
  }

  /**
   * 更新人物能力值
   */
  updateAbility(
    character: Character,
    abilityName: string,
    value: number
  ): void {
    const oldValue = character.state.abilities[abilityName] || 0;
    const newValue = Math.max(0, Math.min(100, value));
    character.state.abilities[abilityName] = newValue;

    if (oldValue !== newValue) {
      this.recordStateChange(character, {
        timestamp: Date.now(),
        eventType: 'manual_update',
        target: `ability.${abilityName}`,
        oldValue,
        newValue,
      });
    }
  }

  /**
   * 处理事件触发的状态变化
   * 使用已加载的触发规则
   */
  processEvent(
    character: Character,
    eventType: string,
    context: Record<string, unknown> = {}
  ): StateChangeRecord[] {
    return this.processEventWithRules(
      character,
      eventType,
      this.triggerRules,
      context
    );
  }

  /**
   * 处理事件触发的状态变化（使用指定规则）
   */
  processEventWithRules(
    character: Character,
    eventType: string,
    rules: TriggerRule[],
    context: Record<string, unknown> = {}
  ): StateChangeRecord[] {
    const changes: StateChangeRecord[] = [];
    const targetCharacterId = context.targetCharacterId as string | undefined;

    // 获取匹配的规则
    const matchingRules = rules
      .filter((rule) => rule.eventType === eventType)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // 记录变更前的状态
    const beforeState = this.captureRelevantState(
      character,
      matchingRules,
      targetCharacterId
    );

    // 执行触发规则
    this.triggerEngine.executeRules(character, rules, eventType, context);

    // 记录变更后的状态并生成变更记录
    for (const rule of matchingRules) {
      for (const effect of rule.effects) {
        const beforeValue = beforeState.get(effect.target);
        const afterValue = this.getTargetValue(
          character,
          effect.target,
          targetCharacterId
        );

        if (
          beforeValue !== undefined &&
          afterValue !== undefined &&
          beforeValue !== afterValue
        ) {
          const change: StateChangeRecord = {
            timestamp: Date.now(),
            eventType,
            target: effect.target,
            oldValue: beforeValue,
            newValue: afterValue,
            ruleId: rule.id,
            relatedCharacterId: targetCharacterId,
          };
          changes.push(change);
          this.recordStateChange(character, change);
        }
      }
    }

    return changes;
  }

  /**
   * 获取人物的行为倾向
   */
  getBehaviorTendencies(character: Character) {
    return this.behaviorEngine.ensureBehaviorTendencies(character);
  }

  /**
   * 获取人物的状态变更历史
   * @param characterId 人物 ID
   * @param limit 返回记录数量限制
   */
  getStateChangeHistory(
    characterId: string,
    limit?: number
  ): StateChangeRecord[] {
    const history = this.stateChangeHistory.get(characterId) || [];
    if (limit) {
      return history.slice(-limit);
    }
    return [...history];
  }

  /**
   * 清除人物的状态变更历史
   * @param characterId 人物 ID
   */
  clearStateChangeHistory(characterId: string): void {
    this.stateChangeHistory.delete(characterId);
  }

  /**
   * 获取人物状态摘要
   */
  getStateSummary(character: Character): {
    relationshipCount: number;
    abilityCount: number;
    knownInformationCount: number;
    behaviorTendencies: ReturnType<BehaviorEngine['deriveBehaviorTendencies']>;
  } {
    return {
      relationshipCount: Object.keys(character.state.relationships).length,
      abilityCount: Object.keys(character.state.abilities).length,
      knownInformationCount: character.state.knownInformation.length,
      behaviorTendencies: this.getBehaviorTendencies(character),
    };
  }

  /**
   * 记录状态变更
   */
  private recordStateChange(
    character: Character,
    change: StateChangeRecord
  ): void {
    if (!this.stateChangeHistory.has(character.id)) {
      this.stateChangeHistory.set(character.id, []);
    }
    this.stateChangeHistory.get(character.id)!.push(change);

    // 通知监听器
    for (const listener of this.listeners) {
      listener(character, change);
    }
  }

  /**
   * 捕获相关状态的当前值
   */
  private captureRelevantState(
    character: Character,
    rules: TriggerRule[],
    targetCharacterId?: string
  ): Map<string, number> {
    const state = new Map<string, number>();

    for (const rule of rules) {
      for (const effect of rule.effects) {
        const value = this.getTargetValue(
          character,
          effect.target,
          targetCharacterId
        );
        if (value !== undefined) {
          state.set(effect.target, value);
        }
      }
    }

    return state;
  }

  /**
   * 获取目标字段的值
   */
  private getTargetValue(
    character: Character,
    target: string,
    targetCharacterId?: string
  ): number | undefined {
    const parts = target.split('.');

    if (parts[0] === 'relationship' && parts.length >= 2 && targetCharacterId) {
      const dimension = parts[1] as keyof Relationship;
      const relationship = character.state.relationships[targetCharacterId];
      if (relationship && dimension in relationship && dimension !== 'custom') {
        return relationship[dimension] as number;
      }
    } else if (parts[0] === 'ability' && parts.length >= 2) {
      const abilityName = parts[1];
      return character.state.abilities[abilityName] || 0;
    }

    return undefined;
  }
}
