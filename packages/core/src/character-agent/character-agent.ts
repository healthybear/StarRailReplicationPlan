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
 * 角色代理 - LLM 集成与角色响应生成
 *
 * 职责：
 * 1. 调用 LLM 生成符合角色性格的对话和行动
 * 2. 支持单角色、多角色、双角色对话等多种场景
 * 3. 管理提示词构建和响应解析
 * 4. 统计 Token 使用情况
 * 5. 验证响应是否泄露未知信息（用于测试）
 *
 * 核心原则：
 * - 输入仅含人物状态与视野，不接收全局状态（信息隔离）
 * - 每个角色使用独立的 LLM 提供商（可配置）
 * - 响应内容需要解析为结构化格式（对话/行动/内心想法/情绪）
 *
 * 对应 WBS：P1-CA-01（视野隔离）、P1-CA-02（单角色响应）、P1-CA-03（双角色对话）
 */
@injectable()
export class CharacterAgent {
  constructor(
    @inject('LLMProviderFactory') private llmFactory: LLMProviderFactory,
    private promptBuilder: PromptBuilder
  ) {}

  /**
   * 生成角色响应
   *
   * 这是角色响应生成的核心方法，流程：
   * 1. 根据角色 ID 获取对应的 LLM 提供商（支持不同角色使用不同模型）
   * 2. 构建系统提示词（角色性格、背景、说话风格）
   * 3. 构建用户提示词（当前场景、已知信息、最近事件、用户输入）
   * 4. 调用 LLM 生成响应
   * 5. 解析响应内容为结构化格式
   * 6. 返回响应和 Token 使用统计
   *
   * P1-CA-02: 基于「人物状态+过滤后视野」的对话/行动生成
   *
   * @param character 角色（包含状态、性格、关系等）
   * @param scene 当前场景配置
   * @param knownInfo 角色已知信息（过滤后视野，不包含角色不应知道的信息）
   * @param recentEvents 最近事件（用于上下文）
   * @param userInput 用户输入（可选，用于对话场景）
   * @param options LLM 生成选项（温度、最大 Token 等）
   * @returns 角色响应，包含原始内容、解析后内容、Token 统计
   */
  async generateResponse(
    character: Character,
    scene: SceneConfig,
    knownInfo: Information[],
    recentEvents: EventRecord[],
    userInput?: string,
    options?: LLMGenerateOptions
  ): Promise<AgentResponse> {
    // 获取角色专属的 LLM 提供商
    // 不同角色可以配置使用不同的模型（如 Claude、Deepseek 等）
    const provider = this.llmFactory.getProviderForCharacter(character.id);

    // 构建提示词上下文
    const context: PromptContext = {
      character,
      scene,
      knownInfo,
      recentEvents,
      userInput,
    };

    // 构建系统提示词：定义角色的性格、背景、说话风格
    const systemPrompt = this.promptBuilder.buildSystemPrompt(character);
    // 构建用户提示词：描述当前情境和期望的响应
    const userPrompt = this.promptBuilder.buildCharacterResponsePrompt(context);

    // 调用 LLM 生成响应
    const response = await provider.generate(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options
    );

    // 解析响应内容为结构化格式（对话/行动/内心想法/情绪）
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
   *
   * 用于两个角色之间的对话场景，特点：
   * 1. 两个角色并行生成响应（提高效率）
   * 2. 每个角色使用各自的视野（信息不对称）
   * 3. 每个角色知道对方在场（通过 presentCharacters 参数）
   * 4. 返回两份独立的响应供编排器使用
   *
   * P1-CA-03: 在场 2 人分别注入各自视野后调用；返回 2 份输出供编排使用
   *
   * @param characterA 角色 A
   * @param characterB 角色 B
   * @param scene 当前场景
   * @param knownInfoA 角色 A 已知信息（可能与 B 不同）
   * @param knownInfoB 角色 B 已知信息（可能与 A 不同）
   * @param recentEvents 最近事件
   * @param userInput 用户输入（可选，用于引导对话方向）
   * @returns 双角色响应结果，包含两个角色的响应
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
    // 并行调用两个角色的响应生成（提高效率）
    // 每个角色都知道对方在场，但使用各自的视野
    const [responseA, responseB] = await Promise.all([
      this.generateResponseWithPresence(
        characterA,
        scene,
        knownInfoA,
        recentEvents,
        [{ id: characterB.id, name: characterB.name }], // A 知道 B 在场
        userInput
      ),
      this.generateResponseWithPresence(
        characterB,
        scene,
        knownInfoB,
        recentEvents,
        [{ id: characterA.id, name: characterA.name }], // B 知道 A 在场
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
   *
   * 用于多角色同时在场的场景（如群体对话、多人互动）
   * 特点：
   * 1. 所有角色并行生成响应
   * 2. 每个角色使用各自的视野
   * 3. 每个角色知道其他所有在场角色
   *
   * @param characters 角色列表
   * @param scene 当前场景
   * @param knownInfoMap 各角色已知信息映射（角色 ID -> 已知信息列表）
   * @param recentEvents 最近事件
   * @returns 所有角色的响应列表
   */
  async generateMultipleResponses(
    characters: Character[],
    scene: SceneConfig,
    knownInfoMap: Map<string, Information[]>,
    recentEvents: EventRecord[]
  ): Promise<AgentResponse[]> {
    // 构建在场角色列表（用于告知每个角色谁在场）
    const presentCharacters = characters.map((c) => ({
      id: c.id,
      name: c.name,
    }));

    // 为每个角色生成响应（并行执行）
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
   *
   * 将 LLM 返回的原始文本解析为结构化格式，支持：
   * 1. JSON 格式响应（推荐）：包含 type、dialogue、action、innerThought、emotion 字段
   * 2. 纯文本响应（兜底）：作为对话内容处理
   *
   * 响应类型：
   * - dialogue: 纯对话
   * - action: 纯行动
   * - mixed: 对话+行动
   *
   * P1-CA-03: 响应格式解析
   *
   * @param content 原始响应内容
   * @returns 解析后的结构化内容，解析失败时返回 undefined
   */
  parseResponseContent(content: string): ParsedResponseContent | undefined {
    try {
      // 尝试从内容中提取 JSON（支持 LLM 在 JSON 前后添加说明文字）
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
        // 根据内容推断类型（兜底逻辑）
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
      // 解析失败，返回原始内容作为对话（兜底）
      return {
        type: ResponseType.Dialogue,
        dialogue: content.trim(),
      };
    }
  }

  /**
   * 验证响应是否泄露了未知信息
   *
   * 用于测试和调试，检查角色响应是否包含了不应知道的信息。
   * 这是视野隔离机制的验证工具。
   *
   * 检测方法：
   * 1. 找出角色不应知道的信息（未知信息 = 所有信息 - 已知信息）
   * 2. 检查响应中是否包含未知信息的关键词
   * 3. 返回验证结果和泄露的信息列表
   *
   * 注意：这是简单的关键词匹配，可能有误报
   *
   * @param response 响应内容
   * @param knownInfo 角色已知信息
   * @param allInfo 所有信息（用于检测泄露）
   * @returns 验证结果，包含是否有效和泄露的信息列表
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
