import { injectable } from 'tsyringe';
import type {
  BigFiveTraits,
  BehaviorTendencies,
  Character,
  Relationship,
  TriggerRule,
  TriggerEffect,
} from '@star-rail/types';

/**
 * 行为引擎
 * 从人格特质推导行为倾向
 */
@injectable()
export class BehaviorEngine {
  /**
   * 从五大人格推导行为倾向
   * 基于心理学研究的公式
   */
  deriveBehaviorTendencies(traits: BigFiveTraits): BehaviorTendencies {
    return {
      // 探索倾向 = 0.7 × 开放性 + 0.3 × 外向性
      exploration: 0.7 * traits.openness + 0.3 * traits.extraversion,
      // 合作倾向 = 0.7 × 宜人性 + 0.3 × 外向性
      cooperation: 0.7 * traits.agreeableness + 0.3 * traits.extraversion,
      // 谨慎倾向 = 0.6 × 尽责性 + 0.4 × 神经质
      caution: 0.6 * traits.conscientiousness + 0.4 * traits.neuroticism,
      // 冲动倾向 = 0.6 × (1 - 尽责性) + 0.4 × 外向性
      impulsivity:
        0.6 * (1 - traits.conscientiousness) + 0.4 * traits.extraversion,
      // 自信倾向 = 0.7 × 外向性 + 0.3 × (1 - 神经质)
      assertiveness: 0.7 * traits.extraversion + 0.3 * (1 - traits.neuroticism),
    };
  }

  /**
   * 确保人物有行为倾向
   * 如果没有则从人格特质推导
   */
  ensureBehaviorTendencies(character: Character): BehaviorTendencies {
    if (character.personality.behaviorTendencies) {
      return character.personality.behaviorTendencies;
    }
    return this.deriveBehaviorTendencies(character.personality.traits);
  }
}

/**
 * 触发表引擎
 * 执行触发规则，更新人物状态
 */
@injectable()
export class TriggerEngine {
  /**
   * 执行触发规则
   * @param character 人物
   * @param rules 触发规则列表
   * @param eventType 事件类型
   * @param context 事件上下文
   */
  executeRules(
    character: Character,
    rules: TriggerRule[],
    eventType: string,
    context: Record<string, unknown> = {}
  ): void {
    // 筛选匹配的规则
    const matchingRules = rules
      .filter((rule) => rule.eventType === eventType)
      .filter((rule) => this.checkConditions(rule, character, context))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // 执行效果
    for (const rule of matchingRules) {
      for (const effect of rule.effects) {
        this.applyEffect(character, effect, context);
      }
    }
  }

  private checkConditions(
    rule: TriggerRule,
    character: Character,
    context: Record<string, unknown>
  ): boolean {
    if (!rule.conditions || rule.conditions.length === 0) {
      return true;
    }

    return rule.conditions.every((condition) => {
      const value = this.getFieldValue(character, context, condition.field);

      switch (condition.operator) {
        case 'eq':
          return value === condition.value;
        case 'ne':
          return value !== condition.value;
        case 'gt':
          return (
            typeof value === 'number' && value > (condition.value as number)
          );
        case 'gte':
          return (
            typeof value === 'number' && value >= (condition.value as number)
          );
        case 'lt':
          return (
            typeof value === 'number' && value < (condition.value as number)
          );
        case 'lte':
          return (
            typeof value === 'number' && value <= (condition.value as number)
          );
        case 'in':
          return (
            Array.isArray(condition.value) &&
            (condition.value as Array<string | number>).includes(
              value as string | number
            )
          );
        case 'notIn':
          return (
            Array.isArray(condition.value) &&
            !(condition.value as Array<string | number>).includes(
              value as string | number
            )
          );
        default:
          return false;
      }
    });
  }

  private applyEffect(
    character: Character,
    effect: TriggerEffect,
    context: Record<string, unknown>
  ): void {
    const parts = effect.target.split('.');
    const targetCharacterId = context.targetCharacterId as string | undefined;

    if (parts[0] === 'relationship' && parts.length >= 2 && targetCharacterId) {
      const dimension = parts[1] as keyof Relationship;
      const relationship = character.state.relationships[targetCharacterId];

      if (relationship && dimension in relationship) {
        let newValue: number;

        switch (effect.changeType) {
          case 'delta':
            newValue = (relationship[dimension] as number) + effect.value;
            break;
          case 'multiply':
            newValue = (relationship[dimension] as number) * effect.value;
            break;
          case 'set':
            newValue = effect.value;
            break;
        }

        // 应用边界限制
        if (effect.min !== undefined) {
          newValue = Math.max(newValue, effect.min);
        }
        if (effect.max !== undefined) {
          newValue = Math.min(newValue, effect.max);
        }

        // 确保在 0-1 范围内
        newValue = Math.max(0, Math.min(1, newValue));

        (relationship[dimension] as number) = newValue;
      }
    } else if (parts[0] === 'ability' && parts.length >= 2) {
      const abilityName = parts[1];
      const currentValue = character.state.abilities[abilityName] || 0;
      let newValue: number;

      switch (effect.changeType) {
        case 'delta':
          newValue = currentValue + effect.value;
          break;
        case 'multiply':
          newValue = currentValue * effect.value;
          break;
        case 'set':
          newValue = effect.value;
          break;
      }

      // 应用边界限制
      if (effect.min !== undefined) {
        newValue = Math.max(newValue, effect.min);
      }
      if (effect.max !== undefined) {
        newValue = Math.min(newValue, effect.max);
      }

      // 确保在 0-100 范围内
      newValue = Math.max(0, Math.min(100, newValue));

      character.state.abilities[abilityName] = newValue;
    }
  }

  private getFieldValue(
    character: Character,
    context: Record<string, unknown>,
    field: string
  ): unknown {
    const parts = field.split('.');

    if (parts[0] === 'context') {
      return context[parts[1]];
    }

    if (parts[0] === 'character') {
      let value: unknown = character;
      for (let i = 1; i < parts.length; i++) {
        if (value && typeof value === 'object') {
          value = (value as Record<string, unknown>)[parts[i]];
        } else {
          return undefined;
        }
      }
      return value;
    }

    return undefined;
  }
}
