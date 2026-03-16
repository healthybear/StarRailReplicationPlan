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
 * 行为引擎 - 人格特质到行为倾向的转换
 *
 * 职责：
 * 1. 基于五大人格模型（Big Five）推导行为倾向
 * 2. 将心理学特质转换为游戏行为参数
 *
 * 五大人格维度：
 * - openness（开放性）：好奇心、想象力、对新体验的接受度
 * - conscientiousness（尽责性）：自律、责任感、目标导向
 * - extraversion（外向性）：社交性、活力、积极情绪
 * - agreeableness（宜人性）：合作性、信任、利他主义
 * - neuroticism（神经质）：情绪不稳定性、焦虑、易怒
 *
 * 行为倾向维度：
 * - exploration（探索倾向）：探索新事物的意愿
 * - cooperation（合作倾向）：与他人合作的意愿
 * - caution（谨慎倾向）：行动前的谨慎程度
 * - impulsivity（冲动倾向）：冲动行事的倾向
 * - assertiveness（自信倾向）：主动表达和行动的倾向
 *
 * 转换公式基于心理学研究，权重经过调优。
 */
@injectable()
export class BehaviorEngine {
  /**
   * 从五大人格推导行为倾向
   *
   * 使用加权公式将人格特质转换为行为倾向。
   * 公式基于心理学研究中人格与行为的相关性。
   *
   * 公式说明：
   * - 探索倾向：主要受开放性影响（70%），外向性辅助（30%）
   * - 合作倾向：主要受宜人性影响（70%），外向性辅助（30%）
   * - 谨慎倾向：尽责性（60%）和神经质（40%）共同作用
   * - 冲动倾向：低尽责性（60%）和高外向性（40%）的组合
   * - 自信倾向：主要受外向性影响（70%），低神经质辅助（30%）
   *
   * @param traits 五大人格特质（每个维度 0-1）
   * @returns 行为倾向（每个维度 0-1）
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
   *
   * 如果角色已有行为倾向配置，直接使用；
   * 否则从五大人格特质自动推导。
   *
   * 用途：
   * - 支持手动配置行为倾向（精确控制）
   * - 支持自动推导（快速创建角色）
   *
   * @param character 角色对象
   * @returns 行为倾向
   */
  ensureBehaviorTendencies(character: Character): BehaviorTendencies {
    if (character.personality.behaviorTendencies) {
      return character.personality.behaviorTendencies;
    }
    return this.deriveBehaviorTendencies(character.personality.traits);
  }
}

/**
 * 触发表引擎 - 基于事件的状态自动变更
 *
 * 职责：
 * 1. 执行触发规则（当特定事件发生时自动触发状态变更）
 * 2. 检查触发条件（条件满足才执行）
 * 3. 应用状态变更效果（关系、能力等）
 *
 * 触发规则示例：
 * ```json
 * {
 *   "eventType": "dialogue",
 *   "conditions": [
 *     { "field": "context.targetCharacterId", "operator": "eq", "value": "char_001" }
 *   ],
 *   "effects": [
 *     { "target": "relationship.trust", "changeType": "delta", "value": 0.05 }
 *   ]
 * }
 * ```
 * 含义：当与 char_001 对话时，信任度 +0.05
 *
 * 支持的变更类型：
 * - delta: 增量变更（当前值 + value）
 * - multiply: 乘法变更（当前值 * value）
 * - set: 直接设置（value）
 *
 * 支持的目标：
 * - relationship.{dimension}: 关系维度（trust, intimacy, hostility, respect）
 * - ability.{name}: 能力值
 */
