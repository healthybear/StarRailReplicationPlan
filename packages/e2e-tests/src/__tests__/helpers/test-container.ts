/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-console */
/**
 * 测试容器辅助工具
 * 封装 tsyringe 容器设置，简化测试中的依赖注入
 */

import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';
import type { StorageAdapter } from '@star-rail/infrastructure';
import { MemoryStorageAdapter } from './memory-storage-adapter';
import { MockLLMProvider } from './mock-llm-provider';

export class TestContainer {
  private testContainer: DependencyContainer;

  constructor() {
    // 创建子容器，避免污染全局容器
    this.testContainer = container.createChildContainer();
  }

  /**
   * 设置测试存储（内存存储）
   */
  setupStorage(basePath: string = './test-data'): void {
    const storage = new MemoryStorageAdapter(basePath);
    this.testContainer.register<StorageAdapter>('StorageAdapter', {
      useValue: storage,
    });
  }

  /**
   * 设置 Mock LLM Provider
   */
  setupMockLLM(): void {
    const mockLLM = new MockLLMProvider();

    // 注册 LLMProviderFactory
    this.testContainer.register('LLMProviderFactory', {
      useValue: {
        create: () => mockLLM,
        getProvider: () => mockLLM,
      },
    });
  }

  /**
   * 注册 mock 服务
   */
  registerMock<T>(token: string | symbol, mockInstance: T): void {
    this.testContainer.register(token, { useValue: mockInstance });
  }

  /**
   * 解析服务实例
   */
  resolve<T>(token: string | symbol | { new (...args: any[]): T }): T {
    return this.testContainer.resolve(token as any);
  }

  /**
   * 清理容器
   */
  cleanup(): void {
    this.testContainer.clearInstances();
  }

  /**
   * 获取原始容器（用于高级场景）
   */
  getContainer(): DependencyContainer {
    return this.testContainer;
  }
}

/**
 * 创建测试容器的便捷函数
 */
export function createTestContainer(): TestContainer {
  const testContainer = new TestContainer();
  testContainer.setupStorage();
  testContainer.setupMockLLM();
  return testContainer;
}
