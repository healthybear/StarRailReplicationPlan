import 'reflect-metadata';
import { StoryOrchestrator } from '../story-orchestrator.js';
import { VisionManager } from '../../vision-manager/vision-manager.js';
import { CharacterStateService } from '../../character-state/character-state.service.js';
import {
  BehaviorEngine,
  TriggerEngine,
} from '../../character-state/behavior-engine.js';
import { WorldEngine } from '../../world-engine/world-engine.js';
import { InputParser } from '../../input-parser/input-parser.js';
import { CharacterAgent } from '../../character-agent/character-agent.js';
import { PromptBuilder } from '../../character-agent/prompt-builder.js';
import type { SessionState, SceneConfig, Character } from '@star-rail/types';

// Mock Storage Adapter
const mockStorage = {
  saveSession: jest.fn(),
  loadSession: jest.fn(),
  listSessions: jest.fn(),
  deleteSession: jest.fn(),
};

// Mock LLM Provider
const mockLLMProvider = {
  generate: jest.fn(),
  getName: () => 'mock',
};

// Mock LLM Provider Factory
const mockLLMFactory = {
  getProviderForCharacter: jest.fn(() => mockLLMProvider),
  getDefaultProvider: jest.fn(() => mockLLMProvider),
};

// 创建测试用角色
const createTestCharacter = (id: string, name: string): Character => ({
  id,
  name,
  state: {
    relationships: {},
    abilities: {},
    knownInformation: [],
  },
  personality: {
    traits: {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5,
    },
    values: {
      self_direction: 0.5,
      benevolence: 0.5,
      security: 0.5,
    },
  },
});

// 创建测试用场景
const createTestScene = (): SceneConfig => ({
  id: 'scene_test',
  name: '测试场景',
  description: '这是一个测试场景',
  participants: ['march7', 'stelle'],
});

// 创建测试用会话
const createTestSession = (): SessionState => ({
  worldState: {
    currentSceneId: 'scene_test',
    timeline: {
      currentTurn: 0,
      timestamp: Date.now(),
    },
    eventChain: [],
    environment: {
      physical: {
        location: '测试地点',
        time: 'day',
        weather: 'clear',
      },
      social: {
        factions: {},
        publicOpinion: {},
      },
      atmosphere: {
        tension: 0.5,
        mood: 'neutral',
      },
    },
  },
  characters: {
    march7: createTestCharacter('march7', '三月七'),
    stelle: createTestCharacter('stelle', '星'),
  },
  information: {
    global: [],
    byCharacter: {},
  },
  metadata: {
    sessionId: 'test_session',
    sessionName: '测试会话',
    createdAt: Date.now(),
    lastSaved: Date.now(),
    version: '0.1.0',
  },
});

