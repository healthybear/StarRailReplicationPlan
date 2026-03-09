/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-console */
/**
 * 简单的冒烟测试
 * 验证测试框架和基础设施是否正常工作
 */

import { describe, it, expect } from 'vitest';

describe('E2E 测试框架验证', () => {
  it('应该能够运行基本测试', () => {
    expect(true).toBe(true);
  });

  it('应该能够导入 types 包', async () => {
    const types = await import('@star-rail/types');
    expect(types).toBeDefined();
  });

  it('应该能够创建 Mock LLM Provider', async () => {
    const { MockLLMProvider } = await import('./helpers/mock-llm-provider');
    const mockLLM = new MockLLMProvider();
    expect(mockLLM).toBeDefined();

    const response = await mockLLM.generate([
      { role: 'user', content: '测试' },
    ]);
    expect(response.content).toBeTruthy();
  });
});
