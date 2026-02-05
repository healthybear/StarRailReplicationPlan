/**
 * LLM 消息格式
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM 生成选项
 */
export interface LLMGenerateOptions {
  /** 温度 (0-2) */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
  /** Top P */
  topP?: number;
  /** 停止序列 */
  stopSequences?: string[];
}

/**
 * LLM 生成响应
 */
export interface LLMGenerateResponse {
  /** 生成的内容 */
  content: string;
  /** Token 使用统计 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** 结束原因 */
  finishReason?: 'stop' | 'length' | 'content_filter';
}

/**
 * LLM 流式输出块（Phase 2-3）
 */
export interface LLMStreamChunk {
  content: string;
  isComplete: boolean;
}

/**
 * LLM Provider 接口
 * 定义 LLM 服务的统一调用接口
 */
export interface LLMProvider {
  /**
   * 生成响应
   * @param messages 消息列表
   * @param options 生成选项
   */
  generate(
    messages: LLMMessage[],
    options?: LLMGenerateOptions
  ): Promise<LLMGenerateResponse>;

  /**
   * 获取 Provider 名称
   */
  getName(): string;

  /**
   * 流式生成响应（Phase 2-3 扩展）
   */
  generateStream?(
    messages: LLMMessage[],
    options?: LLMGenerateOptions
  ): AsyncIterable<LLMStreamChunk>;
}
