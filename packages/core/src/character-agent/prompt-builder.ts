import { injectable } from 'tsyringe';
import type {
  Character,
  Information,
  SceneConfig,
  EventRecord,
  Personality,
  Relationship,
} from '@star-rail/types';

/**
 * 响应类型
 */
export enum ResponseType {
  /** 对话 */
  Dialogue = 'dialogue',
  /** 行动 */
  Action = 'action',
  /** 混合（对话+行动） */
  Mixed = 'mixed',
}

/**
 * Prompt 构建上下文
 * P1-CA-01: 输入仅含该人物状态与视野、当前场景描述
 */
export interface PromptContext {
  /** 角色（包含状态） */
  character: Character;
  /** 当前场景 */
  scene: SceneConfig;
  /** 角色已知信息（过滤后视野） */
  knownInfo: Information[];
  /** 最近事件 */
  recentEvents: EventRecord[];
  /** 用户输入（可选） */
  userInput?: string;
  /** 期望的响应类型（可选） */
  expectedResponseType?: ResponseType;
  /** 在场的其他角色（可选，用于关系描述） */
  presentCharacters?: Array<{ id: string; name: string }>;
}

/**
 * 响应格式指令
 */
export const RESPONSE_FORMAT_INSTRUCTION = `
请按以下 JSON 格式输出你的响应：
{
  "type": "dialogue" | "action" | "mixed",
  "dialogue": "你说的话（如果有）",
  "action": "你的行动描述（如果有）",
  "innerThought": "你的内心想法（可选）",
  "emotion": "当前情绪状态"
}
`;

/**
 * Prompt 构建器 - LLM 提示词生成
 *
 * 职责：
 * 1. 构建系统提示词（定义角色身份和核心规则）
 * 2. 构建用户提示词（提供当前情境和期望响应）
 * 3. 格式化角色信息（性格、能力、关系、已知信息）
 * 4. 确保视野隔离（只提供角色已知的信息）
 *
 * 提示词结构：
 * - 系统提示词：角色身份、核心规则（视野隔离、性格一致、不打破角色）
 * - 用户提示词：角色状态、当前场景、已知信息、最近事件、用户输入、响应格式
 *
 * 关键原则：
 * - 视野隔离：只提供【你已知的信息】，不泄露全局信息
 * - 性格一致：根据五大人格特质描述角色性格
 * - 关系感知：优先显示与在场角色的关系
 *
 * 对应 WBS：P1-CA-01（视野隔离）、P1-CA-02（提示词构建）
 */
@injectable()
export class PromptBuilder {
  /**
   * 构建角色响应 Prompt
   *
   * 这是提示词构建的核心方法，生成完整的用户提示词。
   *
   * 提示词包含：
   * 1. 角色身份和性格描述
   * 2. 角色当前状态（能力、关系）
   * 3. 当前场景描述
   * 4. 角色已知信息（过滤后视野）
   * 5. 最近发生的事件
   * 6. 用户输入（如果有）
   * 7. 响应格式要求
   * 8. 重要规则（视野限制、性格一致性）
   *
   * P1-CA-01: 输入仅含该人物状态与视野、当前场景描述
   *
   * @param context 提示词构建上下文
   * @returns 完整的用户提示词
   */
  buildCharacterResponsePrompt(context: PromptContext): string {
    const {
      character,
      scene,
      knownInfo,
      recentEvents,
      userInput,
      expectedResponseType,
      presentCharacters,
    } = context;

    const personalityDesc = this.describePersonality(character.personality);
    const knownInfoDesc = this.formatKnownInfo(knownInfo);
    const eventsDesc = this.formatRecentEvents(recentEvents);
    const relationshipsDesc = this.formatRelationships(
      character,
      presentCharacters
    );
    const abilitiesDesc = this.formatAbilities(character);

    let responseTypeHint = '';
    if (expectedResponseType === ResponseType.Dialogue) {
      responseTypeHint = '请以对话形式回应。';
    } else if (expectedResponseType === ResponseType.Action) {
      responseTypeHint = '请以行动形式回应。';
    }

    return `你是 ${character.name}，${character.faction ? `来自${character.faction}，` : ''}性格特点：${personalityDesc}。

【角色状态】
${abilitiesDesc}
${relationshipsDesc}

【当前场景】
场景名称：${scene.name}
${scene.description}

【你已知的信息】
${knownInfoDesc || '（暂无特别信息）'}

【最近发生的事件】
${eventsDesc || '（暂无最近事件）'}

${userInput ? `【用户输入】\n${userInput}\n` : ''}
请根据以上信息，以 ${character.name} 的身份生成回应。${responseTypeHint}

【重要规则】
1. 严格遵守视野限制：只能使用【你已知的信息】中列出的内容，绝对不能透露或暗示你不知道的事情
2. 保持角色性格的一致性：你的回应应符合你的性格特点
3. 回应要自然、符合当前场景
4. 如果被问到你不知道的事情，应该表现出不知情的状态

${RESPONSE_FORMAT_INSTRUCTION}`;
  }

