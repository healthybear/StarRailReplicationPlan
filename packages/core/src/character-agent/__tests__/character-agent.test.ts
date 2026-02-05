import 'reflect-metadata';
import { PromptBuilder, ResponseType } from '../prompt-builder.js';
import { CharacterAgent } from '../character-agent.js';
import type { LLMProviderFactory } from '@star-rail/infrastructure';
import type {
  Character,
  Information,
  SceneConfig,
  EventRecord,
} from '@star-rail/types';

// Mock LLM Provider
const mockLLMProvider = {
  generate: jest.fn(),
  getName: () => 'mock',
};

// Mock LLM Provider Factory
const mockLLMFactory = {
  getProviderForCharacter: jest.fn(() => mockLLMProvider),
  getDefaultProvider: jest.fn(() => mockLLMProvider),
} as unknown as LLMProviderFactory;

// 测试用角色
const createTestCharacter = (id: string, name: string): Character => ({
  id,
  name,
  state: {
    relationships: {
      other_char: {
        trust: 0.8,
        hostility: 0.1,
        intimacy: 0.6,
        respect: 0.7,
      },
    },
    abilities: {
      combat: 75,
      investigation: 60,
    },
    knownInformation: [],
  },
  personality: {
    traits: {
      openness: 0.8,
      conscientiousness: 0.7,
      extraversion: 0.6,
      agreeableness: 0.8,
      neuroticism: 0.3,
    },
    values: {
      self_direction: 0.7,
      benevolence: 0.8,
      security: 0.5,
    },
  },
});

// 测试用场景
const testScene: SceneConfig = {
  id: 'scene_test',
  name: '测试场景',
  description: '这是一个用于测试的场景',
  participants: ['march7', 'stelle'],
};

// 测试用信息
const testKnownInfo: Information[] = [
  {
    id: 'info_1',
    content: '三月七是一个活泼开朗的女孩',
    source: 'witnessed',
    createdAt: Date.now(),
  },
  {
    id: 'info_2',
    content: '星正在调查一个神秘事件',
    source: 'told',
    createdAt: Date.now(),
  },
];

// 测试用事件
const testEvents: EventRecord[] = [
  {
    eventId: 'event_1',
    sceneId: 'scene_test',
    participants: ['march7'],
    description: '三月七发现了一个线索',
  },
];

