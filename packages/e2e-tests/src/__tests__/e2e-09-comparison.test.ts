/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-console */
/**
 * E2E-09: 单节点对比测试
 *
 * 验收标准：P1-AE-02
 * 测试目标：验证当前分支与锚点的对比功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnchorEvaluator } from '@star-rail/core/anchor-evaluation';
import { CharacterStateService } from '@star-rail/core/character-state';
import { VisionManager } from '@star-rail/core/vision-manager';
import { WorldEngine } from '@star-rail/core/world-engine';
import { JsonFileStorage } from '@star-rail/infrastructure/storage';
import type { Character, Anchor, Scene, Information } from '@star-rail/types';

describe('E2E-09: 单节点对比', () => {
  let anchorEvaluator: AnchorEvaluator;
  let characterState: CharacterStateService;
  let visionManager: VisionManager;
  let worldEngine: WorldEngine;

  beforeEach(async () => {
    const storage = new JsonFileStorage('./test-data/e2e-09');
    characterState = new CharacterStateService(storage);
    visionManager = new VisionManager(storage);
    worldEngine = new WorldEngine(storage);
    anchorEvaluator = new AnchorEvaluator({
      characterState,
      visionManager,
      worldEngine,
    });

    await setupTestScenario();
  });

  async function setupTestScenario() {
    // 创建场景
    const scene: Scene = {
      id: 'herta-station',
      name: '黑塔空间站',
      description: '一个巨大的空间站',
      environment: {
        physical: { lighting: 'bright', temperature: 'normal' },
        social: { tension: 0.3 },
        atmosphere: { mood: 'curious' },
      },
    };
    await worldEngine.createScene(scene);

    // 创建角色
    const star: Character = {
      id: 'star',
      name: '星',
      personality: { traits: { cautious: 0.6, curious: 0.8 } },
      relationships: {
        march7th: { trust: 70, affection: 60 },
      },
      abilities: {
        combat: 65,
        knowledge: 40,
      },
      knownInformation: ['info-1', 'info-2'],
    };
    await characterState.createCharacter(star);

    // 创建信息
    const info1: Information = {
      id: 'info-1',
      content: '黑塔空间站是研究星核的地方',
      source: {
        type: 'witnessed',
        characterId: 'star',
        sceneId: 'herta-station',
        timestamp: Date.now(),
      },
      tags: ['knowledge'],
    };

    const info2: Information = {
      id: 'info-2',
      content: '三月七是星的同伴',
      source: {
        type: 'witnessed',
        characterId: 'star',
        sceneId: 'herta-station',
        timestamp: Date.now(),
      },
      tags: ['relationship'],
    };

    await visionManager.addInformation(info1);
    await visionManager.addInformation(info2);
  }

  it('应该创建锚点并保存状态', async () => {
    // 创建锚点
    const anchor: Anchor = {
      id: 'anchor-node-1',
      nodeId: 'node-1',
      storylineId: 'main-story',
      timestamp: Date.now(),
      characters: {
        star: {
          state: {
            personality: { traits: { cautious: 0.6, curious: 0.8 } },
            relationships: {
              march7th: { trust: 70, affection: 60 },
            },
            abilities: {
              combat: 65,
              knowledge: 40,
            },
          },
          knownInformation: ['info-1', 'info-2'],
          reaction: '星对空间站充满好奇',
          judgment: '这里似乎隐藏着重要的秘密',
        },
      },
      environment: {
        sceneId: 'herta-station',
        state: {
          physical: { lighting: 'bright', temperature: 'normal' },
          social: { tension: 0.3 },
          atmosphere: { mood: 'curious' },
        },
      },
      plot: {
        eventId: 'event-arrive-station',
        branch: 'main',
        description: '星抵达黑塔空间站',
      },
    };

    const saved = await anchorEvaluator.saveAnchor(anchor);
    expect(saved).toBe(true);

    // 验证可以读取
    const loaded = await anchorEvaluator.getAnchor('anchor-node-1');
    expect(loaded).toBeDefined();
    expect(loaded!.id).toBe('anchor-node-1');
    expect(loaded!.characters['star'].state.abilities.combat).toBe(65);
  });

  it('应该对比人物状态差异', async () => {
    // 创建原剧情锚点
    const anchor: Anchor = {
      id: 'anchor-node-1',
      nodeId: 'node-1',
      storylineId: 'main-story',
      timestamp: Date.now(),
      characters: {
        star: {
          state: {
            personality: { traits: { cautious: 0.6, curious: 0.8 } },
            relationships: {
              march7th: { trust: 70, affection: 60 },
            },
            abilities: {
              combat: 65,
              knowledge: 40,
            },
          },
          knownInformation: ['info-1', 'info-2'],
          reaction: '星对空间站充满好奇',
          judgment: '这里似乎隐藏着重要的秘密',
        },
      },
      environment: {
        sceneId: 'herta-station',
        state: {
          physical: { lighting: 'bright', temperature: 'normal' },
          social: { tension: 0.3 },
          atmosphere: { mood: 'curious' },
        },
      },
      plot: {
        eventId: 'event-arrive-station',
        branch: 'main',
        description: '星抵达黑塔空间站',
      },
    };

    await anchorEvaluator.saveAnchor(anchor);

    // 修改当前分支的状态（模拟不同的剧情发展）
    await characterState.updateCharacterAbility('star', 'combat', 80);
    await characterState.updateRelationship('star', 'march7th', 'trust', 50);

    // 执行对比
    const comparison = await anchorEvaluator.compareWithAnchor('anchor-node-1');

    // 验证对比结果
    expect(comparison).toBeDefined();
    expect(comparison.anchorId).toBe('anchor-node-1');
    expect(comparison.differences).toBeDefined();
    expect(comparison.differences.length).toBeGreaterThan(0);

    // 验证能力差异
    const abilityDiff = comparison.differences.find(
      (d) => d.dimension === 'abilities' && d.field === 'combat'
    );
    expect(abilityDiff).toBeDefined();
    expect(abilityDiff!.anchorValue).toBe(65);
    expect(abilityDiff!.currentValue).toBe(80);

    // 验证关系差异
    const relationshipDiff = comparison.differences.find(
      (d) => d.dimension === 'relationships' && d.field === 'trust'
    );
    expect(relationshipDiff).toBeDefined();
    expect(relationshipDiff!.anchorValue).toBe(70);
    expect(relationshipDiff!.currentValue).toBe(50);
  });

  it('应该对比视野差异', async () => {
    // 创建锚点
    const anchor: Anchor = {
      id: 'anchor-node-2',
      nodeId: 'node-2',
      storylineId: 'main-story',
      timestamp: Date.now(),
      characters: {
        star: {
          state: {
            personality: { traits: { cautious: 0.6 } },
            relationships: {},
            abilities: {},
          },
          knownInformation: ['info-1', 'info-2'],
          reaction: '星知道两条信息',
          judgment: '正常的信息获取',
        },
      },
      environment: {
        sceneId: 'herta-station',
        state: {
          physical: { lighting: 'bright', temperature: 'normal' },
          social: { tension: 0.3 },
          atmosphere: { mood: 'curious' },
        },
      },
      plot: {
        eventId: 'event-1',
        branch: 'main',
        description: '初始状态',
      },
    };

    await anchorEvaluator.saveAnchor(anchor);

    // 当前分支中星获得了额外的信息
    const info3: Information = {
      id: 'info-3',
      content: '星核碎片的秘密',
      source: {
        type: 'witnessed',
        characterId: 'star',
        sceneId: 'herta-station',
        timestamp: Date.now(),
      },
      tags: ['secret'],
    };
    await visionManager.addInformation(info3);
    await visionManager.grantInformationToCharacter('star', 'info-3');

    // 执行对比
    const comparison = await anchorEvaluator.compareWithAnchor('anchor-node-2');

    // 验证视野差异
    expect(comparison.differences).toBeDefined();
    const visionDiff = comparison.differences.find(
      (d) => d.dimension === 'vision'
    );
    expect(visionDiff).toBeDefined();
    expect(visionDiff!.description).toContain('info-3');
  });

  it('应该生成差异说明', async () => {
    // 创建锚点
    const anchor: Anchor = {
      id: 'anchor-node-3',
      nodeId: 'node-3',
      storylineId: 'main-story',
      timestamp: Date.now(),
      characters: {
        star: {
          state: {
            personality: { traits: { cautious: 0.6 } },
            relationships: {
              march7th: { trust: 70 },
            },
            abilities: {
              combat: 65,
            },
          },
          knownInformation: ['info-1'],
          reaction: '正常反应',
          judgment: '正常判断',
        },
      },
      environment: {
        sceneId: 'herta-station',
        state: {
          physical: { lighting: 'bright', temperature: 'normal' },
          social: { tension: 0.3 },
          atmosphere: { mood: 'curious' },
        },
      },
      plot: {
        eventId: 'event-1',
        branch: 'main',
        description: '初始状态',
      },
    };

    await anchorEvaluator.saveAnchor(anchor);

    // 修改多个维度
    await characterState.updateCharacterAbility('star', 'combat', 80);
    await characterState.updateRelationship('star', 'march7th', 'trust', 50);

    // 执行对比
    const comparison = await anchorEvaluator.compareWithAnchor('anchor-node-3');

    // 验证差异说明
    expect(comparison.summary).toBeDefined();
    expect(comparison.summary.totalDifferences).toBeGreaterThan(0);
    expect(comparison.summary.description).toBeTruthy();
    expect(comparison.summary.description.length).toBeGreaterThan(10);

    // 验证每个差异都有说明
    for (const diff of comparison.differences) {
      expect(diff.description).toBeTruthy();
      expect(diff.description.length).toBeGreaterThan(5);
    }
  });

  it('应该支持多维度对比', async () => {
    // 创建完整锚点
    const anchor: Anchor = {
      id: 'anchor-node-4',
      nodeId: 'node-4',
      storylineId: 'main-story',
      timestamp: Date.now(),
      characters: {
        star: {
          state: {
            personality: { traits: { cautious: 0.6, curious: 0.8 } },
            relationships: {
              march7th: { trust: 70, affection: 60 },
            },
            abilities: {
              combat: 65,
              knowledge: 40,
            },
          },
          knownInformation: ['info-1', 'info-2'],
          reaction: '星对空间站充满好奇',
          judgment: '这里似乎隐藏着重要的秘密',
        },
      },
      environment: {
        sceneId: 'herta-station',
        state: {
          physical: { lighting: 'bright', temperature: 'normal' },
          social: { tension: 0.3 },
          atmosphere: { mood: 'curious' },
        },
      },
      plot: {
        eventId: 'event-arrive-station',
        branch: 'main',
        description: '星抵达黑塔空间站',
      },
    };

    await anchorEvaluator.saveAnchor(anchor);

    // 修改多个维度
    await characterState.updateCharacterAbility('star', 'combat', 80);
    await characterState.updateCharacterAbility('star', 'knowledge', 55);
    await characterState.updateRelationship('star', 'march7th', 'trust', 50);
    await worldEngine.updateEnvironment('herta-station', {
      physical: { lighting: 'dim', temperature: 'cold' },
      social: { tension: 0.8 },
      atmosphere: { mood: 'tense' },
    });

    // 执行对比
    const comparison = await anchorEvaluator.compareWithAnchor('anchor-node-4');

    // 验证包含多个维度的差异
    const dimensions = new Set(comparison.differences.map((d) => d.dimension));
    expect(dimensions.size).toBeGreaterThanOrEqual(3);
    expect(dimensions.has('abilities')).toBe(true);
    expect(dimensions.has('relationships')).toBe(true);
    expect(dimensions.has('environment')).toBe(true);
  });

  it('应该输出结构化对比报告', async () => {
    // 创建锚点
    const anchor: Anchor = {
      id: 'anchor-node-5',
      nodeId: 'node-5',
      storylineId: 'main-story',
      timestamp: Date.now(),
      characters: {
        star: {
          state: {
            personality: { traits: { cautious: 0.6 } },
            relationships: {},
            abilities: { combat: 65 },
          },
          knownInformation: ['info-1'],
          reaction: '正常',
          judgment: '正常',
        },
      },
      environment: {
        sceneId: 'herta-station',
        state: {
          physical: { lighting: 'bright', temperature: 'normal' },
          social: { tension: 0.3 },
          atmosphere: { mood: 'curious' },
        },
      },
      plot: {
        eventId: 'event-1',
        branch: 'main',
        description: '初始',
      },
    };

    await anchorEvaluator.saveAnchor(anchor);

    // 修改状态
    await characterState.updateCharacterAbility('star', 'combat', 80);

    // 生成对比报告
    const report =
      await anchorEvaluator.generateComparisonReport('anchor-node-5');

    // 验证报告结构
    expect(report).toBeDefined();
    expect(report.anchorId).toBe('anchor-node-5');
    expect(report.timestamp).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(report.differences).toBeDefined();
    expect(report.differences.length).toBeGreaterThan(0);

    // 验证报告可以序列化
    const json = JSON.stringify(report);
    expect(json).toBeTruthy();
    const parsed = JSON.parse(json);
    expect(parsed.anchorId).toBe('anchor-node-5');
  });
});