  /**
   * 构建系统 Prompt
   *
   * 系统提示词定义角色扮演的核心规则，包括：
   * 1. 角色身份声明
   * 2. 视野隔离规则（只能知道明确告知的信息）
   * 3. 性格一致性要求
   * 4. 不打破角色规则
   * 5. 输出格式要求
   *
   * 系统提示词在整个对话中保持不变，用于约束 LLM 的行为。
   *
   * @param character 角色对象
   * @returns 系统提示词
   */
  buildSystemPrompt(character: Character): string {
    return `你是一个角色扮演助手，正在扮演 ${character.name}。
你需要根据角色的性格、已知信息和当前场景来生成回应。

【核心规则】
1. 视野隔离：你只能知道明确告诉你的信息，不能假设或推测其他信息
2. 性格一致：保持角色性格的一致性，不要突然改变行为模式
3. 不打破角色：始终以角色身份回应，不要跳出角色扮演
4. 信息保密：如果你不知道某件事，就表现出不知道，不要编造

【输出格式】
请始终以 JSON 格式输出响应，包含 type、dialogue、action、innerThought、emotion 字段。`;
  }

  /**
   * 构建简洁的角色响应 Prompt（用于快速生成）
   */
  buildSimpleResponsePrompt(context: PromptContext): string {
    const { character, scene, knownInfo, userInput } = context;

    const knownInfoDesc = this.formatKnownInfo(knownInfo);

    return `角色：${character.name}
场景：${scene.name}
已知信息：${knownInfoDesc || '无'}
${userInput ? `输入：${userInput}` : ''}

以 ${character.name} 的身份回应，只使用已知信息。`;
  }

  /**
   * 描述人格特质
   *
   * 基于五大人格模型（Big Five）将数值转换为自然语言描述。
   *
   * 五大人格维度：
   * - openness（开放性）：好奇心、想象力 vs 务实保守
   * - conscientiousness（尽责性）：认真负责 vs 随性自由
   * - extraversion（外向性）：外向活泼 vs 内敛沉稳
   * - agreeableness（宜人性）：友善合作 vs 独立自主
   * - neuroticism（神经质）：情绪敏感 vs 情绪稳定
   *
   * @param personality 人格特质对象
   * @returns 人格描述字符串
   */
  describePersonality(personality: Personality): string {
    const { traits } = personality;
    const descriptions: string[] = [];

    if (traits.openness > 0.7) descriptions.push('富有好奇心和想象力');
    else if (traits.openness < 0.3) descriptions.push('务实保守');

    if (traits.conscientiousness > 0.7) descriptions.push('认真负责');
    else if (traits.conscientiousness < 0.3) descriptions.push('随性自由');

    if (traits.extraversion > 0.7) descriptions.push('外向活泼');
    else if (traits.extraversion < 0.3) descriptions.push('内敛沉稳');

    if (traits.agreeableness > 0.7) descriptions.push('友善合作');
    else if (traits.agreeableness < 0.3) descriptions.push('独立自主');

    if (traits.neuroticism > 0.7) descriptions.push('情绪敏感');
    else if (traits.neuroticism < 0.3) descriptions.push('情绪稳定');

    return descriptions.join('、') || '性格平和';
  }

