import { Logger, createLogger } from '../logger.js';

// Mock winston 避免实际写文件
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(() => ({})),
      timestamp: jest.fn(() => ({})),
      errors: jest.fn(() => ({})),
      json: jest.fn(() => ({})),
      colorize: jest.fn(() => ({})),
      simple: jest.fn(() => ({})),
    },
    transports: {
      File: jest.fn().mockImplementation(() => ({})),
      Console: jest.fn().mockImplementation(() => ({})),
    },
  };
});

describe('Logger', () => {
  let logger: Logger;
  let mockWinstonLogger: {
    info: jest.Mock;
    error: jest.Mock;
    warn: jest.Mock;
    debug: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const winston = jest.requireMock('winston');
    mockWinstonLogger = winston.createLogger();
    logger = new Logger('test-module');
  });

  it('info 调用底层 logger.info', () => {
    logger.info('信息消息', { key: 'val' });
    expect(mockWinstonLogger.info).toHaveBeenCalledWith('信息消息', {
      key: 'val',
    });
  });

  it('info 不传 meta 时正常调用', () => {
    logger.info('无 meta 消息');
    expect(mockWinstonLogger.info).toHaveBeenCalledWith(
      '无 meta 消息',
      undefined
    );
  });

  it('error 调用底层 logger.error', () => {
    const err = new Error('测试错误');
    logger.error('错误消息', err, { extra: 'data' });
    expect(mockWinstonLogger.error).toHaveBeenCalledWith('错误消息', {
      error: err,
      extra: 'data',
    });
  });

  it('error 不传 error 和 meta 时正常调用', () => {
    logger.error('仅消息');
    expect(mockWinstonLogger.error).toHaveBeenCalledWith('仅消息', {
      error: undefined,
    });
  });

  it('warn 调用底层 logger.warn', () => {
    logger.warn('警告消息', { code: 1 });
    expect(mockWinstonLogger.warn).toHaveBeenCalledWith('警告消息', {
      code: 1,
    });
  });

  it('debug 调用底层 logger.debug', () => {
    logger.debug('调试消息');
    expect(mockWinstonLogger.debug).toHaveBeenCalledWith('调试消息', undefined);
  });
});

describe('createLogger', () => {
  it('返回 Logger 实例', () => {
    const logger = createLogger('my-module');
    expect(logger).toBeInstanceOf(Logger);
  });
});