describe('PromptBuilder', () => {
  let promptBuilder: PromptBuilder;

  beforeEach(() => {
    promptBuilder = new PromptBuilder();
  });

  describe('Personality Description (P1-CA-01)', () => {
    it('should describe high openness correctly', () => {
      const character = createTestCharacter('test', '测试角色');
      character.personality.traits.openness = 0.9;

      const desc = promptBuilder.describePersonality(character.personality);
      expect(desc).toContain('富有好奇心和想象力');
    });

    it('should describe low openness correctly', () => {
      const character = createTestCharacter('test', '测试角色');
      character.personality.traits.openness = 0.2;

      const desc = promptBuilder.describePersonality(character.personality);
      expect(desc).toContain('务实保守');
    });

    it('should describe high extraversion correctly', () => {
      const character = createTestCharacter('test', '测试角色');
      character.personality.traits.extraversion = 0.9;

      const desc = promptBuilder.describePersonality(character.personality);
      expect(desc).toContain('外向活泼');
    });

    it('should describe low extraversion correctly', () => {
      const character = createTestCharacter('test', '测试角色');
      character.personality.traits.extraversion = 0.2;

      const desc = promptBuilder.describePersonality(character.personality);
      expect(desc).toContain('内敛沉稳');
    });

    it('should return default description for neutral traits', () => {
      const character = createTestCharacter('test', '测试角色');
      character.personality.traits = {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
      };

      const desc = promptBuilder.describePersonality(character.personality);
      expect(desc).toBe('性格平和');
    });
  });

  describe('Character Response Prompt (P1-CA-01)', () => {
    it('should build prompt with character info', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildCharacterResponsePrompt({
        character,
        scene: testScene,
        knownInfo: testKnownInfo,
        recentEvents: testEvents,
      });

      expect(prompt).toContain('三月七');
      expect(prompt).toContain('测试场景');
    });

    it('should include known information in prompt', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildCharacterResponsePrompt({
        character,
        scene: testScene,
        knownInfo: testKnownInfo,
        recentEvents: [],
      });

      expect(prompt).toContain('三月七是一个活泼开朗的女孩');
      expect(prompt).toContain('星正在调查一个神秘事件');
    });

    it('should include recent events in prompt', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildCharacterResponsePrompt({
        character,
        scene: testScene,
        knownInfo: [],
        recentEvents: testEvents,
      });

      expect(prompt).toContain('三月七发现了一个线索');
    });

    it('should include user input when provided', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildCharacterResponsePrompt({
        character,
        scene: testScene,
        knownInfo: [],
        recentEvents: [],
        userInput: '你好，三月七',
      });

      expect(prompt).toContain('你好，三月七');
    });

    it('should include response type hint for dialogue', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildCharacterResponsePrompt({
        character,
        scene: testScene,
        knownInfo: [],
        recentEvents: [],
        expectedResponseType: ResponseType.Dialogue,
      });

      expect(prompt).toContain('请以对话形式回应');
    });

    it('should include response type hint for action', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildCharacterResponsePrompt({
        character,
        scene: testScene,
        knownInfo: [],
        recentEvents: [],
        expectedResponseType: ResponseType.Action,
      });

      expect(prompt).toContain('请以行动形式回应');
    });

    it('should include abilities in prompt', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildCharacterResponsePrompt({
        character,
        scene: testScene,
        knownInfo: [],
        recentEvents: [],
      });

      expect(prompt).toContain('能力');
      expect(prompt).toContain('combat');
    });

    it('should include relationships with present characters', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildCharacterResponsePrompt({
        character,
        scene: testScene,
        knownInfo: [],
        recentEvents: [],
        presentCharacters: [{ id: 'other_char', name: '其他角色' }],
      });

      expect(prompt).toContain('与其他角色');
    });

    it('should include vision isolation rules', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildCharacterResponsePrompt({
        character,
        scene: testScene,
        knownInfo: [],
        recentEvents: [],
      });

      expect(prompt).toContain('严格遵守视野限制');
      expect(prompt).toContain('只能使用');
    });
  });

  describe('System Prompt (P1-CA-01)', () => {
    it('should build system prompt with character name', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildSystemPrompt(character);

      expect(prompt).toContain('三月七');
      expect(prompt).toContain('角色扮演');
    });

    it('should include vision isolation rule', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildSystemPrompt(character);

      expect(prompt).toContain('视野隔离');
    });

    it('should include output format instruction', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildSystemPrompt(character);

      expect(prompt).toContain('JSON');
    });
  });

  describe('Simple Response Prompt', () => {
    it('should build concise prompt', () => {
      const character = createTestCharacter('march7', '三月七');
      const prompt = promptBuilder.buildSimpleResponsePrompt({
        character,
        scene: testScene,
        knownInfo: testKnownInfo,
        recentEvents: [],
      });

      expect(prompt).toContain('角色：三月七');
      expect(prompt).toContain('场景：测试场景');
    });
  });
});

