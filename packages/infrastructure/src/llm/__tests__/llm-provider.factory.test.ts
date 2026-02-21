import type { LLMConfig } from '@star-rail/types';
import { LLMProviderFactory } from '../llm-provider.factory.js';

// Mock providers 避免真实 API 调用
jest.mock('../providers/deepseek.provider.js', () => ({
  DeepseekProvider: jest.fn().mockImplementation(() => ({
    getName: () => 'deepseek',
    generate: jest.fn(),
  })),
}));

jest.mock('../providers/claude.provider.js', () => ({
  ClaudeProvider: jest.fn().mockImplementation(() => ({
    getName: () => 'claude',
    generate: jest.fn(),
  })),
}));

// Mock tsyringe
jest.mock('tsyringe', () => ({
  injectable: () => () => {},
  inject: () => () => {},
}));

const makeConfig = (overrides?: Partial<LLMConfig>): LLMConfig => ({
  defaultProvider: 'deepseek',
  providers: {
    deepseek: {
      enabled: true,
      model: 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com/v1',
    },
    claude: {
      enabled: true,
      model: 'claude-3-5-sonnet-20241022',
    },
  },
  ...overrides,
});

describe('LLMProviderFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 设置必要的环境变量
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  });

  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe('初始化', () => {
    it('应初始化已启用的 providers', () => {
      const factory = new LLMProviderFactory(makeConfig());
      expect(factory.listProviders()).toContain('deepseek');
      expect(factory.listProviders()).toContain('claude');
    });

    it('应跳过未启用的 provider', () => {
      const config = makeConfig();
      config.providers.claude = {
        enabled: false,
        model: 'claude-3-5-sonnet-20241022',
      };
      const factory = new LLMProviderFactory(config);
      expect(factory.hasProvider('claude')).toBe(false);
      expect(factory.hasProvider('deepseek')).toBe(true);
    });

    it('应忽略未知 provider 类型（不抛出）', () => {
      const config = makeConfig();
      (config.providers as Record<string, unknown>)['unknown-provider'] = {
        enabled: true,
        model: 'unknown-model',
      };
      expect(() => new LLMProviderFactory(config)).not.toThrow();
    });
  });

  describe('getProvider', () => {
    it('不传参数时返回默认 provider', () => {
      const factory = new LLMProviderFactory(makeConfig());
      const provider = factory.getProvider();
      expect(provider.getName()).toBe('deepseek');
    });

    it('传入名称时返回对应 provider', () => {
      const factory = new LLMProviderFactory(makeConfig());
      const provider = factory.getProvider('claude');
      expect(provider.getName()).toBe('claude');
    });

    it('provider 不存在时抛出错误', () => {
      const factory = new LLMProviderFactory(makeConfig());
      expect(() => factory.getProvider('nonexistent')).toThrow(
        'LLM provider not found: nonexistent'
      );
    });
  });

  describe('getProviderForCharacter', () => {
    it('角色有专用 provider 时返回对应 provider', () => {
      const config = makeConfig({
        characterProviders: { 'char-001': 'claude' },
      });
      const factory = new LLMProviderFactory(config);
      const provider = factory.getProviderForCharacter('char-001');
      expect(provider.getName()).toBe('claude');
    });

    it('角色无专用 provider 时返回默认 provider', () => {
      const factory = new LLMProviderFactory(makeConfig());
      const provider = factory.getProviderForCharacter('char-unknown');
      expect(provider.getName()).toBe('deepseek');
    });
  });

  describe('listProviders', () => {
    it('返回所有已启用 provider 名称', () => {
      const factory = new LLMProviderFactory(makeConfig());
      const list = factory.listProviders();
      expect(list).toHaveLength(2);
      expect(list).toContain('deepseek');
      expect(list).toContain('claude');
    });
  });

  describe('hasProvider', () => {
    it('存在的 provider 返回 true', () => {
      const factory = new LLMProviderFactory(makeConfig());
      expect(factory.hasProvider('deepseek')).toBe(true);
    });

    it('不存在的 provider 返回 false', () => {
      const factory = new LLMProviderFactory(makeConfig());
      expect(factory.hasProvider('gpt4')).toBe(false);
    });
  });
});
