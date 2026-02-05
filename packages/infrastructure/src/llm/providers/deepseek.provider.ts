import OpenAI from 'openai';
import type { LLMProviderConfig } from '@star-rail/types';
import type {
  LLMProvider,
  LLMMessage,
  LLMGenerateOptions,
  LLMGenerateResponse,
} from '../llm-provider.interface.js';
import { EnvLoader } from '../../config/env-loader.js';

/**
 * Deepseek Provider
 * 使用 OpenAI 兼容 API 调用 Deepseek
 */
export class DeepseekProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;
  private defaultParams: LLMProviderConfig['defaultParams'];

  constructor(config: LLMProviderConfig) {
    const apiKey = EnvLoader.getRequired('DEEPSEEK_API_KEY');

    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseUrl || 'https://api.deepseek.com/v1',
    });

    this.model = config.model;
    this.defaultParams = config.defaultParams;
  }

  getName(): string {
    return 'deepseek';
  }

  async generate(
    messages: LLMMessage[],
    options?: LLMGenerateOptions
  ): Promise<LLMGenerateResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature:
        options?.temperature ?? this.defaultParams?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? this.defaultParams?.maxTokens ?? 2000,
      top_p: options?.topP ?? this.defaultParams?.topP ?? 0.95,
      stop: options?.stopSequences,
    });

    const choice = response.choices[0];

    return {
      content: choice.message.content || '',
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      finishReason:
        choice.finish_reason === 'stop'
          ? 'stop'
          : choice.finish_reason === 'length'
            ? 'length'
            : undefined,
    };
  }
}
