import {
  AppError,
  ConfigError,
  StorageError,
  LLMError,
  ValidationError,
  NotFoundError,
  ErrorHandler,
} from '../app-error.js';

describe('AppError', () => {
  it('应正确创建基础错误', () => {
    const err = new AppError('TEST_CODE', '测试错误', 400, { key: 'val' });
    expect(err.code).toBe('TEST_CODE');
    expect(err.message).toBe('测试错误');
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual({ key: 'val' });
    expect(err.name).toBe('AppError');
    expect(err instanceof Error).toBe(true);
  });

  it('statusCode 默认值为 500', () => {
    const err = new AppError('CODE', 'msg');
    expect(err.statusCode).toBe(500);
  });

  it('toJSON 返回正确结构', () => {
    const err = new AppError('CODE', 'msg', 400, { x: 1 });
    const json = err.toJSON();
    expect(json).toEqual({
      name: 'AppError',
      code: 'CODE',
      message: 'msg',
      statusCode: 400,
      details: { x: 1 },
    });
  });
});

describe('ConfigError', () => {
  it('应正确创建配置错误', () => {
    const err = new ConfigError('配置缺失', { field: 'apiKey' });
    expect(err.code).toBe('CONFIG_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('ConfigError');
    expect(err instanceof AppError).toBe(true);
  });
});

describe('StorageError', () => {
  it('应正确创建存储错误', () => {
    const err = new StorageError('写入失败');
    expect(err.code).toBe('STORAGE_ERROR');
    expect(err.statusCode).toBe(500);
    expect(err.name).toBe('StorageError');
  });
});

describe('LLMError', () => {
  it('应正确创建 LLM 错误', () => {
    const err = new LLMError('API 超时');
    expect(err.code).toBe('LLM_ERROR');
    expect(err.statusCode).toBe(502);
    expect(err.name).toBe('LLMError');
  });
});

describe('ValidationError', () => {
  it('应正确创建验证错误', () => {
    const err = new ValidationError('字段无效', { field: 'name' });
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('ValidationError');
  });
});

describe('NotFoundError', () => {
  it('应正确创建未找到错误', () => {
    const err = new NotFoundError('Session', 'sess-001');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe('NotFoundError');
    expect(err.message).toContain('sess-001');
    expect(err.details).toEqual({ resource: 'Session', id: 'sess-001' });
  });
});

describe('ErrorHandler', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('handle 处理 AppError', () => {
    const err = new AppError('CODE', 'msg', 400, { x: 1 });
    ErrorHandler.handle(err);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('handle 处理普通 Error', () => {
    const err = new Error('普通错误');
    ErrorHandler.handle(err);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('handle 处理无 details 的 AppError', () => {
    const err = new AppError('CODE', 'msg');
    ErrorHandler.handle(err);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it('handleAsync 成功时返回结果', async () => {
    const result = await ErrorHandler.handleAsync(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('handleAsync 失败时返回 null', async () => {
    const result = await ErrorHandler.handleAsync(() =>
      Promise.reject(new Error('失败'))
    );
    expect(result).toBeNull();
  });

  it('handleAsync 失败时输出自定义错误信息', async () => {
    await ErrorHandler.handleAsync(
      () => Promise.reject(new Error('失败')),
      '自定义错误信息'
    );
    expect(consoleSpy).toHaveBeenCalledWith('自定义错误信息');
  });
});
