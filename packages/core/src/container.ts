import 'reflect-metadata';
import { container } from 'tsyringe';
import type { LLMConfig } from '@star-rail/types';
import {
  JsonFileStorage,
  ConfigLoader,
  LLMProviderFactory,
  type StorageAdapter,
} from '@star-rail/infrastructure';

/**
 * 初始化 DI 容器
 * @param options 初始化选项
 */
export function initializeContainer(options: {
  dataDir?: string;
  configDir?: string;
  llmConfig: LLMConfig;
}): void {
  const { dataDir = './data', configDir = './config', llmConfig } = options;

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
    useValue: llmConfig,
  });

  // 注册 LLM Provider 工厂
  container.registerSingleton<LLMProviderFactory>(
    'LLMProviderFactory',
    LLMProviderFactory
  );
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
