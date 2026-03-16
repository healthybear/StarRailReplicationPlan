import { injectable, inject } from 'tsyringe';
import type { LLMConfig } from '@star-rail/types';
import type { LLMProvider } from './llm-provider.interface.js';
import { DeepseekProvider } from './providers/deepseek.provider.js';
import { ClaudeProvider } from './providers/claude.provider.js';

/**
 * LLM Provider 工厂 - 多模型管理与路由
 *
 * 职责：
 * 1. 管理多个 LLM Provider 实例（Claude、Deepseek 等）
 * 2. 根据配置初始化 Provider
 * 3. 提供 Provider 获取接口（默认、指定名称、角色专用）
 * 4. 支持角色级别的模型路由（不同角色使用不同模型）
 *
 * 工厂模式优势：
 * - 统一管理：所有 Provider 实例集中管理
 * - 灵活路由：支持默认模型、指定模型、角色专用模型
 * - 易于扩展：添加新模型只需实现 LLMProvider 接口
 *
 * 配置示例：
 * ```json
 * {
 *   "defaultProvider": "claude",
 *   "providers": {
 *     "claude": { "enabled": true, "apiKey": "..." },
 *     "deepseek": { "enabled": true, "apiKey": "..." }
 *   },
 *   "characterProviders": {
 *     "char_001": "claude",
 *     "char_002": "deepseek"
 *   }
 * }
 * ```
 */
@injectable()
export class LLMProviderFactory {
  private providers: Map<string, LLMProvider> = new Map();
  private config: LLMConfig;

  constructor(@inject('LLMConfig') config: LLMConfig) {
    this.config = config;
    this.initializeProviders();
  }

  /**
   * 初始化所有启用的 Provider
   *
   * 遍历配置中的所有 Provider，创建实例并注册到工厂。
   * 只初始化 enabled: true 的 Provider。
   */
  private initializeProviders(): void {
    for (const [name, providerConfig] of Object.entries(
      this.config.providers
    )) {
      if (!providerConfig.enabled) continue;

      let provider: LLMProvider;

      // 根据名称创建对应的 Provider 实例
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
   *
   * 如果不指定名称，返回默认 Provider。
   * 如果指定的 Provider 不存在，抛出错误。
   *
   * @param name Provider 名称（可选）
   * @returns LLM Provider 实例
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
   *
   * 支持为不同角色配置不同的模型。
   * 如果角色没有专用配置，返回默认 Provider。
   *
   * 用途：
   * - 不同角色使用不同的模型（如主角用 Claude，NPC 用 Deepseek）
   * - 根据角色重要性分配模型资源
   *
   * @param characterId 角色 ID
   * @returns LLM Provider 实例
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
