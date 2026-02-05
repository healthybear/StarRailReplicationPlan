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
