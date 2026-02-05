import { injectable } from 'tsyringe';
import type { Character, Relationship, TriggerRule } from '@star-rail/types';
import { createDefaultRelationship } from '@star-rail/types';
import { BehaviorEngine, TriggerEngine } from './behavior-engine.js';

/**
 * 人物状态服务
 * 管理人物状态的读写和演化
 */
@injectable()
export class CharacterStateService {
  constructor(
    private behaviorEngine: BehaviorEngine,
    private triggerEngine: TriggerEngine
  ) {}

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
    Object.assign(relationship, updates);
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
    character.state.abilities[abilityName] = Math.max(0, Math.min(100, value));
  }

  /**
   * 处理事件触发的状态变化
   */
  processEvent(
    character: Character,
    eventType: string,
    rules: TriggerRule[],
    context: Record<string, unknown> = {}
  ): void {
    this.triggerEngine.executeRules(character, rules, eventType, context);
  }

  /**
   * 获取人物的行为倾向
   */
  getBehaviorTendencies(character: Character) {
    return this.behaviorEngine.ensureBehaviorTendencies(character);
  }
}
