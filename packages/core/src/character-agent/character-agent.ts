import { injectable, inject } from 'tsyringe';
import type {
  Character,
  Information,
  SceneConfig,
  EventRecord,
} from '@star-rail/types';
import type { LLMGenerateOptions } from '@star-rail/infrastructure';
import { LLMProviderFactory } from '@star-rail/infrastructure';
import {
  PromptBuilder,
  ResponseType,
  type PromptContext,
} from './prompt-builder.js';

/**
 * 解析后的响应内容
 */
export interface ParsedResponseContent {
  /** 响应类型 */
  type: ResponseType;
  /** 对话内容 */
  dialogue?: string;
  /** 行动描述 */
  action?: string;
  /** 内心想法 */
  innerThought?: string;
  /** 情绪状态 */
  emotion?: string;
}

/**
 * Agent 响应
 * P1-CA-02: 单角色调用下生成对话或行动
 */
export interface AgentResponse {
  /** 角色 ID */
  characterId: string;
  /** 原始响应内容 */
  content: string;
  /** 解析后的响应内容 */
  parsed?: ParsedResponseContent;
  /** Token 使用统计 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * 双角色响应结果
 * P1-CA-03: 双角色场景下的分别调用与结果汇总
 */
export interface DualCharacterResponse {
  /** 角色 A 的响应 */
  responseA: AgentResponse;
  /** 角色 B 的响应 */
  responseB: AgentResponse;
  /** 场景 ID */
  sceneId: string;
  /** 生成时间戳 */
  timestamp: number;
}

/**
 * 角色 Agent
 * 基于 LLM 生成角色的对话和行动
 * P1-CA-01~03: 输入仅含人物状态与视野，不接收全局状态
 */
@injectable()
export class CharacterAgent {
  constructor(
    @inject('LLMProviderFactory') private llmFactory: LLMProviderFactory,
    private promptBuilder: PromptBuilder
  ) {}

  /**
   * 生成角色响应
   * P1-CA-02: 基于「人物状态+过滤后视野」的对话/行动生成
   * @param character 角色（包含状态）
   * @param scene 当前场景
   * @param knownInfo 角色已知信息（过滤后视野）
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

    // 解析响应内容
    const parsed = this.parseResponseContent(response.content);

    return {
      characterId: character.id,
      content: response.content,
      parsed,
      usage: response.usage,
    };
  }

  /**
   * 生成角色响应（带响应类型指定）
   * @param character 角色
   * @param scene 当前场景
   * @param knownInfo 角色已知信息
   * @param recentEvents 最近事件
   * @param expectedType 期望的响应类型
   * @param userInput 用户输入（可选）
   * @param options LLM 生成选项
   */
  async generateTypedResponse(
    character: Character,
    scene: SceneConfig,
    knownInfo: Information[],
    recentEvents: EventRecord[],
    expectedType: ResponseType,
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
      expectedResponseType: expectedType,
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

    const parsed = this.parseResponseContent(response.content);

    return {
      characterId: character.id,
      content: response.content,
      parsed,
      usage: response.usage,
    };
  }

  /**
   * 双角色场景响应生成
   * P1-CA-03: 在场 2 人分别注入各自视野后调用；返回 2 份输出供编排使用
   * @param characterA 角色 A
   * @param characterB 角色 B
   * @param scene 当前场景
   * @param knownInfoA 角色 A 已知信息
   * @param knownInfoB 角色 B 已知信息
   * @param recentEvents 最近事件
   * @param userInput 用户输入（可选）
   */
  async generateDualCharacterResponses(
    characterA: Character,
    characterB: Character,
    scene: SceneConfig,
    knownInfoA: Information[],
    knownInfoB: Information[],
    recentEvents: EventRecord[],
    userInput?: string
  ): Promise<DualCharacterResponse> {
    // 并行调用两个角色的响应生成
    const [responseA, responseB] = await Promise.all([
      this.generateResponseWithPresence(
        characterA,
        scene,
        knownInfoA,
        recentEvents,
        [{ id: characterB.id, name: characterB.name }],
        userInput
      ),
      this.generateResponseWithPresence(
        characterB,
        scene,
        knownInfoB,
        recentEvents,
        [{ id: characterA.id, name: characterA.name }],
        userInput
      ),
    ]);

    return {
      responseA,
      responseB,
      sceneId: scene.id,
      timestamp: Date.now(),
    };
  }

