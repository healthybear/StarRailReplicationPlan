import 'reflect-metadata';
import { BehaviorEngine, TriggerEngine } from '../behavior-engine.js';
import { CharacterStateService } from '../character-state.service.js';
import type {
  Character,
  BigFiveTraits,
  TriggerRule,
  TriggerTableConfig,
} from '@star-rail/types';
import {
  createDefaultPersonality,
  createDefaultRelationship,
} from '@star-rail/types';

// 创建测试用人物
function createTestCharacter(id: string, name: string): Character {
  return {
    id,
    name,
    state: {
      relationships: {},
      abilities: {},
      knownInformation: [],
    },
    personality: createDefaultPersonality(),
  };
}

describe('BehaviorEngine', () => {
  let engine: BehaviorEngine;

  beforeEach(() => {
    engine = new BehaviorEngine();
  });

  describe('deriveBehaviorTendencies', () => {
    it('should derive exploration tendency correctly', () => {
      const traits: BigFiveTraits = {
        openness: 0.8,
        conscientiousness: 0.5,
        extraversion: 0.6,
        agreeableness: 0.5,
        neuroticism: 0.3,
      };

      const tendencies = engine.deriveBehaviorTendencies(traits);

      // exploration = 0.7 * openness + 0.3 * extraversion
      // = 0.7 * 0.8 + 0.3 * 0.6 = 0.56 + 0.18 = 0.74
      expect(tendencies.exploration).toBeCloseTo(0.74, 2);
    });

    it('should derive cooperation tendency correctly', () => {
      const traits: BigFiveTraits = {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.7,
        agreeableness: 0.8,
        neuroticism: 0.3,
      };

      const tendencies = engine.deriveBehaviorTendencies(traits);

      // cooperation = 0.7 * agreeableness + 0.3 * extraversion
      // = 0.7 * 0.8 + 0.3 * 0.7 = 0.56 + 0.21 = 0.77
      expect(tendencies.cooperation).toBeCloseTo(0.77, 2);
    });

    it('should derive caution tendency correctly', () => {
      const traits: BigFiveTraits = {
        openness: 0.5,
        conscientiousness: 0.8,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.6,
      };

      const tendencies = engine.deriveBehaviorTendencies(traits);

      // caution = 0.6 * conscientiousness + 0.4 * neuroticism
      // = 0.6 * 0.8 + 0.4 * 0.6 = 0.48 + 0.24 = 0.72
      expect(tendencies.caution).toBeCloseTo(0.72, 2);
    });

    it('should derive impulsivity tendency correctly', () => {
      const traits: BigFiveTraits = {
        openness: 0.5,
        conscientiousness: 0.3,
        extraversion: 0.7,
        agreeableness: 0.5,
        neuroticism: 0.5,
      };

      const tendencies = engine.deriveBehaviorTendencies(traits);

      // impulsivity = 0.6 * (1 - conscientiousness) + 0.4 * extraversion
      // = 0.6 * 0.7 + 0.4 * 0.7 = 0.42 + 0.28 = 0.70
      expect(tendencies.impulsivity).toBeCloseTo(0.7, 2);
    });

    it('should derive assertiveness tendency correctly', () => {
      const traits: BigFiveTraits = {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.8,
        agreeableness: 0.5,
        neuroticism: 0.2,
      };

      const tendencies = engine.deriveBehaviorTendencies(traits);

      // assertiveness = 0.7 * extraversion + 0.3 * (1 - neuroticism)
      // = 0.7 * 0.8 + 0.3 * 0.8 = 0.56 + 0.24 = 0.80
      expect(tendencies.assertiveness).toBeCloseTo(0.8, 2);
    });
  });

  describe('ensureBehaviorTendencies', () => {
    it('should return existing behavior tendencies if present', () => {
      const character = createTestCharacter('test', 'Test');
      character.personality.behaviorTendencies = {
        exploration: 0.9,
        cooperation: 0.8,
        caution: 0.7,
        impulsivity: 0.6,
        assertiveness: 0.5,
      };

      const tendencies = engine.ensureBehaviorTendencies(character);

      expect(tendencies.exploration).toBe(0.9);
    });

    it('should derive behavior tendencies if not present', () => {
      const character = createTestCharacter('test', 'Test');
      character.personality.traits = {
        openness: 0.8,
        conscientiousness: 0.5,
        extraversion: 0.6,
        agreeableness: 0.5,
        neuroticism: 0.3,
      };

      const tendencies = engine.ensureBehaviorTendencies(character);

      expect(tendencies.exploration).toBeCloseTo(0.74, 2);
    });
  });
});

