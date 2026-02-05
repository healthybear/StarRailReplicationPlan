import { injectable } from 'tsyringe';
import type {
  Character,
  Information,
  SceneConfig,
  EventRecord,
  Personality,
} from '@star-rail/types';

/**
 * Prompt 构建上下文
 */
export interface PromptContext {
  character: Character;
  scene: SceneConfig;
  knownInfo: Information[];
  recentEvents: EventRecord[];
  userInput?: string;
}

/**
 * Prompt 构建器
 * 构建用于 LLM 调用的 Prompt
 */
@injectable()
export class PromptBuilder {
  /**
   * 构建角色响应 Prompt
   */
  buildCharacterResponsePrompt(context: PromptContext): string {
    const { character, scene, knownInfo, recentEvents, userInput } = context;

    const personalityDesc = this.describePersonality(character.personality);
    const knownInfoDesc = this.formatKnownInfo(knownInfo);
    const eventsDesc = this.formatRecentEvents(recentEvents);

    return `你是 ${character.name}，${character.faction ? `来自${character.faction}，` : ''}性格特点：${personalityDesc}。

当前场景：${scene.name}
${scene.description}

你已知的信息：
${knownInfoDesc || '（暂无特别信息）'}

最近发生的事件：
${eventsDesc || '（暂无最近事件）'}

${userInput ? `用户输入：${userInput}\n` : ''}
请根据以上信息，以 ${character.name} 的身份生成回应。注意：
1. 只能使用你已知的信息，不要透露你不知道的事情
2. 保持角色性格的一致性
3. 回应要自然、符合当前场景`;
  }

  /**
   * 构建系统 Prompt
   */
  buildSystemPrompt(character: Character): string {
    return `你是一个角色扮演助手，正在扮演 ${character.name}。
你需要根据角色的性格、已知信息和当前场景来生成回应。
重要规则：
1. 严格遵守视野限制，只能使用角色已知的信息
2. 保持角色性格的一致性
3. 不要打破角色扮演`;
  }

  private describePersonality(personality: Personality): string {
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

  private formatKnownInfo(info: Information[]): string {
    if (info.length === 0) return '';

    return info
      .slice(-10) // 只取最近 10 条
      .map((i) => `- ${i.content}`)
      .join('\n');
  }

  private formatRecentEvents(events: EventRecord[]): string {
    if (events.length === 0) return '';

    return events
      .slice(-5) // 只取最近 5 条
      .map((e) => `- ${e.description || e.eventId}`)
      .join('\n');
  }
}