  /**
   * 生成角色响应（带在场角色信息）
   * @param character 角色
   * @param scene 当前场景
   * @param knownInfo 角色已知信息
   * @param recentEvents 最近事件
   * @param presentCharacters 在场的其他角色
   * @param userInput 用户输入（可选）
   * @param options LLM 生成选项
   */
  async generateResponseWithPresence(
    character: Character,
    scene: SceneConfig,
    knownInfo: Information[],
    recentEvents: EventRecord[],
    presentCharacters: Array<{ id: string; name: string }>,
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
      presentCharacters,
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

    const parsed = this.parseResponseContent(response.content);

    return {
      characterId: character.id,
      content: response.content,
      parsed,
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
    // 构建在场角色列表
    const presentCharacters = characters.map((c) => ({
      id: c.id,
      name: c.name,
    }));

    const promises = characters.map((character) => {
      // 排除自己，获取其他在场角色
      const otherPresent = presentCharacters.filter(
        (p) => p.id !== character.id
      );

      return this.generateResponseWithPresence(
        character,
        scene,
        knownInfoMap.get(character.id) || [],
        recentEvents,
        otherPresent
      );
    });

    return Promise.all(promises);
  }

  /**
   * 解析响应内容
   * P1-CA-03: 响应格式解析
   * @param content 原始响应内容
   */
  parseResponseContent(content: string): ParsedResponseContent | undefined {
    try {
      // 尝试从内容中提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // 如果没有 JSON，尝试作为纯文本对话处理
        return {
          type: ResponseType.Dialogue,
          dialogue: content.trim(),
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 验证并规范化响应类型
      let type: ResponseType;
      if (parsed.type === 'dialogue') {
        type = ResponseType.Dialogue;
      } else if (parsed.type === 'action') {
        type = ResponseType.Action;
      } else if (parsed.type === 'mixed') {
        type = ResponseType.Mixed;
      } else {
        // 根据内容推断类型
        if (parsed.dialogue && parsed.action) {
          type = ResponseType.Mixed;
        } else if (parsed.action) {
          type = ResponseType.Action;
        } else {
          type = ResponseType.Dialogue;
        }
      }

      return {
        type,
        dialogue: parsed.dialogue,
        action: parsed.action,
        innerThought: parsed.innerThought,
        emotion: parsed.emotion,
      };
    } catch {
      // 解析失败，返回原始内容作为对话
      return {
        type: ResponseType.Dialogue,
        dialogue: content.trim(),
      };
    }
  }

  /**
   * 验证响应是否泄露了未知信息
   * 用于测试和调试
   * @param response 响应内容
   * @param knownInfo 角色已知信息
   * @param allInfo 所有信息（用于检测泄露）
   */
  validateNoInfoLeakage(
    response: AgentResponse,
    knownInfo: Information[],
    allInfo: Information[]
  ): { isValid: boolean; leakedInfo?: string[] } {
    const knownIds = new Set(knownInfo.map((i) => i.id));
    const unknownInfo = allInfo.filter((i) => !knownIds.has(i.id));

    const leakedInfo: string[] = [];
    const responseText = response.content.toLowerCase();

    for (const info of unknownInfo) {
      // 简单的关键词检测
      const keywords = info.content.toLowerCase().split(/\s+/);
      for (const keyword of keywords) {
        if (keyword.length > 3 && responseText.includes(keyword)) {
          leakedInfo.push(info.content);
          break;
        }
      }
    }

    return {
      isValid: leakedInfo.length === 0,
      leakedInfo: leakedInfo.length > 0 ? leakedInfo : undefined,
    };
  }
}
