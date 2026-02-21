import type { LLMProviderConfig } from '@star-rail/types';
import { DeepseekProvider } from '../deepseek.provider.js';

// Mock OpenAI SDK
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
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
  model: 'deepseek-chat',
  baseUrl: 'https://api.deepseek.com/v1',
  defaultParams: {
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.95,
  },
  ...overrides,
});

describe('DeepseekProvider', () => {
  let provider: DeepseekProvider;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const OpenAI = jest.requireMock('openai').default;
    mockCreate = jest.fn();
    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }));
    provider = new DeepseekProvider(makeConfig());
  });

  it('getName 返回 deepseek', () => {
    expect(provider.getName()).toBe('deepseek');
  });

  it('generate 正常返回响应', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: { content: '你好，我是 Deepseek' },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    });

    const result = await provider.generate([
      { role: 'user', content: '你是谁？' },
    ]);

    expect(result.content).toBe('你好，我是 Deepseek');
    expect(result.usage?.promptTokens).toBe(10);
    expect(result.usage?.completionTokens).toBe(20);
    expect(result.usage?.totalTokens).toBe(30);
    expect(result.finishReason).toBe('stop');
  });

  it('generate finish_reason 为 length 时 finishReason 为 length', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '截断' }, finish_reason: 'length' }],
      usage: { prompt_tokens: 5, completion_tokens: 2000, total_tokens: 2005 },
    });

    const result = await provider.generate([
      { role: 'user', content: '写长文' },
    ]);
    expect(result.finishReason).toBe('length');
  });

  it('generate 其他 finish_reason 时 finishReason 为 undefined', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        { message: { content: '回复' }, finish_reason: 'content_filter' },
      ],
      usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
    });

    const result = await provider.generate([{ role: 'user', content: '你好' }]);
    expect(result.finishReason).toBeUndefined();
  });

  it('generate 无 usage 时 usage 为 undefined', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '回复' }, finish_reason: 'stop' }],
      usage: null,
    });

    const result = await provider.generate([{ role: 'user', content: '你好' }]);
    expect(result.usage).toBeUndefined();
  });

  it('generate message.content 为 null 时返回空字符串', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
    });

    const result = await provider.generate([{ role: 'user', content: '你好' }]);
    expect(result.content).toBe('');
  });

  it('generate 使用 options 覆盖默认参数', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '回复' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
    });

    await provider.generate([{ role: 'user', content: '你好' }], {
      temperature: 0.2,
      maxTokens: 300,
      topP: 0.9,
      stopSequences: ['STOP'],
    });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.temperature).toBe(0.2);
    expect(callArgs.max_tokens).toBe(300);
    expect(callArgs.top_p).toBe(0.9);
    expect(callArgs.stop).toEqual(['STOP']);
  });

  it('不传 baseUrl 时使用默认地址', () => {
    const OpenAI = jest.requireMock('openai').default;
    new DeepseekProvider(makeConfig({ baseUrl: undefined }));
    const callArgs = OpenAI.mock.calls[OpenAI.mock.calls.length - 1][0];
    expect(callArgs.baseURL).toBe('https://api.deepseek.com/v1');
  });
});