describe('TriggerEngine', () => {
  let engine: TriggerEngine;

  beforeEach(() => {
    engine = new TriggerEngine();
  });

  describe('executeRules', () => {
    it('should apply delta change to relationship', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.relationships['char_b'] = createDefaultRelationship();

      const rules: TriggerRule[] = [
        {
          id: 'test_rule',
          name: 'Test Rule',
          eventType: 'help',
          effects: [
            {
              target: 'relationship.trust',
              changeType: 'delta',
              value: 0.1,
              min: 0,
              max: 1,
            },
          ],
        },
      ];

      const initialTrust = character.state.relationships['char_b'].trust;
      engine.executeRules(character, rules, 'help', {
        targetCharacterId: 'char_b',
      });

      expect(character.state.relationships['char_b'].trust).toBeCloseTo(
        initialTrust + 0.1,
        2
      );
    });

    it('should apply set change to relationship', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.relationships['char_b'] = createDefaultRelationship();

      const rules: TriggerRule[] = [
        {
          id: 'test_rule',
          name: 'Test Rule',
          eventType: 'betrayal',
          effects: [
            {
              target: 'relationship.trust',
              changeType: 'set',
              value: 0.1,
              min: 0,
              max: 1,
            },
          ],
        },
      ];

      engine.executeRules(character, rules, 'betrayal', {
        targetCharacterId: 'char_b',
      });

      expect(character.state.relationships['char_b'].trust).toBe(0.1);
    });

    it('should apply multiply change to relationship', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.relationships['char_b'] = {
        ...createDefaultRelationship(),
        intimacy: 0.8,
      };

      const rules: TriggerRule[] = [
        {
          id: 'test_rule',
          name: 'Test Rule',
          eventType: 'betrayal',
          effects: [
            {
              target: 'relationship.intimacy',
              changeType: 'multiply',
              value: 0.5,
              min: 0,
              max: 1,
            },
          ],
        },
      ];

      engine.executeRules(character, rules, 'betrayal', {
        targetCharacterId: 'char_b',
      });

      expect(character.state.relationships['char_b'].intimacy).toBeCloseTo(
        0.4,
        2
      );
    });

    it('should apply change to ability', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.abilities['combat'] = 50;

      const rules: TriggerRule[] = [
        {
          id: 'test_rule',
          name: 'Test Rule',
          eventType: 'training',
          effects: [
            {
              target: 'ability.combat',
              changeType: 'delta',
              value: 10,
              min: 0,
              max: 100,
            },
          ],
        },
      ];

      engine.executeRules(character, rules, 'training', {});

      expect(character.state.abilities['combat']).toBe(60);
    });

    it('should respect min/max boundaries', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.relationships['char_b'] = {
        ...createDefaultRelationship(),
        trust: 0.95,
      };

      const rules: TriggerRule[] = [
        {
          id: 'test_rule',
          name: 'Test Rule',
          eventType: 'help',
          effects: [
            {
              target: 'relationship.trust',
              changeType: 'delta',
              value: 0.2,
              min: 0,
              max: 1,
            },
          ],
        },
      ];

      engine.executeRules(character, rules, 'help', {
        targetCharacterId: 'char_b',
      });

      expect(character.state.relationships['char_b'].trust).toBe(1);
    });

    it('should filter rules by event type', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.relationships['char_b'] = createDefaultRelationship();

      const rules: TriggerRule[] = [
        {
          id: 'help_rule',
          name: 'Help Rule',
          eventType: 'help',
          effects: [
            {
              target: 'relationship.trust',
              changeType: 'delta',
              value: 0.1,
              min: 0,
              max: 1,
            },
          ],
        },
        {
          id: 'conflict_rule',
          name: 'Conflict Rule',
          eventType: 'conflict',
          effects: [
            {
              target: 'relationship.trust',
              changeType: 'delta',
              value: -0.2,
              min: 0,
              max: 1,
            },
          ],
        },
      ];

      const initialTrust = character.state.relationships['char_b'].trust;
      engine.executeRules(character, rules, 'help', {
        targetCharacterId: 'char_b',
      });

      // Only help rule should be applied
      expect(character.state.relationships['char_b'].trust).toBeCloseTo(
        initialTrust + 0.1,
        2
      );
    });

    it('should execute rules in priority order', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.relationships['char_b'] = {
        ...createDefaultRelationship(),
        trust: 0.5,
      };

      const rules: TriggerRule[] = [
        {
          id: 'low_priority',
          name: 'Low Priority',
          eventType: 'test',
          priority: 5,
          effects: [
            {
              target: 'relationship.trust',
              changeType: 'delta',
              value: 0.1,
              min: 0,
              max: 1,
            },
          ],
        },
        {
          id: 'high_priority',
          name: 'High Priority',
          eventType: 'test',
          priority: 10,
          effects: [
            {
              target: 'relationship.trust',
              changeType: 'set',
              value: 0.8,
              min: 0,
              max: 1,
            },
          ],
        },
      ];

      engine.executeRules(character, rules, 'test', {
        targetCharacterId: 'char_b',
      });

      // High priority (set to 0.8) executes first, then low priority (delta +0.1)
      expect(character.state.relationships['char_b'].trust).toBeCloseTo(0.9, 2);
    });
  });
});

