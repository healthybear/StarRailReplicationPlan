import 'reflect-metadata';
import {
  InputParser,
  InputType,
  type ParsedInvalid,
  type ParsedDialogue,
  type ParsedCommand,
  type ParsedUnauthorized,
} from '../input-parser.js';

describe('InputParser', () => {
  let parser: InputParser;

  beforeEach(() => {
    parser = new InputParser();
    // 注册测试用人物
    parser.registerCharacters([
      { id: 'march7', name: '三月七' },
      { id: 'stelle', name: '星' },
      { id: 'danheng', name: '丹恒' },
      { id: 'himeko', name: '姬子' },
    ]);
  });

  describe('Input Classification (P1-IP-01)', () => {
    it('should classify empty input as invalid', () => {
      const result = parser.parse('');
      expect(result.type).toBe(InputType.Invalid);
      expect((result as ParsedInvalid).reason).toBe('输入为空');
    });

    it('should classify whitespace-only input as invalid', () => {
      const result = parser.parse('   ');
      expect(result.type).toBe(InputType.Invalid);
    });

    it('should classify dialogue input correctly', () => {
      const result = parser.parse('对三月七说：你好');
      expect(result.type).toBe(InputType.Dialogue);
    });

    it('should classify command input correctly', () => {
      const result = parser.parse('让三月七去调查');
      expect(result.type).toBe(InputType.Command);
    });

    it('should classify unrecognized input as invalid', () => {
      const result = parser.parse('随便说点什么');
      expect(result.type).toBe(InputType.Invalid);
      expect((result as ParsedInvalid).reason).toBe('无法识别的输入格式');
    });
  });

  describe('Dialogue Parsing (P1-IP-02)', () => {
    it('should parse dialogue with colon format', () => {
      const result = parser.parse('对三月七说：你好啊');
      expect(result.type).toBe(InputType.Dialogue);
      expect((result as ParsedDialogue).targetCharacterId).toBe('march7');
      expect((result as ParsedDialogue).content).toBe('你好啊');
    });

    it('should parse dialogue with quotes', () => {
      const result = parser.parse('对三月七说："你好啊"');
      expect(result.type).toBe(InputType.Dialogue);
      expect((result as ParsedDialogue).content).toBe('你好啊');
    });

    it('should parse dialogue with 跟...说 format', () => {
      const result = parser.parse('跟丹恒说：我们出发吧');
      expect(result.type).toBe(InputType.Dialogue);
      expect((result as ParsedDialogue).targetCharacterId).toBe('danheng');
    });

    it('should parse dialogue with 告诉 format', () => {
      const result = parser.parse('告诉姬子：任务完成了');
      expect(result.type).toBe(InputType.Dialogue);
      expect((result as ParsedDialogue).targetCharacterId).toBe('himeko');
    });

    it('should handle partial character name match', () => {
      const result = parser.parse('对三月说：测试');
      expect(result.type).toBe(InputType.Dialogue);
      expect((result as ParsedDialogue).targetCharacterId).toBe('march7');
    });
  });

  describe('Command Parsing (P1-IP-02)', () => {
    it('should parse command with 让...去 format', () => {
      const result = parser.parse('让三月七去调查房间');
      expect(result.type).toBe(InputType.Command);
      expect((result as ParsedCommand).targetCharacterId).toBe('march7');
      expect((result as ParsedCommand).action).toBe('调查房间');
    });

    it('should parse command with 让... format (no 去)', () => {
      const result = parser.parse('让丹恒休息');
      expect(result.type).toBe(InputType.Command);
      expect((result as ParsedCommand).targetCharacterId).toBe('danheng');
      expect((result as ParsedCommand).action).toBe('休息');
    });

    it('should parse command with 命令 format', () => {
      const result = parser.parse('命令三月七攻击敌人');
      expect(result.type).toBe(InputType.Command);
      expect((result as ParsedCommand).action).toBe('攻击敌人');
    });

    it('should parse command with 指示 format', () => {
      const result = parser.parse('指示姬子准备战斗');
      expect(result.type).toBe(InputType.Command);
      expect((result as ParsedCommand).targetCharacterId).toBe('himeko');
    });

    it('should parse command with [人物]去[动作] format', () => {
      const result = parser.parse('三月七去探索');
      expect(result.type).toBe(InputType.Command);
      expect((result as ParsedCommand).action).toBe('探索');
    });
  });

  describe('Permission Check (P1-IP-03)', () => {
    it('should allow all operations when no controllable characters set', () => {
      const result = parser.parse('让三月七去调查');
      expect(result.type).toBe(InputType.Command);
    });

    it('should reject unauthorized character control', () => {
      parser.setControllableCharacters(['march7']);

      const result = parser.parse('让丹恒去调查');
      expect(result.type).toBe(InputType.Unauthorized);
      expect((result as ParsedUnauthorized).reason).toBe('无权控制该角色');
      expect((result as ParsedUnauthorized).targetCharacterId).toBe('danheng');
    });

    it('should allow authorized character control', () => {
      parser.setControllableCharacters(['march7', 'danheng']);

      const result = parser.parse('让三月七去调查');
      expect(result.type).toBe(InputType.Command);
    });

    it('should reject forbidden actions', () => {
      const result = parser.parse('让三月七去删除数据');
      expect(result.type).toBe(InputType.Unauthorized);
      expect((result as ParsedUnauthorized).reason).toContain('禁止的操作');
    });

    it('should reject operations on immutable anchors', () => {
      parser.addImmutableAnchor('核心剧情');

      const result = parser.parse('让三月七修改核心剧情');
      expect(result.type).toBe(InputType.Unauthorized);
      expect((result as ParsedUnauthorized).reason).toContain('不可修改的内容');
    });

    it('should add controllable character correctly', () => {
      parser.setControllableCharacters(['march7']);
      parser.addControllableCharacter('danheng');

      const result = parser.parse('让丹恒去调查');
      expect(result.type).toBe(InputType.Command);
    });
  });

  describe('Permission Configuration', () => {
    it('should set permission config correctly', () => {
      parser.setPermissionConfig({
        controllableCharacters: ['march7'],
        forbiddenActions: ['测试禁止'],
      });

      const config = parser.getPermissionConfig();
      expect(config.controllableCharacters).toContain('march7');
      expect(config.forbiddenActions).toContain('测试禁止');
    });

    it('should merge permission config with defaults', () => {
      parser.setPermissionConfig({
        controllableCharacters: ['march7'],
      });

      const config = parser.getPermissionConfig();
      // 默认的禁止动作应该保留
      expect(config.forbiddenActions).toContain('删除');
    });
  });

  describe('Character Registration', () => {
    it('should register character correctly', () => {
      parser.clearCharacters();
      parser.registerCharacter('test_id', '测试角色');

      const result = parser.parse('对测试角色说：你好');
      expect(result.type).toBe(InputType.Dialogue);
      expect((result as ParsedDialogue).targetCharacterId).toBe('test_id');
    });

    it('should get registered characters', () => {
      const characters = parser.getRegisteredCharacters();
      expect(characters.length).toBe(4);
      expect(characters.some((c) => c.id === 'march7')).toBe(true);
    });

    it('should clear characters correctly', () => {
      parser.clearCharacters();
      const characters = parser.getRegisteredCharacters();
      expect(characters.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown character name', () => {
      const result = parser.parse('对未知角色说：你好');
      expect(result.type).toBe(InputType.Invalid);
    });

    it('should handle case-insensitive character matching', () => {
      parser.registerCharacter('test', 'TestChar');
      const result = parser.parse('对testchar说：你好');
      expect(result.type).toBe(InputType.Dialogue);
    });

    it('should handle multiple forbidden actions in one input', () => {
      const result = parser.parse('让三月七删除并销毁数据');
      expect(result.type).toBe(InputType.Unauthorized);
    });
  });

  describe('Unauthorized Response Format', () => {
    it('should include attempted action in unauthorized response', () => {
      parser.setControllableCharacters(['march7']);

      const result = parser.parse('让丹恒去调查房间');
      expect(result.type).toBe(InputType.Unauthorized);
      expect((result as ParsedUnauthorized).attemptedAction).toBe('调查房间');
    });

    it('should include target character in unauthorized response', () => {
      parser.setControllableCharacters(['march7']);

      const result = parser.parse('对丹恒说：你好');
      expect(result.type).toBe(InputType.Unauthorized);
      expect((result as ParsedUnauthorized).targetCharacterId).toBe('danheng');
    });
  });
});
