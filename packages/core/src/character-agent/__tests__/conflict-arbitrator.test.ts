import 'reflect-metadata';
import { ConflictArbitrator } from '../conflict-arbitrator.js';
import type { AgentResponse } from '../character-agent.js';
import type { Character, SceneConfig } from '@star-rail/types';
import { createDefaultPersonality } from '@star-rail/types';

function makeResponse(
  characterId: string,
  action?: string,
  dialogue?: string
): AgentResponse {
  return {
    characterId,
    content: dialogue || action || '',
    parsed: {
      type: action ? ('action' as const) : ('dialogue' as const),
      action,
      dialogue,
    },
  };
}

function makeCharacter(
  id: string,
  abilities?: Record<string, number>
): Character {
  return {
    id,
    name: `角色${id}`,
    state: {
      relationships: {},
      abilities: abilities ?? {},
      knownInformation: [],
    },
    personality: createDefaultPersonality(),
  };
}

function makeScene(): SceneConfig {
  return { id: 'scene-1', name: '测试场景', description: '测试' };
}

describe('ConflictArbitrator', () => {
  let arbitrator: ConflictArbitrator;

  beforeEach(() => {
    arbitrator = new ConflictArbitrator();
  });

  describe('detectConflicts', () => {
    it('无冲突时返回空数组', () => {
      const responses = [
        makeResponse('char-a', undefined, '你好'),
        makeResponse('char-b', undefined, '你好啊'),
      ];
      const chars = {
        'char-a': makeCharacter('char-a'),
        'char-b': makeCharacter('char-b'),
      };
      expect(arbitrator.detectConflicts(responses, chars)).toHaveLength(0);
    });

    it('检测到行动冲突', () => {
      const responses = [
        makeResponse('char-a', '占领高地'),
        makeResponse('char-b', '控制高地'),
      ];
      const chars = {
        'char-a': makeCharacter('char-a'),
        'char-b': makeCharacter('char-b'),
      };
      const conflicts = arbitrator.detectConflicts(responses, chars);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe('action_conflict');
      expect(conflicts[0].characterIds).toContain('char-a');
      expect(conflicts[0].characterIds).toContain('char-b');
    });

    it('单角色行动不产生冲突', () => {
      const responses = [makeResponse('char-a', '占领高地')];
      const chars = { 'char-a': makeCharacter('char-a') };
      expect(arbitrator.detectConflicts(responses, chars)).toHaveLength(0);
    });
  });

  describe('arbitrate - priority 策略', () => {
    it('能力值高的角色获胜', () => {
      const responses = [
        makeResponse('char-weak', '占领高地'),
        makeResponse('char-strong', '控制高地'),
      ];
      const chars = {
        'char-weak': makeCharacter('char-weak', { combat: 20 }),
        'char-strong': makeCharacter('char-strong', { combat: 80 }),
      };
      const conflict = {
        type: 'action_conflict' as const,
        characterIds: ['char-weak', 'char-strong'],
        description: '冲突',
        severity: 0.7,
      };
      const result = arbitrator.arbitrate(
        conflict,
        responses,
        chars,
        makeScene(),
        'priority'
      );
      expect(result.winnerId).toBe('char-strong');
      expect(result.deadlock).toBe(false);
      // 失败者的行动被取消
      const loserResponse = result.resolvedResponses.find(
        (r) => r.characterId === 'char-weak'
      );
      expect(loserResponse?.parsed?.action).toBeUndefined();
    });
  });

  describe('arbitrate - compromise 策略', () => {
    it('折中时无胜者，行动被降级', () => {
      const responses = [
        makeResponse('char-a', '占领高地'),
        makeResponse('char-b', '控制高地'),
      ];
      const chars = {
        'char-a': makeCharacter('char-a'),
        'char-b': makeCharacter('char-b'),
      };
      const conflict = {
        type: 'action_conflict' as const,
        characterIds: ['char-a', 'char-b'],
        description: '冲突',
        severity: 0.5,
      };
      const result = arbitrator.arbitrate(
        conflict,
        responses,
        chars,
        makeScene(),
        'compromise'
      );
      expect(result.winnerId).toBeUndefined();
      expect(result.deadlock).toBe(false);
      // 行动被降级为"尝试"
      for (const r of result.resolvedResponses) {
        if (r.parsed?.action) {
          expect(r.parsed.action).toContain('尝试');
        }
      }
    });
  });

  describe('arbitrate - first_wins 策略', () => {
    it('第一个响应的角色获胜', () => {
      const responses = [
        makeResponse('char-first', '占领高地'),
        makeResponse('char-second', '控制高地'),
      ];
      const chars = {
        'char-first': makeCharacter('char-first'),
        'char-second': makeCharacter('char-second'),
      };
      const conflict = {
        type: 'action_conflict' as const,
        characterIds: ['char-first', 'char-second'],
        description: '冲突',
        severity: 0.5,
      };
      const result = arbitrator.arbitrate(
        conflict,
        responses,
        chars,
        makeScene(),
        'first_wins'
      );
      expect(result.winnerId).toBe('char-first');
      const loser = result.resolvedResponses.find(
        (r) => r.characterId === 'char-second'
      );
      expect(loser?.parsed?.action).toBeUndefined();
    });
  });

  describe('arbitrate - random 策略', () => {
    it('随机裁决有胜者且不死锁', () => {
      const responses = [
        makeResponse('char-a', '占领高地'),
        makeResponse('char-b', '控制高地'),
      ];
      const chars = {
        'char-a': makeCharacter('char-a'),
        'char-b': makeCharacter('char-b'),
      };
      const conflict = {
        type: 'action_conflict' as const,
        characterIds: ['char-a', 'char-b'],
        description: '冲突',
        severity: 0.5,
      };
      const result = arbitrator.arbitrate(
        conflict,
        responses,
        chars,
        makeScene(),
        'random'
      );
      expect(result.winnerId).toBeDefined();
      expect(result.deadlock).toBe(false);
    });
  });

  describe('resolveAll', () => {
    it('无冲突时直接返回原响应', () => {
      const responses = [
        makeResponse('char-a', undefined, '你好'),
        makeResponse('char-b', undefined, '你好啊'),
      ];
      const chars = {
        'char-a': makeCharacter('char-a'),
        'char-b': makeCharacter('char-b'),
      };
      const result = arbitrator.resolveAll(responses, chars, makeScene());
      expect(result.finalResponses).toEqual(responses);
      expect(result.arbitrations).toHaveLength(0);
      expect(result.hasDeadlock).toBe(false);
    });

    it('有冲突时执行裁决并返回裁决结果', () => {
      const responses = [
        makeResponse('char-a', '占领高地'),
        makeResponse('char-b', '控制高地'),
      ];
      const chars = {
        'char-a': makeCharacter('char-a', { combat: 30 }),
        'char-b': makeCharacter('char-b', { combat: 70 }),
      };
      const result = arbitrator.resolveAll(
        responses,
        chars,
        makeScene(),
        'priority'
      );
      expect(result.arbitrations.length).toBeGreaterThan(0);
      expect(result.hasDeadlock).toBe(false);
      // 最终响应数量不变
      expect(result.finalResponses).toHaveLength(2);
    });
  });
});