  /**
   * 格式化已知信息
   *
   * 将信息列表格式化为提示词中的文本。
   * 只取最近 10 条信息，避免提示词过长。
   *
   * @param info 信息列表
   * @returns 格式化后的信息文本
   */
  private formatKnownInfo(info: Information[]): string {
    if (info.length === 0) return '';

    return info
      .slice(-10) // 只取最近 10 条，控制提示词长度
      .map((i) => `- ${i.content}`)
      .join('\n');
  }

  /**
   * 格式化最近事件
   *
   * 将事件列表格式化为提示词中的文本。
   * 只取最近 5 条事件，提供足够的上下文。
   *
   * @param events 事件列表
   * @returns 格式化后的事件文本
   */
  private formatRecentEvents(events: EventRecord[]): string {
    if (events.length === 0) return '';

    return events
      .slice(-5) // 只取最近 5 条
      .map((e) => `- ${e.description || e.eventId}`)
      .join('\n');
  }

  /**
   * 格式化关系描述
   *
   * 将角色关系格式化为提示词中的文本。
   * 如果有在场角色，优先显示与在场角色的关系（更相关）。
   *
   * @param character 角色对象
   * @param presentCharacters 在场角色列表（可选）
   * @returns 格式化后的关系文本
   */
  private formatRelationships(
    character: Character,
    presentCharacters?: Array<{ id: string; name: string }>
  ): string {
    const relationships = character.state.relationships;
    if (!relationships || Object.keys(relationships).length === 0) {
      return '关系：（暂无特别关系）';
    }

    const lines: string[] = ['关系：'];

    // 如果有在场角色，优先显示与在场角色的关系
    if (presentCharacters && presentCharacters.length > 0) {
      for (const present of presentCharacters) {
        const rel = relationships[present.id];
        if (rel) {
          lines.push(`- 与${present.name}：${this.describeRelationship(rel)}`);
        }
      }
    } else {
      // 否则显示所有关系
      for (const [targetId, rel] of Object.entries(relationships)) {
        lines.push(`- 与${targetId}：${this.describeRelationship(rel)}`);
      }
    }

    return lines.length > 1 ? lines.join('\n') : '关系：（暂无特别关系）';
  }

  /**
   * 描述单个关系
   */
  private describeRelationship(rel: Relationship): string {
    const parts: string[] = [];

    if (rel.trust > 0.7) parts.push('高度信任');
    else if (rel.trust < 0.3) parts.push('不太信任');

    if (rel.intimacy > 0.7) parts.push('非常亲密');
    else if (rel.intimacy < 0.3) parts.push('关系疏远');

    if (rel.hostility > 0.5) parts.push('有敌意');

    if (rel.respect > 0.7) parts.push('非常尊重');

    return parts.join('，') || '普通关系';
  }

  /**
   * 格式化能力描述
   */
  private formatAbilities(character: Character): string {
    const abilities = character.state.abilities;
    if (!abilities || Object.keys(abilities).length === 0) {
      return '能力：（暂无特别能力）';
    }

    const lines: string[] = ['能力：'];
    for (const [name, value] of Object.entries(abilities)) {
      const level = this.getAbilityLevel(value);
      lines.push(`- ${name}：${level}`);
    }

    return lines.join('\n');
  }

  /**
   * 获取能力等级描述
   */
  private getAbilityLevel(value: number): string {
    if (value >= 80) return '精通';
    if (value >= 60) return '熟练';
    if (value >= 40) return '一般';
    if (value >= 20) return '生疏';
    return '不擅长';
  }
}
