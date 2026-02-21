import type { LLMProviderConfig } from '@star-rail/types';
import { ClaudeProvider } from '../claude.provider.js';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
      },
    })),
  };
});

// Mock EnvLoader
jest.mock('../../../config/env-loader.js', () => ({
  EnvLoader: {
    getRequired: jest.fn().mockReturnValue('test-api-key'),
    load: jest.fn(),
    loaded: false,
  },
}));

const makeConfig = (
  overrides?: Partial<LLMProviderConfig>
): LLMProviderConfig => ({
  enabled: true,
  model: 'claude-3-5-sonnet-20241022',
  defaultParams: {
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.95,
  },
  ...overrides,
});

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const Anthropic = jest.requireMock('@anthropic-ai/sdk').default;
    mockCreate = jest.fn();
    Anthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }));
    provider = new ClaudeProvider(makeConfig());
  });

  it('getName 返回 claude', () => {
    expect(provider.getName()).toBe('claude');
  });

  it('generate 正常返回响应', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '你好，我是凯文' }],
      usage: { input_tokens: 10, output_tokens: 20 },
      stop_reason: 'end_turn',
    });

    const result = await provider.generate([
      { role: 'user', content: '你是谁？' },
    ]);

    expect(result.content).toBe('你好，我是凯文');
    expect(result.usage?.promptTokens).toBe(10);
    expect(result.usage?.completionTokens).toBe(20);
    expect(result.usage?.totalTokens).toBe(30);
    expect(result.finishReason).toBe('stop');
  });

  it('generate 分离 system 消息', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '回复' }],
      usage: { input_tokens: 5, output_tokens: 5 },
      stop_reason: 'end_turn',
    });

    await provider.generate([
      { role: 'system', content: '你是一个助手' },
      { role: 'user', content: '你好' },
    ]);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toBe('你是一个助手');
    expect(callArgs.messages).toHaveLength(1);
    expect(callArgs.messages[0].role).toBe('user');
  });

  it('generate stop_reason 为 max_tokens 时 finishReason 为 length', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '截断' }],
      usage: { input_tokens: 5, output_tokens: 2000 },
      stop_reason: 'max_tokens',
    });

    const result = await provider.generate([
      { role: 'user', content: '写长文' },
    ]);
    expect(result.finishReason).toBe('length');
  });

  it('generate 其他 stop_reason 时 finishReason 为 undefined', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '回复' }],
      usage: { input_tokens: 5, output_tokens: 5 },
      stop_reason: 'stop_sequence',
    });

    const result = await provider.generate([{ role: 'user', content: '你好' }]);
    expect(result.finishReason).toBeUndefined();
  });

  it('generate 无 text 内容时返回空字符串', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'tool_use', id: 'tool-1' }],
      usage: { input_tokens: 5, output_tokens: 5 },
      stop_reason: 'end_turn',
    });

    const result = await provider.generate([{ role: 'user', content: '你好' }]);
    expect(result.content).toBe('');
  });

  it('generate 使用 options 覆盖默认参数', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '回复' }],
      usage: { input_tokens: 5, output_tokens: 5 },
      stop_reason: 'end_turn',
    });

    await provider.generate([{ role: 'user', content: '你好' }], {
      temperature: 0.1,
      maxTokens: 500,
      topP: 0.8,
      stopSequences: ['END'],
    });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.temperature).toBe(0.1);
    expect(callArgs.max_tokens).toBe(500);
    expect(callArgs.top_p).toBe(0.8);
    expect(callArgs.stop_sequences).toEqual(['END']);
  });
});