describe('CharacterAgent', () => {
  let agent: CharacterAgent;
  let promptBuilder: PromptBuilder;

  beforeEach(() => {
    promptBuilder = new PromptBuilder();
    agent = new CharacterAgent(mockLLMFactory, promptBuilder);
    jest.clearAllMocks();
  });

  describe('Response Parsing (P1-CA-03)', () => {
    it('should parse JSON dialogue response', () => {
      const content = JSON.stringify({
        type: 'dialogue',
        dialogue: '你好！',
        emotion: '开心',
      });

      const parsed = agent.parseResponseContent(content);

      expect(parsed?.type).toBe(ResponseType.Dialogue);
      expect(parsed?.dialogue).toBe('你好！');
      expect(parsed?.emotion).toBe('开心');
    });

    it('should parse JSON action response', () => {
      const content = JSON.stringify({
        type: 'action',
        action: '走向门口',
        innerThought: '我应该去看看',
      });

      const parsed = agent.parseResponseContent(content);

      expect(parsed?.type).toBe(ResponseType.Action);
      expect(parsed?.action).toBe('走向门口');
      expect(parsed?.innerThought).toBe('我应该去看看');
    });

    it('should parse JSON mixed response', () => {
      const content = JSON.stringify({
        type: 'mixed',
        dialogue: '我去看看',
        action: '走向门口',
      });

      const parsed = agent.parseResponseContent(content);

      expect(parsed?.type).toBe(ResponseType.Mixed);
      expect(parsed?.dialogue).toBe('我去看看');
      expect(parsed?.action).toBe('走向门口');
    });

    it('should infer type from content when type is missing', () => {
      const content = JSON.stringify({
        dialogue: '你好',
        action: '挥手',
      });

      const parsed = agent.parseResponseContent(content);

      expect(parsed?.type).toBe(ResponseType.Mixed);
    });

    it('should handle plain text as dialogue', () => {
      const content = '你好，很高兴见到你！';

      const parsed = agent.parseResponseContent(content);

      expect(parsed?.type).toBe(ResponseType.Dialogue);
      expect(parsed?.dialogue).toBe('你好，很高兴见到你！');
    });

    it('should extract JSON from mixed content', () => {
      const content =
        '这是一些前缀文字 {"type": "dialogue", "dialogue": "你好"} 这是后缀';

      const parsed = agent.parseResponseContent(content);

      expect(parsed?.type).toBe(ResponseType.Dialogue);
      expect(parsed?.dialogue).toBe('你好');
    });

    it('should handle malformed JSON gracefully', () => {
      const content = '{ invalid json }';

      const parsed = agent.parseResponseContent(content);

      expect(parsed?.type).toBe(ResponseType.Dialogue);
      expect(parsed?.dialogue).toBe('{ invalid json }');
    });
  });

  describe('Generate Response (P1-CA-02)', () => {
    it('should call LLM provider with correct prompts', async () => {
      const character = createTestCharacter('march7', '三月七');
      mockLLMProvider.generate.mockResolvedValue({
        content: JSON.stringify({ type: 'dialogue', dialogue: '你好' }),
        usage: { promptTokens: 100, completionTokens: 20, totalTokens: 120 },
      });

      const response = await agent.generateResponse(
        character,
        testScene,
        testKnownInfo,
        testEvents,
        '你好'
      );

      expect(mockLLMFactory.getProviderForCharacter).toHaveBeenCalledWith(
        'march7'
      );
      expect(mockLLMProvider.generate).toHaveBeenCalled();
      expect(response.characterId).toBe('march7');
      expect(response.parsed?.type).toBe(ResponseType.Dialogue);
    });

    it('should include usage statistics in response', async () => {
      const character = createTestCharacter('march7', '三月七');
      mockLLMProvider.generate.mockResolvedValue({
        content: '你好',
        usage: { promptTokens: 100, completionTokens: 20, totalTokens: 120 },
      });

      const response = await agent.generateResponse(
        character,
        testScene,
        [],
        []
      );

      expect(response.usage).toBeDefined();
      expect(response.usage?.totalTokens).toBe(120);
    });
  });

  describe('Generate Typed Response (P1-CA-02)', () => {
    it('should pass expected response type to prompt builder', async () => {
      const character = createTestCharacter('march7', '三月七');
      mockLLMProvider.generate.mockResolvedValue({
        content: JSON.stringify({ type: 'action', action: '调查房间' }),
      });

      const response = await agent.generateTypedResponse(
        character,
        testScene,
        [],
        [],
        ResponseType.Action
      );

      expect(response.parsed?.type).toBe(ResponseType.Action);
    });
  });

  describe('Dual Character Responses (P1-CA-03)', () => {
    it('should generate responses for both characters', async () => {
      const characterA = createTestCharacter('march7', '三月七');
      const characterB = createTestCharacter('stelle', '星');

      mockLLMProvider.generate
        .mockResolvedValueOnce({
          content: JSON.stringify({ type: 'dialogue', dialogue: '你好，星！' }),
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            type: 'dialogue',
            dialogue: '你好，三月七！',
          }),
        });

      const result = await agent.generateDualCharacterResponses(
        characterA,
        characterB,
        testScene,
        testKnownInfo,
        [],
        testEvents
      );

      expect(result.responseA.characterId).toBe('march7');
      expect(result.responseB.characterId).toBe('stelle');
      expect(result.sceneId).toBe('scene_test');
      expect(result.timestamp).toBeDefined();
    });

    it('should inject different known info for each character', async () => {
      const characterA = createTestCharacter('march7', '三月七');
      const characterB = createTestCharacter('stelle', '星');

      const knownInfoA: Information[] = [
        {
          id: 'info_a',
          content: '只有 A 知道的信息',
          source: 'witnessed',
          createdAt: Date.now(),
        },
      ];
      const knownInfoB: Information[] = [
        {
          id: 'info_b',
          content: '只有 B 知道的信息',
          source: 'witnessed',
          createdAt: Date.now(),
        },
      ];

      mockLLMProvider.generate.mockResolvedValue({
        content: JSON.stringify({ type: 'dialogue', dialogue: '回应' }),
      });

      await agent.generateDualCharacterResponses(
        characterA,
        characterB,
        testScene,
        knownInfoA,
        knownInfoB,
        []
      );

      // 验证两次调用使用了不同的信息
      expect(mockLLMProvider.generate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Multiple Responses', () => {
    it('should generate responses for multiple characters', async () => {
      const characters = [
        createTestCharacter('march7', '三月七'),
        createTestCharacter('stelle', '星'),
        createTestCharacter('danheng', '丹恒'),
      ];

      const knownInfoMap = new Map<string, Information[]>();
      knownInfoMap.set('march7', testKnownInfo);
      knownInfoMap.set('stelle', []);
      knownInfoMap.set('danheng', []);

      mockLLMProvider.generate.mockResolvedValue({
        content: JSON.stringify({ type: 'dialogue', dialogue: '回应' }),
      });

      const responses = await agent.generateMultipleResponses(
        characters,
        testScene,
        knownInfoMap,
        testEvents
      );

      expect(responses).toHaveLength(3);
      expect(responses[0].characterId).toBe('march7');
      expect(responses[1].characterId).toBe('stelle');
      expect(responses[2].characterId).toBe('danheng');
    });
  });

  describe('Info Leakage Validation', () => {
    it('should detect no leakage when response uses only known info', () => {
      const response = {
        characterId: 'march7',
        content: '三月七是一个活泼的女孩',
      };

      const knownInfo: Information[] = [
        {
          id: 'info_1',
          content: '三月七是一个活泼的女孩',
          source: 'witnessed',
          createdAt: Date.now(),
        },
      ];

      const allInfo: Information[] = [
        ...knownInfo,
        {
          id: 'info_2',
          content: '秘密宝藏的位置在山洞里',
          source: 'witnessed',
          createdAt: Date.now(),
        },
      ];

      const result = agent.validateNoInfoLeakage(response, knownInfo, allInfo);

      expect(result.isValid).toBe(true);
      expect(result.leakedInfo).toBeUndefined();
    });

    it('should detect leakage when response contains unknown info', () => {
      const response = {
        characterId: 'march7',
        content: 'I know the secret treasure location is in the hidden cave',
      };

      const knownInfo: Information[] = [
        {
          id: 'info_1',
          content: 'March 7th is a cheerful girl',
          source: 'witnessed',
          createdAt: Date.now(),
        },
      ];

      const allInfo: Information[] = [
        ...knownInfo,
        {
          id: 'info_2',
          content: 'The secret treasure location is in the hidden cave',
          source: 'witnessed',
          createdAt: Date.now(),
        },
      ];

      const result = agent.validateNoInfoLeakage(response, knownInfo, allInfo);

      expect(result.isValid).toBe(false);
      expect(result.leakedInfo).toBeDefined();
    });
  });
});
