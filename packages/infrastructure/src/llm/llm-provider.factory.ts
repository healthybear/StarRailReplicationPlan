import { injectable, inject } from 'tsyringe';
import type { LLMConfig } from '@star-rail/types';
import type { LLMProvider } from './llm-provider.interface.js';
import { DeepseekProvider } from './providers/deepseek.provider.js';
import { ClaudeProvider } from './providers/claude.provider.js';

/**
 * LLM Provider 工厂
 * 管理多个 LLM Provider 实例
 */
@injectable()
export class LLMProviderFactory {
  private providers: Map<string, LLMProvider> = new Map();
  private config: LLMConfig;

  constructor(@inject('LLMConfig') config: LLMConfig) {
    this.config = config;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    for (const [name, providerConfig] of Object.entries(
      this.config.providers
    )) {
      if (!providerConfig.enabled) continue;

      let provider: LLMProvider;

      switch (name) {
        case 'deepseek':
          provider = new DeepseekProvider(providerConfig);
          break;
        case 'claude':
          provider = new ClaudeProvider(providerConfig);
          break;
        default:
          console.warn(`Unknown LLM provider: ${name}, skipping...`);
          continue;
      }

      this.providers.set(name, provider);
    }
  }

  /**
   * 获取指定的 Provider
   * @param name Provider 名称，不指定则返回默认 Provider
   */
  getProvider(name?: string): LLMProvider {
    const providerName = name || this.config.defaultProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(
        `LLM provider not found: ${providerName}. Available providers: ${Array.from(this.providers.keys()).join(', ')}`
      );
    }

    return provider;
  }

  /**
   * 获取角色专用的 Provider
   * @param characterId 角色 ID
   */
  getProviderForCharacter(characterId: string): LLMProvider {
    const providerName = this.config.characterProviders?.[characterId];
    return this.getProvider(providerName);
  }

  /**
   * 列出所有可用的 Provider
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 检查 Provider 是否可用
   * @param name Provider 名称
   */
  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }
}
