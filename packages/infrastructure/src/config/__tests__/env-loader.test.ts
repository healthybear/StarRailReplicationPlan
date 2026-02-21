import { EnvLoader } from '../env-loader.js';

describe('EnvLoader', () => {
  // 重置 loaded 状态，避免测试间相互影响
  beforeEach(() => {
    // 通过访问私有属性重置
    (EnvLoader as unknown as { loaded: boolean }).loaded = false;
  });

  describe('load', () => {
    it('重复调用不会重复加载', () => {
      EnvLoader.load();
      EnvLoader.load(); // 第二次调用应直接返回
      expect((EnvLoader as unknown as { loaded: boolean }).loaded).toBe(true);
    });

    it('可以指定自定义路径', () => {
      // 指定不存在的路径不会抛出，dotenv 会静默处理
      expect(() => EnvLoader.load('/nonexistent/.env')).not.toThrow();
    });
  });

  describe('get', () => {
    it('获取已设置的环境变量', () => {
      process.env.TEST_VAR_GET = 'hello';
      const val = EnvLoader.get('TEST_VAR_GET');
      expect(val).toBe('hello');
      delete process.env.TEST_VAR_GET;
    });

    it('变量不存在时使用默认值', () => {
      delete process.env.TEST_VAR_MISSING;
      const val = EnvLoader.get('TEST_VAR_MISSING', 'default');
      expect(val).toBe('default');
    });

    it('变量不存在且无默认值时抛出错误', () => {
      delete process.env.TEST_VAR_THROW;
      expect(() => EnvLoader.get('TEST_VAR_THROW')).toThrow(
        'TEST_VAR_THROW is not set'
      );
    });
  });

  describe('getRequired', () => {
    it('获取已设置的必需变量', () => {
      process.env.TEST_REQUIRED = 'required_val';
      expect(EnvLoader.getRequired('TEST_REQUIRED')).toBe('required_val');
      delete process.env.TEST_REQUIRED;
    });

    it('变量不存在时抛出错误', () => {
      delete process.env.TEST_REQUIRED_MISSING;
      expect(() => EnvLoader.getRequired('TEST_REQUIRED_MISSING')).toThrow(
        'TEST_REQUIRED_MISSING is not set'
      );
    });
  });

  describe('getOptional', () => {
    it('获取已设置的可选变量', () => {
      process.env.TEST_OPTIONAL = 'opt_val';
      expect(EnvLoader.getOptional('TEST_OPTIONAL')).toBe('opt_val');
      delete process.env.TEST_OPTIONAL;
    });

    it('变量不存在时返回 undefined', () => {
      delete process.env.TEST_OPTIONAL_MISSING;
      expect(EnvLoader.getOptional('TEST_OPTIONAL_MISSING')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('变量存在时返回 true', () => {
      process.env.TEST_HAS = 'yes';
      expect(EnvLoader.has('TEST_HAS')).toBe(true);
      delete process.env.TEST_HAS;
    });

    it('变量不存在时返回 false', () => {
      delete process.env.TEST_HAS_MISSING;
      expect(EnvLoader.has('TEST_HAS_MISSING')).toBe(false);
    });
  });
});
