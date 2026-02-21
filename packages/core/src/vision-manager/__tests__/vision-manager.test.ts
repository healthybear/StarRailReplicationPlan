import 'reflect-metadata';
import { VisionManager, EventContext } from '../vision-manager.js';
import type {
  InformationStore,
  InformationAttributionConfig,
} from '@star-rail/types';
import { createEmptyInformationStore } from '@star-rail/types';

// Mock StorageAdapter
const mockStorage = {
  read: jest.fn(),
  write: jest.fn(),
  exists: jest.fn(),
  delete: jest.fn(),
  list: jest.fn(),
};

describe('VisionManager', () => {
  let visionManager: VisionManager;
  let informationStore: InformationStore;

  beforeEach(() => {
    visionManager = new VisionManager(mockStorage as any);
    informationStore = createEmptyInformationStore();
  });

  describe('getFilteredVision', () => {
    it('should return empty array for character with no known information', () => {
      const result = visionManager.getFilteredVision(
        'character_a',
        informationStore
      );
      expect(result).toEqual([]);
    });

    it('should return only information known to the character', () => {
      // Add global information
      const info1 = visionManager.addGlobalInformation(informationStore, {
        content: 'Secret A knows',
        source: 'witnessed',
        timestamp: Date.now(),
        sceneId: 'scene_1',
      });

      const info2 = visionManager.addGlobalInformation(informationStore, {
        content: 'Secret B knows',
        source: 'witnessed',
        timestamp: Date.now(),
        sceneId: 'scene_1',
      });

      // Assign info1 to character_a only
      visionManager.assignInformationToCharacter(
        informationStore,
        'character_a',
        info1.id
      );

      // Assign info2 to character_b only
      visionManager.assignInformationToCharacter(
        informationStore,
        'character_b',
        info2.id
      );

      // Character A should only see info1
      const visionA = visionManager.getFilteredVision(
        'character_a',
        informationStore
      );
      expect(visionA).toHaveLength(1);
      expect(visionA[0].content).toBe('Secret A knows');

      // Character B should only see info2
      const visionB = visionManager.getFilteredVision(
        'character_b',
        informationStore
      );
      expect(visionB).toHaveLength(1);
      expect(visionB[0].content).toBe('Secret B knows');
    });
  });

  describe('addGlobalInformation', () => {
    it('should add information with generated ID', () => {
      const info = visionManager.addGlobalInformation(informationStore, {
        content: 'Test information',
        source: 'witnessed',
        timestamp: Date.now(),
        sceneId: 'scene_1',
      });

      expect(info.id).toBeDefined();
      expect(info.id).toMatch(/^info_/);
      expect(info.content).toBe('Test information');
      expect(informationStore.global).toHaveLength(1);
    });
  });

  describe('assignInformationToCharacter', () => {
    it('should assign information to character', () => {
      const info = visionManager.addGlobalInformation(informationStore, {
        content: 'Test',
        source: 'witnessed',
        timestamp: Date.now(),
        sceneId: 'scene_1',
      });

      visionManager.assignInformationToCharacter(
        informationStore,
        'character_a',
        info.id
      );

      expect(informationStore.byCharacter['character_a']).toContain(info.id);
    });

    it('should not duplicate information assignment', () => {
      const info = visionManager.addGlobalInformation(informationStore, {
        content: 'Test',
        source: 'witnessed',
        timestamp: Date.now(),
        sceneId: 'scene_1',
      });

      visionManager.assignInformationToCharacter(
        informationStore,
        'character_a',
        info.id
      );
      visionManager.assignInformationToCharacter(
        informationStore,
        'character_a',
        info.id
      );

      expect(informationStore.byCharacter['character_a']).toHaveLength(1);
    });
  });

  describe('characterKnowsInformation', () => {
    it('should return true if character knows information', () => {
      const info = visionManager.addGlobalInformation(informationStore, {
        content: 'Test',
        source: 'witnessed',
        timestamp: Date.now(),
        sceneId: 'scene_1',
      });

      visionManager.assignInformationToCharacter(
        informationStore,
        'character_a',
        info.id
      );

      expect(
        visionManager.characterKnowsInformation(
          informationStore,
          'character_a',
          info.id
        )
      ).toBe(true);
    });

    it('should return false if character does not know information', () => {
      const info = visionManager.addGlobalInformation(informationStore, {
        content: 'Test',
        source: 'witnessed',
        timestamp: Date.now(),
        sceneId: 'scene_1',
      });

      expect(
        visionManager.characterKnowsInformation(
          informationStore,
          'character_a',
          info.id
        )
      ).toBe(false);
    });
  });

  describe('witnessEvent', () => {
    it('should create information and assign to all present characters', () => {
      const context: EventContext = {
        event: {
          eventId: 'event_1',
          timestamp: Date.now(),
          sceneId: 'scene_1',
          participants: ['character_a', 'character_b'],
        },
        participants: ['character_a', 'character_b'],
        presentCharacters: ['character_a', 'character_b', 'character_c'],
        sceneId: 'scene_1',
      };

      const result = visionManager.witnessEvent(
        informationStore,
        context,
        'A fight broke out'
      );

      expect(result.sourceType).toBe('witnessed');
      expect(result.attributedTo).toEqual([
        'character_a',
        'character_b',
        'character_c',
      ]);
      expect(result.confidence).toBe(1.0);

      // All present characters should know the information
      for (const charId of context.presentCharacters) {
        expect(
          visionManager.characterKnowsInformation(
            informationStore,
            charId,
            result.informationId
          )
        ).toBe(true);
      }
    });
  });

  describe('hearEvent', () => {
    it('should create information with heard source type', () => {
      const context: EventContext = {
        event: {
          eventId: 'event_1',
          timestamp: Date.now(),
          sceneId: 'scene_1',
          participants: ['character_a'],
        },
        participants: ['character_a'],
        presentCharacters: ['character_a', 'character_b'],
        sceneId: 'scene_1',
      };

      const result = visionManager.hearEvent(
        informationStore,
        context,
        'Someone shouted for help'
      );

      expect(result.sourceType).toBe('heard');
      expect(result.confidence).toBe(0.9);
    });

    it('should assign to specific hearers if provided', () => {
      const context: EventContext = {
        event: {
          eventId: 'event_1',
          timestamp: Date.now(),
          sceneId: 'scene_1',
          participants: ['character_a'],
        },
        participants: ['character_a'],
        presentCharacters: ['character_a', 'character_b', 'character_c'],
        sceneId: 'scene_1',
      };

      const result = visionManager.hearEvent(
        informationStore,
        context,
        'Whispered secret',
        ['character_b']
      );

      expect(result.attributedTo).toEqual(['character_b']);
      expect(
        visionManager.characterKnowsInformation(
          informationStore,
          'character_b',
          result.informationId
        )
      ).toBe(true);
      expect(
        visionManager.characterKnowsInformation(
          informationStore,
          'character_c',
          result.informationId
        )
      ).toBe(false);
    });
  });

  describe('tellInformation', () => {
    it('should assign information to teller and recipients', () => {
      const context: EventContext = {
        event: {
          eventId: 'event_1',
          timestamp: Date.now(),
          sceneId: 'scene_1',
          participants: ['character_a', 'character_b'],
        },
        participants: ['character_a', 'character_b'],
        presentCharacters: ['character_a', 'character_b', 'character_c'],
        sceneId: 'scene_1',
      };

      const result = visionManager.tellInformation(
        informationStore,
        context,
        'I have a secret to share',
        'character_a',
        ['character_b']
      );

      expect(result.sourceType).toBe('told');
      expect(result.attributedTo).toContain('character_a');
      expect(result.attributedTo).toContain('character_b');
      expect(result.attributedTo).not.toContain('character_c');
    });
  });

  describe('getInformationDifference', () => {
    it('should correctly identify information differences between characters', () => {
      // Add shared information
      const sharedInfo = visionManager.addGlobalInformation(informationStore, {
        content: 'Shared knowledge',
        source: 'witnessed',
        timestamp: Date.now(),
        sceneId: 'scene_1',
      });
      visionManager.assignInformationToCharacters(
        informationStore,
        ['character_a', 'character_b'],
        sharedInfo.id
      );

      // Add info only A knows
      const onlyAInfo = visionManager.addGlobalInformation(informationStore, {
        content: 'Only A knows this',
        source: 'witnessed',
        timestamp: Date.now(),
        sceneId: 'scene_1',
      });
      visionManager.assignInformationToCharacter(
        informationStore,
        'character_a',
        onlyAInfo.id
      );

      // Add info only B knows
      const onlyBInfo = visionManager.addGlobalInformation(informationStore, {
        content: 'Only B knows this',
        source: 'witnessed',
        timestamp: Date.now(),
        sceneId: 'scene_1',
      });
      visionManager.assignInformationToCharacter(
        informationStore,
        'character_b',
        onlyBInfo.id
      );

      const diff = visionManager.getInformationDifference(
        informationStore,
        'character_a',
        'character_b'
      );

      expect(diff.shared).toHaveLength(1);
      expect(diff.shared[0].content).toBe('Shared knowledge');

      expect(diff.onlyA).toHaveLength(1);
      expect(diff.onlyA[0].content).toBe('Only A knows this');

      expect(diff.onlyB).toHaveLength(1);
      expect(diff.onlyB[0].content).toBe('Only B knows this');
    });
  });

  describe('loadAttributionRules', () => {
    it('should load and sort rules by priority', () => {
      const config: InformationAttributionConfig = {
        version: '0.1.0',
        rules: [
          {
            id: 'low_priority',
            name: 'Low Priority Rule',
            eventType: 'test',
            sourceType: 'witnessed',
            attributionTarget: 'participants',
            priority: 5,
          },
          {
            id: 'high_priority',
            name: 'High Priority Rule',
            eventType: 'test',
            sourceType: 'told',
            attributionTarget: 'all_present',
            priority: 20,
          },
        ],
      };

      visionManager.loadAttributionRules(config);

      // Rules should be sorted by priority (high to low)
      // We can verify this by checking processEventAttribution behavior
      const context: EventContext = {
        event: {
          eventId: 'test_event',
          timestamp: Date.now(),
          sceneId: 'scene_1',
          participants: ['character_a'],
        },
        participants: ['character_a'],
        presentCharacters: ['character_a', 'character_b'],
        sceneId: 'scene_1',
      };

      const result = visionManager.processEventAttribution(
        informationStore,
        context,
        'Test content'
      );

      // High priority rule should be applied (sourceType: 'told', target: 'all_present')
      expect(result?.sourceType).toBe('told');
      expect(result?.attributedTo).toEqual(['character_a', 'character_b']);
    });
  });

  describe('Vision Isolation Verification', () => {
    it('should ensure character B cannot see information only known to character A', () => {
      // Scenario: 1 scene + 2 characters
      // Character A witnesses a secret event
      // Character B should NOT know about it

      const context: EventContext = {
        event: {
          eventId: 'secret_event',
          timestamp: Date.now(),
          sceneId: 'scene_1',
          participants: ['character_a'],
        },
        participants: ['character_a'],
        presentCharacters: ['character_a'], // Only A is present
        sceneId: 'scene_1',
      };

      // A witnesses a secret
      const result = visionManager.witnessEvent(
        informationStore,
        context,
        'The treasure is hidden under the old tree'
      );

      // Verify A knows the secret
      const visionA = visionManager.getFilteredVision(
        'character_a',
        informationStore
      );
      expect(visionA).toHaveLength(1);
      expect(visionA[0].content).toBe(
        'The treasure is hidden under the old tree'
      );

      // Verify B does NOT know the secret
      const visionB = visionManager.getFilteredVision(
        'character_b',
        informationStore
      );
      expect(visionB).toHaveLength(0);

      // Double check with characterKnowsInformation
      expect(
        visionManager.characterKnowsInformation(
          informationStore,
          'character_a',
          result.informationId
        )
      ).toBe(true);
      expect(
        visionManager.characterKnowsInformation(
          informationStore,
          'character_b',
          result.informationId
        )
      ).toBe(false);
    });

    it('should correctly handle information sharing when A tells B', () => {
      // First, A knows a secret
      const secretInfo = visionManager.addGlobalInformation(informationStore, {
        content: 'Secret location of the artifact',
        source: 'witnessed',
        timestamp: Date.now(),
        sceneId: 'scene_1',
      });
      visionManager.assignInformationToCharacter(
        informationStore,
        'character_a',
        secretInfo.id
      );

      // Verify initial state
      expect(
        visionManager.characterKnowsInformation(
          informationStore,
          'character_a',
          secretInfo.id
        )
      ).toBe(true);
      expect(
        visionManager.characterKnowsInformation(
          informationStore,
          'character_b',
          secretInfo.id
        )
      ).toBe(false);

      // Now A tells B
      const context: EventContext = {
        event: {
          eventId: 'tell_event',
          timestamp: Date.now(),
          sceneId: 'scene_1',
          participants: ['character_a', 'character_b'],
        },
        participants: ['character_a', 'character_b'],
        presentCharacters: ['character_a', 'character_b'],
        sceneId: 'scene_1',
      };

      visionManager.tellInformation(
        informationStore,
        context,
        'Secret location of the artifact',
        'character_a',
        ['character_b']
      );

      // Now both should know (the new told information)
      const visionA = visionManager.getFilteredVision(
        'character_a',
        informationStore
      );
      const visionB = visionManager.getFilteredVision(
        'character_b',
        informationStore
      );

      // A knows 2 pieces of info (original + told)
      expect(visionA).toHaveLength(2);
      // B knows 1 piece of info (told)
      expect(visionB).toHaveLength(1);
    });
  });
});

