/**
 * 应用错误类
 * 统一的错误处理
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public override message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * 配置错误
 */
export class ConfigError extends AppError {
  constructor(message: string, details?: unknown) {
    super('CONFIG_ERROR', message, 400, details);
    this.name = 'ConfigError';
  }
}

/**
 * 存储错误
 */
export class StorageError extends AppError {
  constructor(message: string, details?: unknown) {
    super('STORAGE_ERROR', message, 500, details);
    this.name = 'StorageError';
  }
}

/**
 * LLM 错误
 */
export class LLMError extends AppError {
  constructor(message: string, details?: unknown) {
    super('LLM_ERROR', message, 502, details);
    this.name = 'LLMError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * 未找到错误
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} not found: ${id}`, 404, { resource, id });
    this.name = 'NotFoundError';
  }
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  /**
   * 处理错误并输出日志
   */
  static handle(error: Error): void {
    if (error instanceof AppError) {
      console.error(`[${error.code}] ${error.message}`);
      if (error.details) {
        console.error('Details:', error.details);
      }
    } else {
      console.error('Unexpected error:', error.message);
      console.error(error.stack);
    }
  }

  /**
   * 异步错误处理包装器
   */
  static async handleAsync<T>(
    fn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      if (errorMessage) {
        console.error(errorMessage);
      }
      this.handle(error as Error);
      return null;
    }
  }
}