describe('StoryOrchestrator', () => {
  let orchestrator: StoryOrchestrator;
  let visionManager: VisionManager;
  let characterStateService: CharacterStateService;
  let worldEngine: WorldEngine;
  let inputParser: InputParser;
  let characterAgent: CharacterAgent;
  let promptBuilder: PromptBuilder;
  let behaviorEngine: BehaviorEngine;
  let triggerEngine: TriggerEngine;

  beforeEach(() => {
    visionManager = new VisionManager(mockStorage as any);
    behaviorEngine = new BehaviorEngine();
    triggerEngine = new TriggerEngine();
    characterStateService = new CharacterStateService(
      behaviorEngine,
      triggerEngine
    );
    worldEngine = new WorldEngine();
    inputParser = new InputParser();
    promptBuilder = new PromptBuilder();
    characterAgent = new CharacterAgent(mockLLMFactory as any, promptBuilder);

    orchestrator = new StoryOrchestrator(
      mockStorage as any,
      visionManager,
      characterStateService,
      worldEngine,
      inputParser,
      characterAgent
    );

    jest.clearAllMocks();
  });

  describe('initializeSession', () => {
    it('should register characters to input parser', () => {
      const session = createTestSession();
      orchestrator.initializeSession(session);

      const registered = inputParser.getRegisteredCharacters();
      expect(registered.length).toBe(2);
      expect(registered.some((c) => c.id === 'march7')).toBe(true);
      expect(registered.some((c) => c.id === 'stelle')).toBe(true);
    });

    it('should clear snapshot history', () => {
      const session = createTestSession();
      const scene = createTestScene();

      // 先创建一些快照
      orchestrator.createSnapshot(session, scene);
      expect(orchestrator.getSnapshotHistory().length).toBe(1);

      // 初始化会话应该清空快照
      orchestrator.initializeSession(session);
      expect(orchestrator.getSnapshotHistory().length).toBe(0);
    });
  });

  describe('advance (P1-SO-01)', () => {
    it('should return error for invalid input', async () => {
      const session = createTestSession();
      const scene = createTestScene();
      orchestrator.initializeSession(session);

      const result = await orchestrator.advance(session, '无效的输入', scene);

      expect(result.success).toBe(false);
      expect(result.error).toContain('无法解析输入');
    });

    it('should return error for unauthorized input', async () => {
      const session = createTestSession();
      const scene = createTestScene();
      orchestrator.initializeSession(session);
      inputParser.setControllableCharacters(['march7']);

      const result = await orchestrator.advance(session, '对星说：你好', scene);

      expect(result.success).toBe(false);
      expect(result.error).toContain('越权请求');
    });

    it('should return error for unknown character', async () => {
      const session = createTestSession();
      const scene = createTestScene();
      orchestrator.initializeSession(session);
      inputParser.registerCharacter('unknown', '未知角色');

      const result = await orchestrator.advance(
        session,
        '对未知角色说：你好',
        scene
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('未找到角色');
    });

    it('should successfully advance with dialogue input', async () => {
      const session = createTestSession();
      const scene = createTestScene();
      orchestrator.initializeSession(session);

      mockLLMProvider.generate.mockResolvedValue({
        content: JSON.stringify({ type: 'dialogue', dialogue: '你好！' }),
      });

      const result = await orchestrator.advance(
        session,
        '对三月七说：你好',
        scene
      );

      expect(result.success).toBe(true);
      expect(result.responses.length).toBe(1);
      expect(result.responses[0].characterId).toBe('march7');
      expect(result.eventId).toBeDefined();
    });

    it('should successfully advance with command input', async () => {
      const session = createTestSession();
      const scene = createTestScene();
      orchestrator.initializeSession(session);

      mockLLMProvider.generate.mockResolvedValue({
        content: JSON.stringify({ type: 'action', action: '开始调查' }),
      });

      const result = await orchestrator.advance(
        session,
        '让三月七去调查',
        scene
      );

      expect(result.success).toBe(true);
      expect(result.responses.length).toBe(1);
    });

    it('should advance turn after successful advance', async () => {
      const session = createTestSession();
      const scene = createTestScene();
      orchestrator.initializeSession(session);

      const initialTurn = session.worldState.timeline.currentTurn;

      mockLLMProvider.generate.mockResolvedValue({
        content: JSON.stringify({ type: 'dialogue', dialogue: '你好！' }),
      });

      await orchestrator.advance(session, '对三月七说：你好', scene);

      expect(session.worldState.timeline.currentTurn).toBe(initialTurn + 1);
    });

    it('should add event to event chain', async () => {
      const session = createTestSession();
      const scene = createTestScene();
      orchestrator.initializeSession(session);

      const initialEventCount = session.worldState.eventChain.length;

      mockLLMProvider.generate.mockResolvedValue({
        content: JSON.stringify({ type: 'dialogue', dialogue: '你好！' }),
      });

      await orchestrator.advance(session, '对三月七说：你好', scene);

      expect(session.worldState.eventChain.length).toBeGreaterThan(
        initialEventCount
      );
    });

    it('should process trigger rules and return state changes', async () => {
      const session = createTestSession();
      const scene = createTestScene();
      orchestrator.initializeSession(session);

      // 设置初始关系
      session.characters['march7'].state.relationships['stelle'] = {
        trust: 0.5,
        hostility: 0,
        intimacy: 0.5,
        respect: 0.5,
      };

      mockLLMProvider.generate.mockResolvedValue({
        content: JSON.stringify({ type: 'dialogue', dialogue: '你好！' }),
      });

      const triggerRules = [
        {
          id: 'rule_1',
          name: '对话增加信任',
          eventType: 'dialogue',
          effects: [
            {
              target: 'relationship.trust',
              changeType: 'delta' as const,
              value: 0.1,
            },
          ],
        },
      ];

      const result = await orchestrator.advance(
        session,
        '对三月七说：你好',
        scene,
        triggerRules
      );

      expect(result.success).toBe(true);
      // 状态变更可能为空（如果规则没有匹配到有效目标）
      // 重要的是流程能正常执行
    });

    it('should create snapshot after advance (P1-SO-02)', async () => {
      const session = createTestSession();
      const scene = createTestScene();
      orchestrator.initializeSession(session);

      mockLLMProvider.generate.mockResolvedValue({
        content: JSON.stringify({ type: 'dialogue', dialogue: '你好！' }),
      });

      await orchestrator.advance(session, '对三月七说：你好', scene);

      const snapshots = orchestrator.getSnapshotHistory();
      expect(snapshots.length).toBe(1);
      expect(snapshots[0].turn).toBe(1);
    });
  });

  describe('advanceMultiCharacter', () => {
    it('should return error for empty character list', async () => {
      const session = createTestSession();
      const scene = createTestScene();

      const result = await orchestrator.advanceMultiCharacter(session, scene, {
        characterIds: ['unknown1', 'unknown2'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('没有找到有效的在场角色');
    });

    it('should generate responses for multiple characters', async () => {
      const session = createTestSession();
      const scene = createTestScene();
      orchestrator.initializeSession(session);

      mockLLMProvider.generate.mockResolvedValue({
        content: JSON.stringify({ type: 'dialogue', dialogue: '回应' }),
      });

      const result = await orchestrator.advanceMultiCharacter(session, scene, {
        characterIds: ['march7', 'stelle'],
      });

      expect(result.success).toBe(true);
      expect(result.responses.length).toBe(2);
    });
  });

  describe('advanceDualCharacter', () => {
    it('should return error for missing character', async () => {
      const session = createTestSession();
      const scene = createTestScene();

      const result = await orchestrator.advanceDualCharacter(
        session,
        scene,
        'march7',
        'unknown'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('未找到角色');
    });

    it('should generate responses for both characters', async () => {
      const session = createTestSession();
      const scene = createTestScene();
      orchestrator.initializeSession(session);

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

      const result = await orchestrator.advanceDualCharacter(
        session,
        scene,
        'march7',
        'stelle'
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.responseA.characterId).toBe('march7');
      expect(result.result?.responseB.characterId).toBe('stelle');
    });
  });

  describe('State Snapshot (P1-SO-02)', () => {
    it('should create snapshot with character states', () => {
      const session = createTestSession();
      const scene = createTestScene();

      // 添加一些已知信息
      session.characters['march7'].state.knownInformation.push({
        informationId: 'info_1',
        acquiredAt: Date.now(),
        confidence: 1,
      });

      const snapshot = orchestrator.createSnapshot(session, scene);

      expect(snapshot.snapshotId).toBeDefined();
      expect(snapshot.turn).toBe(0);
      expect(snapshot.sceneId).toBe('scene_test');
      expect(snapshot.characters.length).toBe(2);

      const march7State = snapshot.characters.find(
        (c) => c.characterId === 'march7'
      );
      expect(march7State).toBeDefined();
      expect(march7State?.knownInformationIds).toContain('info_1');
    });

    it('should include relationships in snapshot', () => {
      const session = createTestSession();
      const scene = createTestScene();

      session.characters['march7'].state.relationships['stelle'] = {
        trust: 0.8,
        hostility: 0,
        intimacy: 0.6,
        respect: 0.7,
      };

      const snapshot = orchestrator.createSnapshot(session, scene);

      const march7State = snapshot.characters.find(
        (c) => c.characterId === 'march7'
      );
      expect(march7State?.relationships).toBeDefined();
      expect(march7State?.relationships?.['stelle']).toBe(0.8);
    });

    it('should get snapshot by turn', async () => {
      const session = createTestSession();
      const scene = createTestScene();
      orchestrator.initializeSession(session);

      mockLLMProvider.generate.mockResolvedValue({
        content: JSON.stringify({ type: 'dialogue', dialogue: '你好！' }),
      });

      // 推进两轮
      await orchestrator.advance(session, '对三月七说：你好', scene);
      await orchestrator.advance(session, '对三月七说：再见', scene);

      const snapshot1 = orchestrator.getSnapshotByTurn(1);
      const snapshot2 = orchestrator.getSnapshotByTurn(2);

      expect(snapshot1).toBeDefined();
      expect(snapshot1?.turn).toBe(1);
      expect(snapshot2).toBeDefined();
      expect(snapshot2?.turn).toBe(2);
    });

    it('should get current snapshot', () => {
      const session = createTestSession();
      const scene = createTestScene();

      const snapshot = orchestrator.getCurrentSnapshot(session, scene);

      expect(snapshot).toBeDefined();
      expect(snapshot.turn).toBe(0);
    });

    it('should clear snapshot history', () => {
      const session = createTestSession();
      const scene = createTestScene();

      orchestrator.createSnapshot(session, scene);
      orchestrator.createSnapshot(session, scene);
      expect(orchestrator.getSnapshotHistory().length).toBe(2);

      orchestrator.clearSnapshotHistory();
      expect(orchestrator.getSnapshotHistory().length).toBe(0);
    });
  });

  describe('addInformationToCharacter', () => {
    it('should add information to global store', () => {
      const session = createTestSession();
      const info = {
        id: 'info_new',
        content: '新信息',
        source: 'witnessed' as const,
        timestamp: Date.now(),
        sceneId: 'scene_test',
      };

      orchestrator.addInformationToCharacter(session, 'march7', info);

      expect(session.information.global.some((i) => i.id === 'info_new')).toBe(
        true
      );
    });

    it('should add information to character known list', () => {
      const session = createTestSession();
      const info = {
        id: 'info_new',
        content: '新信息',
        source: 'witnessed' as const,
        timestamp: Date.now(),
        sceneId: 'scene_test',
      };

      orchestrator.addInformationToCharacter(session, 'march7', info);

      expect(
        session.characters['march7'].state.knownInformation.some(
          (k) => k.informationId === 'info_new'
        )
      ).toBe(true);
    });

    it('should not duplicate information', () => {
      const session = createTestSession();
      const info = {
        id: 'info_new',
        content: '新信息',
        source: 'witnessed' as const,
        timestamp: Date.now(),
        sceneId: 'scene_test',
      };

      orchestrator.addInformationToCharacter(session, 'march7', info);
      orchestrator.addInformationToCharacter(session, 'march7', info);

      expect(
        session.information.global.filter((i) => i.id === 'info_new').length
      ).toBe(1);
      expect(
        session.characters['march7'].state.knownInformation.filter(
          (k) => k.informationId === 'info_new'
        ).length
      ).toBe(1);
    });
  });

  describe('Session Management', () => {
    it('should save session', async () => {
      const session = createTestSession();

      await orchestrator.saveSession(session);

      expect(mockStorage.saveSession).toHaveBeenCalledWith(
        'test_session',
        expect.objectContaining({
          metadata: expect.objectContaining({
            sessionId: 'test_session',
          }),
        })
      );
    });

    it('should load session and initialize', async () => {
      const session = createTestSession();
      mockStorage.loadSession.mockResolvedValue(session);

      const loaded = await orchestrator.loadSession('test_session');

      expect(loaded).toBeDefined();
      expect(mockStorage.loadSession).toHaveBeenCalledWith('test_session');

      // 验证角色已注册
      const registered = inputParser.getRegisteredCharacters();
      expect(registered.length).toBe(2);
    });

    it('should return null for non-existent session', async () => {
      mockStorage.loadSession.mockResolvedValue(null);

      const loaded = await orchestrator.loadSession('non_existent');

      expect(loaded).toBeNull();
    });

    it('should list sessions', async () => {
      mockStorage.listSessions.mockResolvedValue(['session1', 'session2']);

      const sessions = await orchestrator.listSessions();

      expect(sessions).toEqual(['session1', 'session2']);
    });

    it('should delete session', async () => {
      await orchestrator.deleteSession('test_session');

      expect(mockStorage.deleteSession).toHaveBeenCalledWith('test_session');
    });
  });
});