describe('CharacterStateService', () => {
  let service: CharacterStateService;
  let behaviorEngine: BehaviorEngine;
  let triggerEngine: TriggerEngine;

  beforeEach(() => {
    behaviorEngine = new BehaviorEngine();
    triggerEngine = new TriggerEngine();
    service = new CharacterStateService(behaviorEngine, triggerEngine);
  });

  describe('loadTriggerTable', () => {
    it('should load and sort trigger rules by priority', () => {
      const config: TriggerTableConfig = {
        version: '0.1.0',
        rules: [
          {
            id: 'low',
            name: 'Low',
            eventType: 'test',
            priority: 5,
            effects: [],
          },
          {
            id: 'high',
            name: 'High',
            eventType: 'test',
            priority: 20,
            effects: [],
          },
          {
            id: 'medium',
            name: 'Medium',
            eventType: 'test',
            priority: 10,
            effects: [],
          },
        ],
      };

      service.loadTriggerTable(config);
      const rules = service.getTriggerRules();

      expect(rules[0].id).toBe('high');
      expect(rules[1].id).toBe('medium');
      expect(rules[2].id).toBe('low');
    });
  });

  describe('getRulesByEventType', () => {
    it('should filter rules by event type', () => {
      const config: TriggerTableConfig = {
        version: '0.1.0',
        rules: [
          {
            id: 'help',
            name: 'Help',
            eventType: 'help',
            effects: [],
          },
          {
            id: 'conflict',
            name: 'Conflict',
            eventType: 'conflict',
            effects: [],
          },
        ],
      };

      service.loadTriggerTable(config);
      const helpRules = service.getRulesByEventType('help');

      expect(helpRules).toHaveLength(1);
      expect(helpRules[0].id).toBe('help');
    });
  });

  describe('getRelationship', () => {
    it('should return existing relationship', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.relationships['char_b'] = {
        trust: 0.8,
        hostility: 0.1,
        intimacy: 0.6,
        respect: 0.7,
      };

      const relationship = service.getRelationship(character, 'char_b');

      expect(relationship.trust).toBe(0.8);
    });

    it('should create default relationship if not exists', () => {
      const character = createTestCharacter('char_a', 'Character A');

      const relationship = service.getRelationship(character, 'char_b');

      expect(relationship.trust).toBe(0.5);
      expect(relationship.hostility).toBe(0);
    });
  });

  describe('updateRelationship', () => {
    it('should update relationship and record change', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.relationships['char_b'] = createDefaultRelationship();

      service.updateRelationship(character, 'char_b', { trust: 0.9 });

      expect(character.state.relationships['char_b'].trust).toBe(0.9);

      const history = service.getStateChangeHistory(character.id);
      expect(history).toHaveLength(1);
      expect(history[0].target).toBe('relationship.trust');
      expect(history[0].newValue).toBe(0.9);
    });
  });

  describe('processEvent', () => {
    it('should process event and return state changes', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.relationships['char_b'] = createDefaultRelationship();

      const config: TriggerTableConfig = {
        version: '0.1.0',
        rules: [
          {
            id: 'help_rule',
            name: 'Help Rule',
            eventType: 'help',
            effects: [
              {
                target: 'relationship.trust',
                changeType: 'delta',
                value: 0.1,
                min: 0,
                max: 1,
              },
            ],
          },
        ],
      };

      service.loadTriggerTable(config);
      const changes = service.processEvent(character, 'help', {
        targetCharacterId: 'char_b',
      });

      expect(changes).toHaveLength(1);
      expect(changes[0].target).toBe('relationship.trust');
      expect(changes[0].ruleId).toBe('help_rule');
    });
  });

  describe('state change listener', () => {
    it('should notify listeners on state change', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.relationships['char_b'] = createDefaultRelationship();

      const listener = jest.fn();
      service.addStateChangeListener(listener);

      service.updateRelationship(character, 'char_b', { trust: 0.9 });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        character,
        expect.objectContaining({
          target: 'relationship.trust',
          newValue: 0.9,
        })
      );
    });

    it('should remove listener correctly', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.relationships['char_b'] = createDefaultRelationship();

      const listener = jest.fn();
      service.addStateChangeListener(listener);
      service.removeStateChangeListener(listener);

      service.updateRelationship(character, 'char_b', { trust: 0.9 });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getStateSummary', () => {
    it('should return correct state summary', () => {
      const character = createTestCharacter('char_a', 'Character A');
      character.state.relationships['char_b'] = createDefaultRelationship();
      character.state.relationships['char_c'] = createDefaultRelationship();
      character.state.abilities['combat'] = 50;
      character.state.knownInformation = [
        { informationId: 'info_1', acquiredAt: Date.now() },
      ];

      const summary = service.getStateSummary(character);

      expect(summary.relationshipCount).toBe(2);
      expect(summary.abilityCount).toBe(1);
      expect(summary.knownInformationCount).toBe(1);
      expect(summary.behaviorTendencies).toBeDefined();
    });
  });

  describe('Trigger Table Verification', () => {
    it('should correctly apply relationship trigger from config', () => {
      const character = createTestCharacter('march7', 'March 7th');
      character.state.relationships['stelle'] = createDefaultRelationship();

      // 模拟加载 relationship_triggers.yaml 中的规则
      const config: TriggerTableConfig = {
        version: '0.1.0',
        rules: [
          {
            id: 'help_increases_trust',
            name: '帮助行为增加信任',
            eventType: 'help',
            effects: [
              {
                target: 'relationship.trust',
                changeType: 'delta',
                value: 0.05,
                min: 0,
                max: 1,
              },
            ],
            priority: 10,
          },
        ],
      };

      service.loadTriggerTable(config);

      const initialTrust = character.state.relationships['stelle'].trust;
      const changes = service.processEvent(character, 'help', {
        targetCharacterId: 'stelle',
      });

      expect(changes).toHaveLength(1);
      expect(character.state.relationships['stelle'].trust).toBeCloseTo(
        initialTrust + 0.05,
        2
      );
    });
  });
});
