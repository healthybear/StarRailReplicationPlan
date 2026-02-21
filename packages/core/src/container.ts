import 'reflect-metadata';
import { container } from 'tsyringe';
import type { LLMConfig, LLMProviderConfig } from '@star-rail/types';
import {
  JsonFileStorage,
  ConfigLoader,
  LLMProviderFactory,
  type StorageAdapter,
} from '@star-rail/infrastructure';
import { VisionManager } from './vision-manager/vision-manager.js';
import { CharacterStateService } from './character-state/character-state.service.js';
import { WorldEngine } from './world-engine/world-engine.js';
import { ItemService } from './world-engine/item.service.js';
import { PlotService } from './world-engine/plot.service.js';
import { FactionService } from './faction/faction.service.js';
import { InputParser } from './input-parser/input-parser.js';
import { CharacterAgent } from './character-agent/character-agent.js';
import { PromptBuilder } from './character-agent/prompt-builder.js';
import { StoryOrchestrator } from './story-orchestrator/story-orchestrator.js';
import { SnapshotService } from './story-orchestrator/snapshot.service.js';

/**
 * 简化的 LLM 配置（用于快速初始化）
 * 注意：API Key 从环境变量中读取，不需要在配置中传递
 */
export interface SimpleLLMConfig {
  provider: string;
  model: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 初始化 DI 容器
 * @param options 初始化选项
 */
export function initializeContainer(options: {
  dataDir?: string;
  configDir?: string;
  llmConfig: LLMConfig | SimpleLLMConfig;
}): void {
  const { dataDir = './data', configDir = './config', llmConfig } = options;

  // 转换简化配置为完整配置
  let fullLLMConfig: LLMConfig;
  if ('providers' in llmConfig) {
    // 已经是完整配置
    fullLLMConfig = llmConfig;
  } else {
    // 简化配置，需要转换
    const simpleConfig = llmConfig as SimpleLLMConfig;
    const providerConfig: LLMProviderConfig = {
      enabled: true,
      model: simpleConfig.model,
      baseUrl: simpleConfig.baseURL,
      defaultParams: {
        temperature: simpleConfig.temperature,
        maxTokens: simpleConfig.maxTokens,
      },
    };
    fullLLMConfig = {
      defaultProvider: simpleConfig.provider,
      providers: {
        [simpleConfig.provider]: providerConfig,
      },
    };
  }

  // 注册存储适配器
  container.register<StorageAdapter>('StorageAdapter', {
    useValue: new JsonFileStorage(dataDir),
  });

  // 注册配置加载器
  container.register<ConfigLoader>('ConfigLoader', {
    useValue: new ConfigLoader(configDir),
  });

  // 注册 LLM 配置
  container.register<LLMConfig>('LLMConfig', {
    useValue: fullLLMConfig,
  });

  // 注册 LLM Provider 工厂
  container.registerSingleton<LLMProviderFactory>(
    'LLMProviderFactory',
    LLMProviderFactory
  );

  // 手动注册所有核心服务（解决 ES 模块中 tsyringe 自动注入的问题）
  // 注意：必须按依赖顺序注册
  container.registerSingleton(VisionManager);
  container.registerSingleton(CharacterStateService);
  container.registerSingleton(WorldEngine);
  container.registerSingleton(FactionService);
  container.registerSingleton(ItemService);
  container.registerSingleton(PlotService);
  container.registerSingleton(InputParser);
  container.registerSingleton(PromptBuilder); // CharacterAgent 的依赖
  container.registerSingleton(CharacterAgent);
  container.registerSingleton(StoryOrchestrator);
  container.registerSingleton(SnapshotService);
}

/**
 * 获取 DI 容器
 */
export function getContainer() {
  return container;
}

/**
 * 解析依赖
 */
export function resolve<T>(token: string): T {
  return container.resolve<T>(token);
}
