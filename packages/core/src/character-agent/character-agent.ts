import { injectable, inject } from 'tsyringe';
import type {
  Character,
  Information,
  SceneConfig,
  EventRecord,
} from '@star-rail/types';
import type { LLMGenerateOptions } from '@star-rail/infrastructure';
import { LLMProviderFactory } from '@star-rail/infrastructure';
import { PromptBuilder, type PromptContext } from './prompt-builder.js';

/**
 * Agent 响应
 */
export interface AgentResponse {
  characterId: string;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * 角色 Agent
 * 基于 LLM 生成角色的对话和行动
 */
@injectable()
export class CharacterAgent {
  constructor(
    @inject('LLMProviderFactory') private llmFactory: LLMProviderFactory,
    private promptBuilder: PromptBuilder
  ) {}

  /**
   * 生成角色响应
   * @param character 角色
   * @param scene 当前场景
   * @param knownInfo 角色已知信息
   * @param recentEvents 最近事件
   * @param userInput 用户输入（可选）
   * @param options LLM 生成选项
   */
  async generateResponse(
    character: Character,
    scene: SceneConfig,
    knownInfo: Information[],
    recentEvents: EventRecord[],
    userInput?: string,
    options?: LLMGenerateOptions
  ): Promise<AgentResponse> {
    const provider = this.llmFactory.getProviderForCharacter(character.id);

    const context: PromptContext = {
      character,
      scene,
      knownInfo,
      recentEvents,
      userInput,
    };

    const systemPrompt = this.promptBuilder.buildSystemPrompt(character);
    const userPrompt = this.promptBuilder.buildCharacterResponsePrompt(context);

    const response = await provider.generate(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options
    );

    return {
      characterId: character.id,
      content: response.content,
      usage: response.usage,
    };
  }

  /**
   * 批量生成多个角色的响应
   * @param characters 角色列表
   * @param scene 当前场景
   * @param knownInfoMap 各角色已知信息映射
   * @param recentEvents 最近事件
   */
  async generateMultipleResponses(
    characters: Character[],
    scene: SceneConfig,
    knownInfoMap: Map<string, Information[]>,
    recentEvents: EventRecord[]
  ): Promise<AgentResponse[]> {
    const promises = characters.map((character) =>
      this.generateResponse(
        character,
        scene,
        knownInfoMap.get(character.id) || [],
        recentEvents
      )
    );

    return Promise.all(promises);
  }
}