// ─── P2-VM-01 推理/遗忘/模糊规则测试 ───────────────────────────────────────

describe('VisionManager - P2-VM-01 信息规则', () => {
  let vm: VisionManager;
  let store: InformationStore;
  const NOW = 1_000_000;

  beforeEach(() => {
    vm = new VisionManager(mockStorage as any);
    store = createEmptyInformationStore();
  });

  // ── 推理规则 ──────────────────────────────────────────────────────────────

  describe('applyInference', () => {
    it('前提标签全部满足时推理出新信息', () => {
      vm.loadInformationRules({
        version: '1.0',
        inferenceRules: [
          {
            id: 'r1',
            name: '推理规则1',
            premiseTags: ['secret', 'location'],
            conclusionTemplate: '推理：目标在秘密地点',
            confidence: 0.7,
          },
        ],
      });

      // 给角色添加含前提标签的信息
      const i1 = vm.addGlobalInformation(store, {
        content: '这是秘密',
        source: 'told',
        timestamp: NOW - 100,
        sceneId: 's1',
        tags: ['secret'],
      });
      const i2 = vm.addGlobalInformation(store, {
        content: '地点已知',
        source: 'witnessed',
        timestamp: NOW - 100,
        sceneId: 's1',
        tags: ['location'],
      });
      vm.assignInformationToCharacter(store, 'char-a', i1.id);
      vm.assignInformationToCharacter(store, 'char-a', i2.id);

      const added = vm.applyInference(store, 'char-a', 's1', NOW);
      expect(added).toHaveLength(1);
      expect(added[0].content).toBe('推理：目标在秘密地点');
      expect(added[0].source).toBe('inferred');
      // 推理信息已归属给角色
      expect(vm.characterKnowsInformation(store, 'char-a', added[0].id)).toBe(
        true
      );
    });

    it('前提标签不满足时不推理', () => {
      vm.loadInformationRules({
        version: '1.0',
        inferenceRules: [
          {
            id: 'r1',
            name: '规则',
            premiseTags: ['secret', 'location'],
            conclusionTemplate: '推理结论',
          },
        ],
      });

      const i1 = vm.addGlobalInformation(store, {
        content: '只有一个标签',
        source: 'told',
        timestamp: NOW,
        sceneId: 's1',
        tags: ['secret'],
      });
      vm.assignInformationToCharacter(store, 'char-a', i1.id);

      const added = vm.applyInference(store, 'char-a', 's1', NOW);
      expect(added).toHaveLength(0);
    });

    it('重复推理不产生重复信息', () => {
      vm.loadInformationRules({
        version: '1.0',
        inferenceRules: [
          {
            id: 'r1',
            name: '规则',
            premiseTags: ['tag-a'],
            conclusionTemplate: '推理结论',
          },
        ],
      });

      const i1 = vm.addGlobalInformation(store, {
        content: '前提',
        source: 'witnessed',
        timestamp: NOW,
        sceneId: 's1',
        tags: ['tag-a'],
      });
      vm.assignInformationToCharacter(store, 'char-a', i1.id);

      vm.applyInference(store, 'char-a', 's1', NOW);
      const second = vm.applyInference(store, 'char-a', 's1', NOW);
      expect(second).toHaveLength(0);
    });
  });

  // ── 遗忘规则 ──────────────────────────────────────────────────────────────

  describe('applyForgetting', () => {
    it('超过 maxAgeMs 的信息被遗忘', () => {
      vm.loadInformationRules({
        version: '1.0',
        forgetRules: [{ id: 'f1', name: '时间遗忘', maxAgeMs: 5000 }],
      });

      const old = vm.addGlobalInformation(store, {
        content: '旧信息',
        source: 'heard',
        timestamp: NOW - 10000,
        sceneId: 's1',
      });
      const fresh = vm.addGlobalInformation(store, {
        content: '新信息',
        source: 'heard',
        timestamp: NOW - 1000,
        sceneId: 's1',
      });
      vm.assignInformationToCharacter(store, 'char-a', old.id);
      vm.assignInformationToCharacter(store, 'char-a', fresh.id);

      const forgotten = vm.applyForgetting(store, 'char-a', NOW);
      expect(forgotten).toContain(old.id);
      expect(forgotten).not.toContain(fresh.id);
      expect(vm.characterKnowsInformation(store, 'char-a', old.id)).toBe(false);
      expect(vm.characterKnowsInformation(store, 'char-a', fresh.id)).toBe(
        true
      );
    });

    it('关键记忆不被遗忘（preserveKeyMemory 默认 true）', () => {
      vm.loadInformationRules({
        version: '1.0',
        forgetRules: [{ id: 'f1', name: '时间遗忘', maxAgeMs: 1000 }],
      });

      const key = vm.addGlobalInformation(store, {
        content: '关键记忆',
        source: 'witnessed',
        timestamp: NOW - 9999,
        sceneId: 's1',
        isKeyMemory: true,
      });
      vm.assignInformationToCharacter(store, 'char-a', key.id);

      const forgotten = vm.applyForgetting(store, 'char-a', NOW);
      expect(forgotten).not.toContain(key.id);
    });

    it('按标签遗忘', () => {
      vm.loadInformationRules({
        version: '1.0',
        forgetRules: [{ id: 'f1', name: '标签遗忘', targetTags: ['rumor'] }],
      });

      const rumor = vm.addGlobalInformation(store, {
        content: '谣言',
        source: 'heard',
        timestamp: NOW,
        sceneId: 's1',
        tags: ['rumor'],
      });
      const fact = vm.addGlobalInformation(store, {
        content: '事实',
        source: 'witnessed',
        timestamp: NOW,
        sceneId: 's1',
        tags: ['fact'],
      });
      vm.assignInformationToCharacter(store, 'char-a', rumor.id);
      vm.assignInformationToCharacter(store, 'char-a', fact.id);

      const forgotten = vm.applyForgetting(store, 'char-a', NOW);
      expect(forgotten).toContain(rumor.id);
      expect(forgotten).not.toContain(fact.id);
    });
  });

  // ── 模糊规则 ──────────────────────────────────────────────────────────────

  describe('applyFuzzy', () => {
    it('按来源类型降低置信度', () => {
      vm.loadInformationRules({
        version: '1.0',
        fuzzyRules: [
          {
            id: 'fz1',
            name: '听闻模糊',
            sourceTypes: ['heard'],
            decayFactor: 0.5,
          },
        ],
      });

      const heard = vm.addGlobalInformation(store, {
        content: '听说的',
        source: 'heard',
        timestamp: NOW,
        sceneId: 's1',
      });
      const witnessed = vm.addGlobalInformation(store, {
        content: '亲眼看到的',
        source: 'witnessed',
        timestamp: NOW,
        sceneId: 's1',
      });
      vm.assignInformationToCharacter(store, 'char-a', heard.id);
      vm.assignInformationToCharacter(store, 'char-a', witnessed.id);

      const refs = [
        { informationId: heard.id, acquiredAt: NOW, confidence: 0.9 },
        { informationId: witnessed.id, acquiredAt: NOW, confidence: 1.0 },
      ];

      const updated = vm.applyFuzzy(store, 'char-a', refs, NOW);
      expect(updated).toHaveLength(1);
      expect(updated[0].informationId).toBe(heard.id);
      expect(updated[0].confidence).toBeCloseTo(0.45);
    });

    it('afterAgeMs 未到时不模糊', () => {
      vm.loadInformationRules({
        version: '1.0',
        fuzzyRules: [
          {
            id: 'fz1',
            name: '时间模糊',
            sourceTypes: ['told'],
            decayFactor: 0.5,
            afterAgeMs: 10000,
          },
        ],
      });

      const told = vm.addGlobalInformation(store, {
        content: '刚被告知',
        source: 'told',
        timestamp: NOW - 1000, // 只过了 1 秒
        sceneId: 's1',
      });
      vm.assignInformationToCharacter(store, 'char-a', told.id);

      const refs = [
        { informationId: told.id, acquiredAt: NOW, confidence: 0.95 },
      ];
      const updated = vm.applyFuzzy(store, 'char-a', refs, NOW);
      expect(updated).toHaveLength(0);
    });
  });
});
