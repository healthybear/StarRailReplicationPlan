import Anthropic from '@anthropic-ai/sdk';
import type { LLMProviderConfig } from '@star-rail/types';
import type {
  LLMProvider,
  LLMMessage,
  LLMGenerateOptions,
  LLMGenerateResponse,
} from '../llm-provider.interface.js';
import { EnvLoader } from '../../config/env-loader.js';

/**
 * Claude Provider
 * 使用 Anthropic SDK 调用 Claude
 */
export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;
  private defaultParams: LLMProviderConfig['defaultParams'];

  constructor(config: LLMProviderConfig) {
    const apiKey = EnvLoader.getRequired('ANTHROPIC_API_KEY');

    this.client = new Anthropic({
      apiKey,
    });

    this.model = config.model;
    this.defaultParams = config.defaultParams;
  }

  getName(): string {
    return 'claude';
  }

  async generate(
    messages: LLMMessage[],
    options?: LLMGenerateOptions
  ): Promise<LLMGenerateResponse> {
    // 分离 system 消息和其他消息
    const systemMessage = messages.find((m) => m.role === 'system');
    const otherMessages = messages.filter((m) => m.role !== 'system');

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens ?? this.defaultParams?.maxTokens ?? 2000,
      system: systemMessage?.content,
      messages: otherMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      temperature:
        options?.temperature ?? this.defaultParams?.temperature ?? 0.7,
      top_p: options?.topP ?? this.defaultParams?.topP,
      stop_sequences: options?.stopSequences,
    });

    // 提取文本内容
    const textContent = response.content.find((c) => c.type === 'text');
    const content = textContent?.type === 'text' ? textContent.text : '';

    return {
      content,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason:
        response.stop_reason === 'end_turn'
          ? 'stop'
          : response.stop_reason === 'max_tokens'
            ? 'length'
            : undefined,
    };
  }
}
