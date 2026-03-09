/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-console */
/**
 * Mock LLM Provider for E2E Testing
 * 提供可预测的 LLM 响应，避免测试结果不稳定
 */

import type { ILLMProvider, LLMMessage, LLMResponse } from '@star-rail/types';

export class MockLLMProvider implements ILLMProvider {
  private responses: Map<string, string> = new Map();

  constructor() {
    this.setupDefaultResponses();
  }

  /**
   * 设置默认响应
   */
  private setupDefaultResponses() {
    // 三月七的默认响应（不知道星核碎片）
    this.responses.set(
      'march7th:describe',
      '我们现在在黑塔空间站，这里看起来很神秘呢！不知道接下来会发生什么。'
    );

    // 星的默认响应（知道星核碎片）
    this.responses.set(
      'star:describe',
      '我在这里发现了一些奇怪的东西，似乎和星核有关。'
    );

    // 三月七收到告知后的响应
    this.responses.set(
      'march7th:after-told',
      '什么？星核碎片？这听起来很重要！我们要小心处理。'
    );
  }

  /**
   * 设置特定场景的响应
   */
  setResponse(key: string, response: string) {
    this.responses.set(key, response);
  }

  /**
   * 生成响应
   */
  async generate(messages: LLMMessage[]): Promise<LLMResponse> {
    // 从消息中提取角色和意图
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content.toLowerCase();

    let responseKey = 'default';

    // 根据内容判断响应键
    if (content.includes('三月七') && content.includes('描述')) {
      responseKey = 'march7th:describe';
    } else if (content.includes('星') && content.includes('发现')) {
      responseKey = 'star:describe';
    } else if (content.includes('星核碎片') && content.includes('三月七')) {
      responseKey = 'march7th:after-told';
    }

    // 检查是否包含不应该知道的信息
    const hasSecretInfo =
      content.includes('星核碎片') || content.includes('stellaron');
    const isCharacterMarch7th = content.includes('三月七');

    let response = this.responses.get(responseKey) || '我明白了。';

    // 如果是三月七且内容中没有明确告知星核信息，确保不泄露
    if (
      isCharacterMarch7th &&
      !content.includes('告诉') &&
      !content.includes('说')
    ) {
      // 确保响应不包含星核相关内容
      response = this.responses.get('march7th:describe') || response;
    }

    return {
      content: response,
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
    };
  }

  /**
   * 流式生成（E2E 测试中不需要）
   */
  async *generateStream(messages: LLMMessage[]): AsyncGenerator<string> {
    const response = await this.generate(messages);
    yield response.content;
  }
}
