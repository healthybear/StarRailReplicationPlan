/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-console */
/**
 * E2E-08: 状态演化触发测试
 *
 * 验收标准：P1-CS-03
 * 测试目标：验证关系维度可配置触发并生效
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterStateService } from '@star-rail/core/character-state';
import { WorldEngine } from '@star-rail/core/world-engine';
import { StoryOrchestrator } from '@star-rail/core/story-orchestrator';
import { JsonFileStorage } from '@star-rail/infrastructure/storage';
import type { Character, TriggerRule, GameEvent } from '@star-rail/types';

describe('E2E-08: 关系维度触发', () => {
  let characterState: CharacterStateService;
  let worldEngine: WorldEngine;
  let storage: JsonFileStorage;

  beforeEach(async () => {
    storage = new JsonFileStorage('./test-data/e2e-08');
    characterState = new CharacterStateService(storage);
    worldEngine = new WorldEngine(storage);

    // 创建测试角色
    const star: Character = {
      id: 'star',
      name: '星',
      personality: { traits: { cautious: 0.6 } },
      relationships: {
        march7th: { trust: 50, affection: 50 },
      },
      abilities: {},
      knownInformation: [],
    };

    const march7th: Character = {
      id: 'march7th',
      name: '三月七',
      personality: { traits: { cheerful: 0.9 } },
      relationships: {
        star: { trust: 50, affection: 50 },
      },
      abilities: {},
      knownInformation: [],
    };

    await characterState.createCharacter(star);
    await characterState.createCharacter(march7th);

    // 配置触发表
    await setupTriggerRules();
  });

  async function setupTriggerRules() {
    const rules: TriggerRule[] = [
      {
        id: 'help-increases-trust',
        eventType: 'help',
        condition: {
          actorId: 'star',
          targetId: 'march7th',
        },
        effects: [
          {
            type: 'relationship_change',
            characterId: 'march7th',
            targetCharacterId: 'star',
            dimension: 'trust',
            change: 10,
            min: 0,
            max: 100,
          },
        ],
      },
      {
        id: 'betray-decreases-trust',
        eventType: 'betray',
        condition: {
          actorId: 'star',
          targetId: 'march7th',
        },
        effects: [
          {
            type: 'relationship_change',
            characterId: 'march7th',
            targetCharacterId: 'star',
            dimension: 'trust',
            change: -30,
            min: 0,
            max: 100,
          },
        ],
      },
      {
        id: 'gift-increases-affection',
        eventType: 'gift',
        condition: {
          actorId: 'star',
          targetId: 'march7th',
        },
        effects: [
          {
            type: 'relationship_change',
            characterId: 'march7th',
            targetCharacterId: 'star',
            dimension: 'affection',
            change: 15,
            min: 0,
            max: 100,
          },
        ],
      },
    ];

    await characterState.loadTriggerRules(rules);
  }

  it('应该正确加载触发表配置', async () => {
    const rules = await characterState.getTriggerRules();

    expect(rules).toBeDefined();
    expect(rules.length).toBeGreaterThanOrEqual(3);

    const helpRule = rules.find((r) => r.id === 'help-increases-trust');
    expect(helpRule).toBeDefined();
    expect(helpRule!.eventType).toBe('help');
    expect(helpRule!.effects[0].change).toBe(10);
  });

  it('应该在帮助事件后增加信任度', async () => {
    // 获取初始信任度
    const initialState = await characterState.getCharacter('march7th');
    const initialTrust = initialState!.relationships['star'].trust;
    expect(initialTrust).toBe(50);

    // 触发帮助事件
    const event: GameEvent = {
      id: 'event-help-1',
      type: 'help',
      actorId: 'star',
      targetId: 'march7th',
      timestamp: Date.now(),
      sceneId: 'herta-station',
    };

    await characterState.processEvent(event);

    // 验证信任度增加
    const updatedState = await characterState.getCharacter('march7th');
    const updatedTrust = updatedState!.relationships['star'].trust;
    expect(updatedTrust).toBe(60); // 50 + 10
  });

  it('应该在背叛事件后减少信任度', async () => {
    // 触发背叛事件
    const event: GameEvent = {
      id: 'event-betray-1',
      type: 'betray',
      actorId: 'star',
      targetId: 'march7th',
      timestamp: Date.now(),
      sceneId: 'herta-station',
    };

    await characterState.processEvent(event);

    // 验证信任度减少
    const updatedState = await characterState.getCharacter('march7th');
    const updatedTrust = updatedState!.relationships['star'].trust;
    expect(updatedTrust).toBe(20); // 50 - 30
  });

  it('应该在赠礼事件后增加好感度', async () => {
    // 获取初始好感度
    const initialState = await characterState.getCharacter('march7th');
    const initialAffection = initialState!.relationships['star'].affection;
    expect(initialAffection).toBe(50);

    // 触发赠礼事件
    const event: GameEvent = {
      id: 'event-gift-1',
      type: 'gift',
      actorId: 'star',
      targetId: 'march7th',
      timestamp: Date.now(),
      sceneId: 'herta-station',
    };

    await characterState.processEvent(event);

    // 验证好感度增加
    const updatedState = await characterState.getCharacter('march7th');
    const updatedAffection = updatedState!.relationships['star'].affection;
    expect(updatedAffection).toBe(65); // 50 + 15
  });

  it('应该遵守上下限约束', async () => {
    // 连续触发多次帮助事件，测试上限
    for (let i = 0; i < 10; i++) {
      const event: GameEvent = {
        id: `event-help-${i}`,
        type: 'help',
        actorId: 'star',
        targetId: 'march7th',
        timestamp: Date.now(),
        sceneId: 'herta-station',
      };
      await characterState.processEvent(event);
    }

    // 验证不超过上限 100
    const state = await characterState.getCharacter('march7th');
    const trust = state!.relationships['star'].trust;
    expect(trust).toBeLessThanOrEqual(100);
    expect(trust).toBe(100); // 应该达到上限

    // 测试下限
    for (let i = 0; i < 10; i++) {
      const event: GameEvent = {
        id: `event-betray-${i}`,
        type: 'betray',
        actorId: 'star',
        targetId: 'march7th',
        timestamp: Date.now(),
        sceneId: 'herta-station',
      };
      await characterState.processEvent(event);
    }

    const finalState = await characterState.getCharacter('march7th');
    const finalTrust = finalState!.relationships['star'].trust;
    expect(finalTrust).toBeGreaterThanOrEqual(0);
    expect(finalTrust).toBe(0); // 应该达到下限
  });

  it('应该支持多维度同时变化', async () => {
    // 创建同时影响多个维度的触发规则
    const complexRule: TriggerRule = {
      id: 'save-life-complex',
      eventType: 'save_life',
      condition: {
        actorId: 'star',
        targetId: 'march7th',
      },
      effects: [
        {
          type: 'relationship_change',
          characterId: 'march7th',
          targetCharacterId: 'star',
          dimension: 'trust',
          change: 30,
          min: 0,
          max: 100,
        },
        {
          type: 'relationship_change',
          characterId: 'march7th',
          targetCharacterId: 'star',
          dimension: 'affection',
          change: 25,
          min: 0,
          max: 100,
        },
      ],
    };

    await characterState.addTriggerRule(complexRule);

    // 触发救命事件
    const event: GameEvent = {
      id: 'event-save-life-1',
      type: 'save_life',
      actorId: 'star',
      targetId: 'march7th',
      timestamp: Date.now(),
      sceneId: 'herta-station',
    };

    await characterState.processEvent(event);

    // 验证两个维度都变化了
    const state = await characterState.getCharacter('march7th');
    expect(state!.relationships['star'].trust).toBe(80); // 50 + 30
    expect(state!.relationships['star'].affection).toBe(75); // 50 + 25
  });
});
