import { injectable, inject } from 'tsyringe';
import type {
  Information,
  InformationStore,
  InformationSource,
  InformationAttributionRule,
  InformationAttributionConfig,
  EventRecord,
  KnownInformationRef,
  InferenceRule,
  ForgetRule,
  FuzzyRule,
  InformationRulesConfig,
} from '@star-rail/types';
import { generateInformationId } from '@star-rail/types';
import type { StorageAdapter } from '@star-rail/infrastructure';

/**
 * 事件上下文
 * 用于信息归属规则的判断
 */
export interface EventContext {
  /** 事件记录 */
  event: EventRecord;
  /** 参与者 ID 列表 */
  participants: string[];
  /** 在场人物 ID 列表（包括参与者和旁观者） */
  presentCharacters: string[];
  /** 当前场景 ID */
  sceneId: string;
  /** 额外上下文数据 */
  extra?: Record<string, unknown>;
}

/**
 * 信息归属结果
 */
export interface AttributionResult {
  /** 信息 ID */
  informationId: string;
  /** 被归属的人物 ID 列表 */
  attributedTo: string[];
  /** 信息来源类型 */
  sourceType: InformationSource;
  /** 置信度 */
  confidence: number;
}

/**
 * 视野管理器 - 信息可见性与归属管理系统
 *
 * 职责：
 * 1. 管理全局信息库和各角色的已知信息
 * 2. 实现信息归属规则（目睹/听闻/被告知）
 * 3. 支持推理规则（基于已知信息推导新信息）
 * 4. 支持遗忘规则（移除过时或不重要的信息）
 * 5. 支持模糊规则（降低信息置信度）
 * 6. 提供信息差异分析（用于双角色对话）
 *
 * 核心原则：
 * - 信息隔离：每个角色只能访问自己已知的信息
 * - 规则驱动：通过配置规则控制信息传播
 * - 置信度管理：信息可能随时间衰减或模糊
 *
 * 对应 WBS：P1-VM-01（视野过滤）、P1-VM-02（信息归属）、P2-VM-01（推理规则）、P2-VM-02（遗忘规则）、P2-VM-03（模糊规则）
 */
@injectable()
export class VisionManager {
  private attributionRules: InformationAttributionRule[] = [];
  private inferenceRules: InferenceRule[] = [];
  private forgetRules: ForgetRule[] = [];
  private fuzzyRules: FuzzyRule[] = [];

  constructor(@inject('StorageAdapter') private storage: StorageAdapter) {}