@injectable()
export class TriggerEngine {
  /**
   * 执行触发规则
   *
   * 流程：
   * 1. 筛选匹配事件类型的规则
   * 2. 检查每个规则的条件是否满足
   * 3. 按优先级排序（高优先级先执行）
   * 4. 应用所有匹配规则的效果
   *
   * @param character 角色对象
   * @param rules 触发规则列表
   * @param eventType 事件类型（如 "dialogue", "action", "scene_advance"）
   * @param context 事件上下文（如 targetCharacterId, sceneId 等）
   */
  executeRules(
    character: Character,
    rules: TriggerRule[],
    eventType: string,
    context: Record<string, unknown> = {}
  ): void {
    // 筛选匹配的规则：事件类型匹配 + 条件满足
    const matchingRules = rules
      .filter((rule) => rule.eventType === eventType)
      .filter((rule) => this.checkConditions(rule, character, context))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // 按优先级降序

    // 执行所有匹配规则的效果
    for (const rule of matchingRules) {
      for (const effect of rule.effects) {
        this.applyEffect(character, effect, context);
      }
    }
  }

  /**
   * 检查触发条件是否满足
   *
   * 条件检查逻辑：
   * - 如果没有条件，默认满足
   * - 所有条件必须同时满足（AND 逻辑）
   *
   * 支持的操作符：
   * - eq: 等于
   * - ne: 不等于
   * - gt: 大于
   * - gte: 大于等于
   * - lt: 小于
   * - lte: 小于等于
   * - in: 在列表中
   * - notIn: 不在列表中
   *
   * @param rule 触发规则
   * @param character 角色对象
   * @param context 事件上下文
   * @returns 是否满足条件
   */
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

  /**
   * 应用状态变更效果
   *
   * 根据效果目标类型，更新角色的不同属性：
   * - relationship.*: 更新与特定角色的关系维度
   * - ability.*: 更新能力值
   *
   * 变更类型：
   * - delta: 增量变更（+value）
   * - multiply: 乘法变更（*value）
   * - set: 直接设置（=value）
   *
   * 边界处理：
   * - 关系维度：限制在 0-1 范围内
   * - 能力值：限制在 0-100 范围内
   * - 支持自定义 min/max 边界
   *
   * @param character 角色对象
   * @param effect 效果配置
   * @param context 事件上下文（需要 targetCharacterId 用于关系更新）
   */
  private applyEffect(
    character: Character,
    effect: TriggerEffect,
    context: Record<string, unknown>
  ): void {
    const parts = effect.target.split('.');
    const targetCharacterId = context.targetCharacterId as string | undefined;

    // 处理关系维度变更
    if (parts[0] === 'relationship' && parts.length >= 2 && targetCharacterId) {
      const dimension = parts[1] as keyof Relationship;
      const relationship = character.state.relationships[targetCharacterId];

      if (relationship && dimension in relationship) {
        let newValue: number;

        // 根据变更类型计算新值
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

        // 应用自定义边界限制
        if (effect.min !== undefined) {
          newValue = Math.max(newValue, effect.min);
        }
        if (effect.max !== undefined) {
          newValue = Math.min(newValue, effect.max);
        }

        // 确保在 0-1 范围内（关系维度的标准范围）
        newValue = Math.max(0, Math.min(1, newValue));

        (relationship[dimension] as number) = newValue;
      }
    }
    // 处理能力值变更
    else if (parts[0] === 'ability' && parts.length >= 2) {
      const abilityName = parts[1];
      const currentValue = character.state.abilities[abilityName] || 0;
      let newValue: number;

      // 根据变更类型计算新值
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

      // 应用自定义边界限制
      if (effect.min !== undefined) {
        newValue = Math.max(newValue, effect.min);
      }
      if (effect.max !== undefined) {
        newValue = Math.min(newValue, effect.max);
      }

      // 确保在 0-100 范围内（能力值的标准范围）
      newValue = Math.max(0, Math.min(100, newValue));

      character.state.abilities[abilityName] = newValue;
    }
  }

  /**
   * 获取字段值
   *
   * 支持从两个来源获取值：
   * - context.*: 从事件上下文获取（如 context.targetCharacterId）
   * - character.*: 从角色对象获取（如 character.state.abilities.combat）
   *
   * 使用点号分隔的路径访问嵌套属性。
   *
   * @param character 角色对象
   * @param context 事件上下文
   * @param field 字段路径（如 "context.targetCharacterId" 或 "character.state.abilities.combat"）
   * @returns 字段值，如果不存在返回 undefined
   */
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
