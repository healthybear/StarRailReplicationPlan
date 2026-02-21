import 'reflect-metadata';
import { AnchorEvaluator } from '../anchor-evaluator.js';
import type {
  Anchor,
  SessionState,
  AnchorCharacterState,
} from '@star-rail/types';
import type { StateSnapshot } from '../../story-orchestrator/story-orchestrator.js';

// 创建测试用角色状态
const createTestCharacterState = (
  id: string,
  name: string,
  knownInfoIds: string[] = [],
  relationships: Record<string, number> = {}
): AnchorCharacterState => ({
  characterId: id,
  characterName: name,
  knownInformationIds: knownInfoIds,
  relationships,
});

// 创建测试用锚点
const createTestAnchor = (
  id: string = 'anchor_test',
  characters: AnchorCharacterState[] = []
): Anchor => ({
  id,
  nodeId: 'node_1',
  storylineId: 'storyline_main',
  sequence: 1,
  name: '测试锚点',
  description: '这是一个测试锚点',
  characters,
  environmentDescription: '测试环境',
  plotDescription: '测试情节',
  createdAt: Date.now(),
});

// 创建测试用会话
const createTestSession = (
  characters: Record<
    string,
    {
      id: string;
      name: string;
      state: {
        knownInformation: Array<{ informationId: string }>;
        relationships: Record<
          string,
          {
            trust: number;
            hostility: number;
            intimacy: number;
            respect: number;
          }
        >;
        abilities: Record<string, number>;
      };
      personality: {
        traits: {
          openness: number;
          conscientiousness: number;
          extraversion: number;
          agreeableness: number;
          neuroticism: number;
        };
        values: {
          selfDirection: number;
          benevolence: number;
          security: number;
        };
      };
    }
  > = {}
): SessionState => ({
  worldState: {
    currentSceneId: 'scene_test',
    timeline: {
      currentTurn: 5,
      timestamp: Date.now(),
    },
    eventChain: [],
    environment: {
      physical: {
        weather: 'sunny',
        lighting: 'bright',
        timeOfDay: 'morning',
      },
      social: {
        factions: {},
      },
      atmosphere: {
        tension: 0.3,
        mood: 'positive',
      },
    },
  },
  characters,
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

// 创建测试用状态快照
const createTestSnapshot = (
  characters: AnchorCharacterState[] = []
): StateSnapshot => ({
  snapshotId: 'snapshot_test',
  timestamp: Date.now(),
  turn: 5,
  sceneId: 'scene_test',
  characters,
  environmentDescription: '测试环境描述',
});

// 创建完整的角色数据
const createFullCharacter = (
  id: string,
  name: string,
  knownInfoIds: string[] = [],
  relationships: Record<
    string,
    { trust: number; hostility: number; intimacy: number; respect: number }
  > = {}
) => ({
  id,
  name,
  state: {
    knownInformation: knownInfoIds.map((infoId) => ({
      informationId: infoId,
    })),
    relationships,
    abilities: {},
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
      selfDirection: 0.5,
      benevolence: 0.5,
      security: 0.5,
    },
  },
});

describe('AnchorEvaluator', () => {
  let evaluator: AnchorEvaluator;

  beforeEach(() => {
    evaluator = new AnchorEvaluator();
  });

  describe('Anchor Management (P1-AE-01)', () => {
    it('should create anchor from snapshot', () => {
      const snapshot = createTestSnapshot([
        createTestCharacterState('march7', '三月七', ['info_1', 'info_2']),
      ]);

      const anchor = evaluator.createAnchorFromSnapshot(snapshot, {
        name: '测试锚点',
        nodeId: 'node_1',
        storylineId: 'storyline_main',
        sequence: 1,
        plotDescription: '测试情节',
      });

      expect(anchor.id).toBeDefined();
      expect(anchor.name).toBe('测试锚点');
      expect(anchor.characters.length).toBe(1);
      expect(anchor.characters[0].characterId).toBe('march7');
    });

    it('should create anchor from session', () => {
      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', ['info_1'], {
          stelle: { trust: 0.8, hostility: 0, intimacy: 0.6, respect: 0.7 },
        }),
      });

      const anchor = evaluator.createAnchorFromSession(session, {
        name: '会话锚点',
        nodeId: 'node_2',
        storylineId: 'storyline_main',
        sequence: 2,
        plotDescription: '从会话创建的锚点',
      });

      expect(anchor.id).toBeDefined();
      expect(anchor.characters.length).toBe(1);
      expect(anchor.characters[0].knownInformationIds).toContain('info_1');
      expect(anchor.characters[0].relationships?.['stelle']).toBe(0.8);
    });

    it('should add and get anchor', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七'),
      ]);

      evaluator.addAnchor(anchor);
      const retrieved = evaluator.getAnchor('anchor_1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('anchor_1');
    });

    it('should get anchors by storyline', () => {
      const anchor1 = createTestAnchor('anchor_1');
      anchor1.storylineId = 'storyline_main';
      anchor1.sequence = 1;

      const anchor2 = createTestAnchor('anchor_2');
      anchor2.storylineId = 'storyline_main';
      anchor2.sequence = 2;

      const anchor3 = createTestAnchor('anchor_3');
      anchor3.storylineId = 'storyline_side';
      anchor3.sequence = 1;

      evaluator.addAnchor(anchor1);
      evaluator.addAnchor(anchor2);
      evaluator.addAnchor(anchor3);

      const mainAnchors = evaluator.getAnchorsByStoryline('storyline_main');
      const sideAnchors = evaluator.getAnchorsByStoryline('storyline_side');

      expect(mainAnchors.length).toBe(2);
      expect(sideAnchors.length).toBe(1);
      // 验证按顺序排序
      expect(mainAnchors[0].sequence).toBe(1);
      expect(mainAnchors[1].sequence).toBe(2);
    });

    it('should get all anchors', () => {
      evaluator.addAnchor(createTestAnchor('anchor_1'));
      evaluator.addAnchor(createTestAnchor('anchor_2'));

      const allAnchors = evaluator.getAllAnchors();

      expect(allAnchors.length).toBe(2);
    });

    it('should remove anchor', () => {
      const anchor = createTestAnchor('anchor_to_remove');
      evaluator.addAnchor(anchor);

      expect(evaluator.getAnchor('anchor_to_remove')).toBeDefined();

      const result = evaluator.removeAnchor('anchor_to_remove');

      expect(result).toBe(true);
      expect(evaluator.getAnchor('anchor_to_remove')).toBeUndefined();
    });

    it('should return false when removing non-existent anchor', () => {
      const result = evaluator.removeAnchor('non_existent');
      expect(result).toBe(false);
    });

    it('should clear all anchors', () => {
      evaluator.addAnchor(createTestAnchor('anchor_1'));
      evaluator.addAnchor(createTestAnchor('anchor_2'));

      evaluator.clearAnchors();

      expect(evaluator.getAllAnchors().length).toBe(0);
    });
  });

  describe('Comparison - Vision (P1-AE-02)', () => {
    it('should detect no differences when vision matches', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', ['info_1', 'info_2']),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', ['info_1', 'info_2']),
      });

      const result = evaluator.compare(session, anchor);

      expect(result.overallDivergence).toBe(0);
      expect(result.differences.length).toBe(0);
      expect(result.overallAssessment).toContain('高度一致');
    });

    it('should detect missing information', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', [
          'info_1',
          'info_2',
          'info_3',
        ]),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', ['info_1']),
      });

      const result = evaluator.compare(session, anchor);

      expect(result.overallDivergence).toBeGreaterThan(0);
      expect(result.differences.some((d) => d.includes('缺少'))).toBe(true);
    });

    it('should detect extra information', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', ['info_1']),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', [
          'info_1',
          'info_2',
          'info_3',
        ]),
      });

      const result = evaluator.compare(session, anchor);

      expect(result.overallDivergence).toBeGreaterThan(0);
      expect(result.differences.some((d) => d.includes('多知道'))).toBe(true);
    });

    it('should detect missing character', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', ['info_1']),
        createTestCharacterState('stelle', '星', ['info_2']),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', ['info_1']),
      });

      const result = evaluator.compare(session, anchor);

      expect(result.differences.some((d) => d.includes('不存在'))).toBe(true);
    });
  });

  describe('Comparison - Relationships (P1-AE-02)', () => {
    it('should detect relationship differences', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', [], { stelle: 0.8 }),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', [], {
          stelle: { trust: 0.3, hostility: 0, intimacy: 0.5, respect: 0.5 },
        }),
      });

      const result = evaluator.compare(session, anchor);

      expect(result.overallDivergence).toBeGreaterThan(0);
      expect(result.differences.some((d) => d.includes('信任度'))).toBe(true);
    });

    it('should not report small relationship differences', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', [], { stelle: 0.8 }),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', [], {
          stelle: { trust: 0.75, hostility: 0, intimacy: 0.5, respect: 0.5 },
        }),
      });

      const result = evaluator.compare(session, anchor, {
        relationshipThreshold: 0.1,
      });

      // 差异 0.05 < 阈值 0.1，不应报告
      expect(
        result.differences.filter((d) => d.includes('信任度')).length
      ).toBe(0);
    });

    it('should detect missing relationship', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', [], { stelle: 0.8 }),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', [], {}),
      });

      const result = evaluator.compare(session, anchor);

      expect(result.differences.some((d) => d.includes('关系'))).toBe(true);
    });
  });

  describe('Comparison Options', () => {
    it('should skip vision comparison when disabled', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', ['info_1', 'info_2']),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', []),
      });

      const result = evaluator.compare(session, anchor, {
        includeVision: false,
      });

      expect(
        result.dimensions.filter((d) => d.name.includes('视野')).length
      ).toBe(0);
    });

    it('should skip relationship comparison when disabled', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', [], { stelle: 0.8 }),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', [], {
          stelle: { trust: 0.3, hostility: 0, intimacy: 0.5, respect: 0.5 },
        }),
      });

      const result = evaluator.compare(session, anchor, {
        includeRelationships: false,
      });

      expect(
        result.dimensions.filter((d) => d.name.includes('信任度')).length
      ).toBe(0);
    });
  });

  describe('Compare with Snapshot', () => {
    it('should compare session with snapshot', () => {
      const snapshot = createTestSnapshot([
        createTestCharacterState('march7', '三月七', ['info_1', 'info_2']),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', ['info_1']),
      });

      const result = evaluator.compareWithSnapshot(session, snapshot);

      expect(result.anchorId).toContain('temp_');
      expect(result.overallDivergence).toBeGreaterThan(0);
    });
  });

  describe('Batch Comparison', () => {
    it('should compare multiple anchors', () => {
      const anchor1 = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', ['info_1']),
      ]);
      const anchor2 = createTestAnchor('anchor_2', [
        createTestCharacterState('march7', '三月七', ['info_1', 'info_2']),
      ]);

      evaluator.addAnchor(anchor1);
      evaluator.addAnchor(anchor2);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', ['info_1']),
      });

      const results = evaluator.compareMultiple(session, [
        'anchor_1',
        'anchor_2',
      ]);

      expect(results.length).toBe(2);
      expect(results[0].anchorId).toBe('anchor_1');
      expect(results[1].anchorId).toBe('anchor_2');
    });

    it('should skip non-existent anchors in batch comparison', () => {
      const anchor1 = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', ['info_1']),
      ]);

      evaluator.addAnchor(anchor1);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', ['info_1']),
      });

      const results = evaluator.compareMultiple(session, [
        'anchor_1',
        'non_existent',
      ]);

      expect(results.length).toBe(1);
    });

    it('should compare storyline anchors', () => {
      const anchor1 = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', ['info_1']),
      ]);
      anchor1.storylineId = 'main';
      anchor1.sequence = 1;

      const anchor2 = createTestAnchor('anchor_2', [
        createTestCharacterState('march7', '三月七', ['info_1', 'info_2']),
      ]);
      anchor2.storylineId = 'main';
      anchor2.sequence = 2;

      evaluator.addAnchor(anchor1);
      evaluator.addAnchor(anchor2);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', ['info_1']),
      });

      const results = evaluator.compareStoryline(session, 'main');

      expect(results.length).toBe(2);
      // 第一个锚点应该完全匹配
      expect(results[0].overallDivergence).toBe(0);
      // 第二个锚点应该有差异
      expect(results[1].overallDivergence).toBeGreaterThan(0);
    });
  });

  describe('Assessment Generation', () => {
    it('should generate high consistency assessment', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', ['info_1']),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', ['info_1']),
      });

      const result = evaluator.compare(session, anchor);

      expect(result.overallAssessment).toContain('高度一致');
    });

    it('should generate minor difference assessment', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', ['info_1', 'info_2']),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', ['info_1']),
      });

      const result = evaluator.compare(session, anchor);

      // 差异度应该在 0.2-0.5 之间
      if (result.overallDivergence < 0.2) {
        expect(result.overallAssessment).toContain('基本一致');
      } else if (result.overallDivergence < 0.5) {
        expect(result.overallAssessment).toContain('一定差异');
      }
    });

    it('should generate significant difference assessment', () => {
      const anchor = createTestAnchor('anchor_1', [
        createTestCharacterState('march7', '三月七', [
          'info_1',
          'info_2',
          'info_3',
          'info_4',
          'info_5',
        ]),
      ]);

      const session = createTestSession({
        march7: createFullCharacter('march7', '三月七', []),
      });

      const result = evaluator.compare(session, anchor);

      expect(result.overallAssessment).toContain('差异');
    });
  });

  // ==================== P2-AE-01 判断维度对比 ====================

  describe('Judgment Comparison (P2-AE-01)', () => {
    it('锚点有判断、当前无判断时不计入差异', () => {
      const anchorChar = createTestCharacterState('march7', '三月七');
      (anchorChar as AnchorCharacterState & { judgment?: string }).judgment =
        '应该帮助星';
      const anchor = createTestAnchor('a1', [anchorChar]);
      const session = createTestSession({
        march7: {
          id: 'march7',
          name: '三月七',
          state: { knownInformation: [], relationships: {} },
        },
      });

      const result = evaluator.compare(session, anchor, {
        includeJudgment: true,
        includeVision: false,
        includeRelationships: false,
      });
      // 无判断时 divergence 为 0，不影响总体差异
      const judgmentDim = result.dimensions.find((d) =>
        d.name.includes('判断')
      );
      expect(judgmentDim?.divergence).toBe(0);
    });

    it('判断一致时 divergence 为 0', () => {
      const anchorChar = createTestCharacterState('march7', '三月七');
      (anchorChar as AnchorCharacterState & { judgment?: string }).judgment =
        '应该帮助星';
      const anchor = createTestAnchor('a1', [anchorChar]);
      const session = createTestSession({
        march7: {
          id: 'march7',
          name: '三月七',
          judgment: '应该帮助星',
          state: { knownInformation: [], relationships: {} },
        } as never,
      });

      const result = evaluator.compare(session, anchor, {
        includeJudgment: true,
        includeVision: false,
        includeRelationships: false,
      });
      const judgmentDim = result.dimensions.find((d) =>
        d.name.includes('判断')
      );
      expect(judgmentDim?.divergence).toBe(0);
    });

    it('判断不同时 divergence > 0 且有差异说明', () => {
      const anchorChar = createTestCharacterState('march7', '三月七');
      (anchorChar as AnchorCharacterState & { judgment?: string }).judgment =
        '应该帮助星';
      const anchor = createTestAnchor('a1', [anchorChar]);
      const session = createTestSession({
        march7: {
          id: 'march7',
          name: '三月七',
          judgment: '不应该冒险',
          state: { knownInformation: [], relationships: {} },
        } as never,
      });

      const result = evaluator.compare(session, anchor, {
        includeJudgment: true,
        includeVision: false,
        includeRelationships: false,
      });
      const judgmentDim = result.dimensions.find((d) =>
        d.name.includes('判断')
      );
      expect(judgmentDim?.divergence).toBeGreaterThan(0);
      expect(result.differences.some((d) => d.includes('判断'))).toBe(true);
    });

    it('includeJudgment=false 时不对比判断', () => {
      const anchorChar = createTestCharacterState('march7', '三月七');
      (anchorChar as AnchorCharacterState & { judgment?: string }).judgment =
        '应该帮助星';
      const anchor = createTestAnchor('a1', [anchorChar]);
      const session = createTestSession({
        march7: {
          id: 'march7',
          name: '三月七',
          judgment: '不应该冒险',
          state: { knownInformation: [], relationships: {} },
        } as never,
      });

      const result = evaluator.compare(session, anchor, {
        includeJudgment: false,
        includeVision: false,
        includeRelationships: false,
      });
      const judgmentDim = result.dimensions.find((d) =>
        d.name.includes('判断')
      );
      expect(judgmentDim).toBeUndefined();
    });
  });
});