  /**
   * 加载信息归属规则配置
   * @param config 信息归属配置
   */
  loadAttributionRules(config: InformationAttributionConfig): void {
    this.attributionRules = [...config.rules].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );
  }

  /**
   * 获取人物的过滤后视野
   *
   * 这是视野管理的核心方法，返回角色已知的信息子集。
   * 用于在调用 LLM 前过滤掉角色不应知道的信息，确保信息隔离。
   *
   * P1-VM-01: 视野过滤
   *
   * @param characterId 人物 ID
   * @param informationStore 信息库
   * @returns 角色已知的信息列表
   */
  getFilteredVision(
    characterId: string,
    informationStore: InformationStore
  ): Information[] {
    const knownIds = informationStore.byCharacter[characterId] || [];
    return informationStore.global.filter((info) => knownIds.includes(info.id));
  }

  /**
   * 获取人物的已知信息引用列表（含置信度和获取时间）
   * @param characterId 人物 ID
   * @param informationStore 信息库
   */
  getKnownInformationRefs(
    characterId: string,
    informationStore: InformationStore
  ): KnownInformationRef[] {
    const knownIds = informationStore.byCharacter[characterId] || [];
    const infos = informationStore.global.filter((info) =>
      knownIds.includes(info.id)
    );

    return infos.map((info) => ({
      informationId: info.id,
      acquiredAt: info.timestamp,
      confidence: 1.0,
    }));
  }

  /**
   * 添加信息到全局信息库
   * @param informationStore 信息库
   * @param info 信息内容（不含 ID）
   */
  addGlobalInformation(
    informationStore: InformationStore,
    info: Omit<Information, 'id'>
  ): Information {
    const newInfo: Information = {
      ...info,
      id: generateInformationId(),
    };
    informationStore.global.push(newInfo);
    return newInfo;
  }

  /**
   * 将信息归属给人物
   * @param informationStore 信息库
   * @param characterId 人物 ID
   * @param informationId 信息 ID
   */
  assignInformationToCharacter(
    informationStore: InformationStore,
    characterId: string,
    informationId: string
  ): void {
    if (!informationStore.byCharacter[characterId]) {
      informationStore.byCharacter[characterId] = [];
    }

    if (!informationStore.byCharacter[characterId].includes(informationId)) {
      informationStore.byCharacter[characterId].push(informationId);
    }
  }

  /**
   * 批量归属信息给在场人物
   * @param informationStore 信息库
   * @param characterIds 人物 ID 列表
   * @param informationId 信息 ID
   */
  assignInformationToCharacters(
    informationStore: InformationStore,
    characterIds: string[],
    informationId: string
  ): void {
    for (const characterId of characterIds) {
      this.assignInformationToCharacter(
        informationStore,
        characterId,
        informationId
      );
    }
  }

  /**
   * 检查人物是否知道某信息
   * @param informationStore 信息库
   * @param characterId 人物 ID
   * @param informationId 信息 ID
   */
  characterKnowsInformation(
    informationStore: InformationStore,
    characterId: string,
    informationId: string
  ): boolean {
    const knownIds = informationStore.byCharacter[characterId] || [];
    return knownIds.includes(informationId);
  }

  /**
   * 基于事件处理信息归属
   *
   * 根据事件类型和归属规则，将信息分配给相关人物。
   * 这是信息传播的核心机制。
   *
   * 流程：
   * 1. 查找匹配的归属规则（基于事件类型和条件）
   * 2. 如果没有匹配规则，使用默认行为（所有在场人物获得信息）
   * 3. 应用规则，将信息归属给目标人物
   *
   * P1-VM-02: 信息归属
   *
   * @param informationStore 信息库
   * @param context 事件上下文（事件、参与者、在场人物、场景）
   * @param informationContent 信息内容
   * @returns 归属结果，包含信息 ID、归属对象、来源类型、置信度
   */
  processEventAttribution(
    informationStore: InformationStore,
    context: EventContext,
    informationContent: string
  ): AttributionResult | null {
    const rule = this.findMatchingRule(context);

    if (!rule) {
      // 没有匹配的规则，使用默认行为：所有参与者获得信息
      return this.applyDefaultAttribution(
        informationStore,
        context,
        informationContent
      );
    }

    return this.applyAttributionRule(
      informationStore,
      context,
      informationContent,
      rule
    );
  }

  /**
   * 目睹事件 - 在场人物获得信息
   * @param informationStore 信息库
   * @param context 事件上下文
   * @param informationContent 信息内容
   */
  witnessEvent(
    informationStore: InformationStore,
    context: EventContext,
    informationContent: string
  ): AttributionResult {
    const info = this.addGlobalInformation(informationStore, {
      content: informationContent,
      source: 'witnessed',
      timestamp: Date.now(),
      sceneId: context.sceneId,
      relatedEventId: context.event.eventId,
    });

    this.assignInformationToCharacters(
      informationStore,
      context.presentCharacters,
      info.id
    );

    return {
      informationId: info.id,
      attributedTo: context.presentCharacters,
      sourceType: 'witnessed',
      confidence: 1.0,
    };
  }

  /**
   * 听闻事件 - 在场人物通过听觉获得信息
   * @param informationStore 信息库
   * @param context 事件上下文
   * @param informationContent 信息内容
   * @param hearers 听到信息的人物 ID 列表（可选，默认为在场人物）
   */
  hearEvent(
    informationStore: InformationStore,
    context: EventContext,
    informationContent: string,
    hearers?: string[]
  ): AttributionResult {
    const info = this.addGlobalInformation(informationStore, {
      content: informationContent,
      source: 'heard',
      timestamp: Date.now(),
      sceneId: context.sceneId,
      relatedEventId: context.event.eventId,
    });

    const targetCharacters = hearers || context.presentCharacters;
    this.assignInformationToCharacters(
      informationStore,
      targetCharacters,
      info.id
    );

    return {
      informationId: info.id,
      attributedTo: targetCharacters,
      sourceType: 'heard',
      confidence: 0.9,
    };
  }

  /**
   * 被告知 - 特定人物被告知信息
   * @param informationStore 信息库
   * @param context 事件上下文
   * @param informationContent 信息内容
   * @param teller 告知者 ID
   * @param recipients 被告知者 ID 列表
   */
  tellInformation(
    informationStore: InformationStore,
    context: EventContext,
    informationContent: string,
    teller: string,
    recipients: string[]
  ): AttributionResult {
    const info = this.addGlobalInformation(informationStore, {
      content: informationContent,
      source: 'told',
      timestamp: Date.now(),
      sceneId: context.sceneId,
      relatedEventId: context.event.eventId,
    });

    // 告知者和被告知者都获得信息
    const allRecipients = [teller, ...recipients].filter(
      (id, index, arr) => arr.indexOf(id) === index
    );
    this.assignInformationToCharacters(
      informationStore,
      allRecipients,
      info.id
    );

    return {
      informationId: info.id,
      attributedTo: allRecipients,
      sourceType: 'told',
      confidence: 0.95,
    };
  }

  /**
   * 查找匹配的归属规则
   */
  private findMatchingRule(
    context: EventContext
  ): InformationAttributionRule | null {
    for (const rule of this.attributionRules) {
      if (rule.eventType !== context.event.eventId.split('_')[0]) {
        continue;
      }

      if (rule.conditions && !this.checkConditions(rule.conditions, context)) {
        continue;
      }

      return rule;
    }
    return null;
  }

  /**
   * 检查条件是否满足
   */
  private checkConditions(
    conditions: Array<{
      field: string;
      operator: string;
      value: string | number | string[];
    }>,
    context: EventContext
  ): boolean {
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(condition.field, context);
      if (
        !this.evaluateCondition(fieldValue, condition.operator, condition.value)
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * 获取字段值
   */
  private getFieldValue(field: string, context: EventContext): unknown {
    const parts = field.split('.');
    let value: unknown = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * 评估条件
   */
  private evaluateCondition(
    fieldValue: unknown,
    operator: string,
    conditionValue: string | number | string[]
  ): boolean {
    switch (operator) {
      case 'eq':
        return fieldValue === conditionValue;
      case 'ne':
        return fieldValue !== conditionValue;
      case 'gt':
        return (
          typeof fieldValue === 'number' &&
          typeof conditionValue === 'number' &&
          fieldValue > conditionValue
        );
      case 'gte':
        return (
          typeof fieldValue === 'number' &&
          typeof conditionValue === 'number' &&
          fieldValue >= conditionValue
        );
      case 'lt':
        return (
          typeof fieldValue === 'number' &&
          typeof conditionValue === 'number' &&
          fieldValue < conditionValue
        );
      case 'lte':
        return (
          typeof fieldValue === 'number' &&
          typeof conditionValue === 'number' &&
          fieldValue <= conditionValue
        );
      case 'in':
        return (
          Array.isArray(conditionValue) &&
          conditionValue.includes(fieldValue as string)
        );
      case 'notIn':
        return (
          Array.isArray(conditionValue) &&
          !conditionValue.includes(fieldValue as string)
        );
      default:
        return false;
    }
  }

  /**
   * 应用默认归属规则
   */
  private applyDefaultAttribution(
    informationStore: InformationStore,
    context: EventContext,
    informationContent: string
  ): AttributionResult {
    return this.witnessEvent(informationStore, context, informationContent);
  }

  /**
   * 应用归属规则
   */
  private applyAttributionRule(
    informationStore: InformationStore,
    context: EventContext,
    informationContent: string,
    rule: InformationAttributionRule
  ): AttributionResult {
    const info = this.addGlobalInformation(informationStore, {
      content: informationContent,
      source: rule.sourceType,
      timestamp: Date.now(),
      sceneId: context.sceneId,
      relatedEventId: context.event.eventId,
    });

    let targetCharacters: string[];

    switch (rule.attributionTarget) {
      case 'participants':
        targetCharacters = context.participants;
        break;
      case 'witnesses':
        targetCharacters = context.presentCharacters.filter(
          (id) => !context.participants.includes(id)
        );
        break;
      case 'all_present':
        targetCharacters = context.presentCharacters;
        break;
      case 'specific':
        // 从条件中提取特定人物（需要在条件中定义）
        targetCharacters = context.participants;
        break;
      default:
        targetCharacters = context.participants;
    }

    this.assignInformationToCharacters(
      informationStore,
      targetCharacters,
      info.id
    );

    return {
      informationId: info.id,
      attributedTo: targetCharacters,
      sourceType: rule.sourceType,
      confidence: rule.confidence || 1.0,
    };
  }

  /**
   * 获取两个人物之间的信息差异
   * @param informationStore 信息库
   * @param characterA 人物 A ID
   * @param characterB 人物 B ID
   */
  getInformationDifference(
    informationStore: InformationStore,
    characterA: string,
    characterB: string
  ): {
    onlyA: Information[];
    onlyB: Information[];
    shared: Information[];
  } {
    const knownByA = new Set(informationStore.byCharacter[characterA] || []);
    const knownByB = new Set(informationStore.byCharacter[characterB] || []);

    const onlyAIds = [...knownByA].filter((id) => !knownByB.has(id));
    const onlyBIds = [...knownByB].filter((id) => !knownByA.has(id));
    const sharedIds = [...knownByA].filter((id) => knownByB.has(id));

    return {
      onlyA: informationStore.global.filter((info) =>
        onlyAIds.includes(info.id)
      ),
      onlyB: informationStore.global.filter((info) =>
        onlyBIds.includes(info.id)
      ),
      shared: informationStore.global.filter((info) =>
        sharedIds.includes(info.id)
      ),
    };
  }

  /**
   * 加载信息规则配置（推理/遗忘/模糊）
   */
  loadInformationRules(config: InformationRulesConfig): void {
    this.inferenceRules = [...(config.inferenceRules ?? [])].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
    this.forgetRules = [...(config.forgetRules ?? [])];
    this.fuzzyRules = [...(config.fuzzyRules ?? [])];
  }

  /**
   * 应用推理规则
   *
   * 基于角色已知信息的标签，自动推导出新信息。
   * 例如：如果角色知道"A 是 B 的朋友"和"B 是 C 的朋友"，可以推理出"A 可能认识 C"。
   *
   * 推理条件：
   * 1. 角色已知信息包含所有前提标签
   * 2. 推理结论尚未存在（避免重复）
   *
   * P2-VM-01: 推理规则
   *
   * @param informationStore 信息库
   * @param characterId 角色 ID
   * @param sceneId 当前场景 ID
   * @param now 当前时间戳
   * @returns 新增的推理信息列表
   */
  applyInference(
    informationStore: InformationStore,
    characterId: string,
    sceneId: string,
    now = Date.now()
  ): Information[] {
    if (this.inferenceRules.length === 0) return [];

    // 获取角色已知信息的所有标签
    const knownIds = new Set(informationStore.byCharacter[characterId] ?? []);
    const knownInfos = informationStore.global.filter((i) =>
      knownIds.has(i.id)
    );
    const knownTags = new Set(knownInfos.flatMap((i) => i.tags ?? []));

    const added: Information[] = [];

    // 遍历推理规则，检查前提是否满足
    for (const rule of this.inferenceRules) {
      // 检查前提标签是否全部满足
      if (!rule.premiseTags.every((tag) => knownTags.has(tag))) continue;

      // 避免重复推理（内容相同的信息已存在）
      const alreadyExists = informationStore.global.some(
        (i) =>
          i.content === rule.conclusionTemplate &&
          i.source === 'inferred' &&
          knownIds.has(i.id)
      );
      if (alreadyExists) continue;

      // 创建推理信息并归属给角色
      const info = this.addGlobalInformation(informationStore, {
        content: rule.conclusionTemplate,
        source: 'inferred' as const,
        timestamp: now,
        sceneId,
        tags: ['inferred', ...rule.premiseTags], // 保留前提标签，用于后续推理
      });
      this.assignInformationToCharacter(informationStore, characterId, info.id);
      added.push(info);
    }

    return added;
  }

  /**
   * 应用遗忘规则
   *
   * 从角色的已知信息中移除满足遗忘条件的信息。
   * 用于模拟记忆衰退、信息过时等情况。
   *
   * 遗忘条件：
   * 1. 信息年龄超过阈值（maxAgeMs）
   * 2. 信息包含特定标签（targetTags）
   * 3. 关键记忆（isKeyMemory）默认不会被遗忘
   *
   * P2-VM-02: 遗忘规则
   *
   * @param informationStore 信息库
   * @param characterId 角色 ID
   * @param now 当前时间戳
   * @returns 被遗忘的信息 ID 列表
   */
  applyForgetting(
    informationStore: InformationStore,
    characterId: string,
    now = Date.now()
  ): string[] {
    if (this.forgetRules.length === 0) return [];

    const knownIds = informationStore.byCharacter[characterId];
    if (!knownIds || knownIds.length === 0) return [];

    const forgotten: string[] = [];

    for (const rule of this.forgetRules) {
      const preserveKey = rule.preserveKeyMemory !== false;

      const toForget = knownIds.filter((id) => {
        const info = informationStore.global.find((i) => i.id === id);
        if (!info) return false;
        if (preserveKey && info.isKeyMemory) return false;

        const ageMs = now - info.timestamp;

        // 按时间遗忘
        if (rule.maxAgeMs !== undefined && rule.maxAgeMs > 0) {
          if (ageMs < rule.maxAgeMs) return false;
        }

        // 按标签遗忘
        if (rule.targetTags && rule.targetTags.length > 0) {
          const infoTags = info.tags ?? [];
          if (!rule.targetTags.some((t) => infoTags.includes(t))) return false;
        }

        return true;
      });

      forgotten.push(...toForget);
    }

    // 去重并从角色已知列表中移除
    const uniqueForgotten = [...new Set(forgotten)];
    informationStore.byCharacter[characterId] = knownIds.filter(
      (id) => !uniqueForgotten.includes(id)
    );

    return uniqueForgotten;
  }

  /**
   * 应用模糊规则
   *
   * 更新角色已知信息的置信度（降低）。
   * 用于模拟记忆模糊、信息不确定性增加等情况。
   *
   * 模糊条件：
   * 1. 信息来源类型匹配（sourceTypes）
   * 2. 信息包含特定标签（targetTags）
   * 3. 信息年龄超过阈值（afterAgeMs）
   *
   * 置信度衰减：confidence *= decayFactor（例如 0.9 表示每次衰减 10%）
   *
   * P2-VM-03: 模糊规则
   *
   * 注意：置信度存储在 KnownInformationRef 中，此方法返回需要更新的引用列表
   *
   * @param informationStore 信息库
   * @param characterId 角色 ID
   * @param currentRefs 当前的已知信息引用列表
   * @param now 当前时间戳
   * @returns 更新后的 KnownInformationRef 列表（仅包含被模糊的条目）
   */
  applyFuzzy(
    informationStore: InformationStore,
    characterId: string,
    currentRefs: KnownInformationRef[],
    now = Date.now()
  ): KnownInformationRef[] {
    if (this.fuzzyRules.length === 0) return [];

    const knownIds = new Set(informationStore.byCharacter[characterId] ?? []);
    const updated: KnownInformationRef[] = [];

    for (const ref of currentRefs) {
      if (!knownIds.has(ref.informationId)) continue;

      const info = informationStore.global.find(
        (i) => i.id === ref.informationId
      );
      if (!info) continue;

      let confidence = ref.confidence ?? 1.0;
      let changed = false;

      // 遍历模糊规则，检查是否匹配
      for (const rule of this.fuzzyRules) {
        // 检查来源类型
        if (rule.sourceTypes && !rule.sourceTypes.includes(info.source))
          continue;

        // 检查标签
        if (rule.targetTags && rule.targetTags.length > 0) {
          const infoTags = info.tags ?? [];
          if (!rule.targetTags.some((t) => infoTags.includes(t))) continue;
        }

        // 检查年龄（信息必须超过指定年龄才会模糊）
        if (rule.afterAgeMs !== undefined) {
          if (now - info.timestamp < rule.afterAgeMs) continue;
        }

        // 应用衰减因子（置信度降低，但不会低于 0）
        confidence = Math.max(0, confidence * rule.decayFactor);
        changed = true;
      }

      if (changed) {
        updated.push({ ...ref, confidence });
      }
    }

    return updated;
  }
}
