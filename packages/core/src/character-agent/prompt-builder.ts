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
 * Prompt 构建器
 * 构建用于 LLM 调用的 Prompt
 */
@injectable()
export class PromptBuilder {
  /**
   * 构建角色响应 Prompt
   * P1-CA-01: 输入仅含该人物状态与视野、当前场景描述
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
   */
  private formatKnownInfo(info: Information[]): string {
    if (info.length === 0) return '';

    return info
      .slice(-10) // 只取最近 10 条
      .map((i) => `- ${i.content}`)
      .join('\n');
  }

  /**
   * 格式化最近事件
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
