/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-console */
/**
 * E2E-02/03/04: 导出/导入功能测试
 *
 * 验收标准：P1-EI-01, P1-EI-02, P1-EI-03
 * 测试目标：
 * - E2E-02: 验证人物可以导出并在新会话中导入
 * - E2E-03: 验证场景可以导出并在新会话中导入
 * - E2E-04: 验证 ID 冲突时的处理策略
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExportImportService } from '@star-rail/core/export-import';
import { CharacterStateService } from '@star-rail/core/character-state';
import { WorldEngine } from '@star-rail/core/world-engine';
import { JsonFileStorage } from '@star-rail/infrastructure/storage';
import type { Character, Scene, ExportPackage } from '@star-rail/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('E2E-02: 人物导出与导入', () => {
  let exportService: ExportImportService;
  let characterStateA: CharacterStateService;
  let characterStateB: CharacterStateService;
  let storageA: JsonFileStorage;
  let storageB: JsonFileStorage;

  const testDataDir = './test-data/e2e-02';

  beforeEach(async () => {
    // 清理测试数据
    await fs.rm(testDataDir, { recursive: true, force: true });
    await fs.mkdir(testDataDir, { recursive: true });

    // 会话 A
    storageA = new JsonFileStorage(path.join(testDataDir, 'session-a'));
    characterStateA = new CharacterStateService(storageA);

    // 会话 B
    storageB = new JsonFileStorage(path.join(testDataDir, 'session-b'));
    characterStateB = new CharacterStateService(storageB);

    exportService = new ExportImportService(storageA);
  });

  afterEach(async () => {
    // 清理测试数据
    await fs.rm(testDataDir, { recursive: true, force: true });
  });

  it('应该成功导出角色为 JSON', async () => {
    // 创建角色
    const star: Character = {
      id: 'star',
      name: '星',
      personality: {
        traits: { cautious: 0.6, curious: 0.8 },
      },
      relationships: {
        march7th: { trust: 70, affection: 60 },
      },
      abilities: {
        combat: 65,
        knowledge: 40,
      },
      knownInformation: ['info-1', 'info-2'],
    };

    await characterStateA.createCharacter(star);

    // 导出角色
    const exportPackage = await exportService.exportCharacter('star');

    // 验证导出包结构
    expect(exportPackage).toBeDefined();
    expect(exportPackage.metadata).toBeDefined();
    expect(exportPackage.metadata.type).toBe('character');
    expect(exportPackage.metadata.version).toBeDefined();
    expect(exportPackage.data).toBeDefined();
    expect(exportPackage.data.id).toBe('star');
    expect(exportPackage.data.name).toBe('星');
  });

  it('应该成功导入角色到新会话', async () => {
    // 在会话 A 创建并导出角色
    const star: Character = {
      id: 'star',
      name: '星',
      personality: {
        traits: { cautious: 0.6, curious: 0.8 },
      },
      relationships: {
        march7th: { trust: 70, affection: 60 },
      },
      abilities: {
        combat: 65,
        knowledge: 40,
      },
      knownInformation: ['info-1', 'info-2'],
    };

    await characterStateA.createCharacter(star);
    const exportPackage = await exportService.exportCharacter('star');

    // 在会话 B 导入角色
    const importService = new ExportImportService(storageB);
    const result = await importService.importCharacter(exportPackage);

    expect(result.success).toBe(true);
    expect(result.conflicts).toHaveLength(0);

    // 验证导入后的角色状态
    const importedStar = await characterStateB.getCharacter('star');
    expect(importedStar).toBeDefined();
    expect(importedStar!.name).toBe('星');
    expect(importedStar!.personality.traits.cautious).toBe(0.6);
    expect(importedStar!.relationships['march7th'].trust).toBe(70);
    expect(importedStar!.abilities.combat).toBe(65);
    expect(importedStar!.knownInformation).toEqual(['info-1', 'info-2']);
  });

  it('应该保持状态一致性', async () => {
    // 创建角色并修改状态
    const star: Character = {
      id: 'star',
      name: '星',
      personality: {
        traits: { cautious: 0.6 },
      },
      relationships: {},
      abilities: { combat: 50 },
      knownInformation: [],
    };

    await characterStateA.createCharacter(star);

    // 修改状态
    await characterStateA.updateCharacterAbility('star', 'combat', 75);
    await characterStateA.updateRelationship('star', 'march7th', 'trust', 80);

    // 导出
    const exportPackage = await exportService.exportCharacter('star');

    // 导入到新会话
    const importService = new ExportImportService(storageB);
    await importService.importCharacter(exportPackage);

    // 验证状态一致
    const imported = await characterStateB.getCharacter('star');
    expect(imported!.abilities.combat).toBe(75);
    expect(imported!.relationships['march7th'].trust).toBe(80);
  });
});

describe('E2E-03: 场景导出与导入', () => {
  let exportService: ExportImportService;
  let worldEngineA: WorldEngine;
  let worldEngineB: WorldEngine;
  let storageA: JsonFileStorage;
  let storageB: JsonFileStorage;

  const testDataDir = './test-data/e2e-03';

  beforeEach(async () => {
    await fs.rm(testDataDir, { recursive: true, force: true });
    await fs.mkdir(testDataDir, { recursive: true });

    storageA = new JsonFileStorage(path.join(testDataDir, 'session-a'));
    worldEngineA = new WorldEngine(storageA);

    storageB = new JsonFileStorage(path.join(testDataDir, 'session-b'));
    worldEngineB = new WorldEngine(storageB);

    exportService = new ExportImportService(storageA);
  });

  afterEach(async () => {
    await fs.rm(testDataDir, { recursive: true, force: true });
  });

  it('应该成功导出场景为 JSON', async () => {
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

    await worldEngineA.createScene(scene);

    // 导出场景
    const exportPackage = await exportService.exportScene('herta-station');

    // 验证导出包
    expect(exportPackage).toBeDefined();
    expect(exportPackage.metadata.type).toBe('scene');
    expect(exportPackage.data.id).toBe('herta-station');
    expect(exportPackage.data.name).toBe('黑塔空间站');
  });

  it('应该成功导入场景到新会话', async () => {
    // 创建并导出场景
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

    await worldEngineA.createScene(scene);
    const exportPackage = await exportService.exportScene('herta-station');

    // 导入到新会话
    const importService = new ExportImportService(storageB);
    const result = await importService.importScene(exportPackage);

    expect(result.success).toBe(true);

    // 验证导入后的场景
    const imported = await worldEngineB.getScene('herta-station');
    expect(imported).toBeDefined();
    expect(imported!.name).toBe('黑塔空间站');
    expect(imported!.environment.physical.lighting).toBe('bright');
    expect(imported!.environment.social.tension).toBe(0.3);
  });

  it('应该保持环境状态一致性', async () => {
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

    await worldEngineA.createScene(scene);

    // 修改环境状态
    await worldEngineA.updateEnvironment('herta-station', {
      physical: { lighting: 'dim', temperature: 'cold' },
      social: { tension: 0.8 },
      atmosphere: { mood: 'tense' },
    });

    // 导出并导入
    const exportPackage = await exportService.exportScene('herta-station');
    const importService = new ExportImportService(storageB);
    await importService.importScene(exportPackage);

    // 验证状态一致
    const imported = await worldEngineB.getScene('herta-station');
    expect(imported!.environment.physical.lighting).toBe('dim');
    expect(imported!.environment.social.tension).toBe(0.8);
    expect(imported!.environment.atmosphere.mood).toBe('tense');
  });
});

describe('E2E-04: 导入冲突处理', () => {
  let exportService: ExportImportService;
  let importService: ExportImportService;
  let characterStateA: CharacterStateService;
  let characterStateB: CharacterStateService;
  let storageA: JsonFileStorage;
  let storageB: JsonFileStorage;

  const testDataDir = './test-data/e2e-04';

  beforeEach(async () => {
    await fs.rm(testDataDir, { recursive: true, force: true });
    await fs.mkdir(testDataDir, { recursive: true });

    storageA = new JsonFileStorage(path.join(testDataDir, 'session-a'));
    characterStateA = new CharacterStateService(storageA);
    exportService = new ExportImportService(storageA);

    storageB = new JsonFileStorage(path.join(testDataDir, 'session-b'));
    characterStateB = new CharacterStateService(storageB);
    importService = new ExportImportService(storageB);
  });

  afterEach(async () => {
    await fs.rm(testDataDir, { recursive: true, force: true });
  });

  it('应该检测到 ID 冲突', async () => {
    // 在两个会话中创建相同 ID 的角色
    const starA: Character = {
      id: 'star',
      name: '星（版本A）',
      personality: { traits: { cautious: 0.6 } },
      relationships: {},
      abilities: { combat: 50 },
      knownInformation: [],
    };

    const starB: Character = {
      id: 'star',
      name: '星（版本B）',
      personality: { traits: { cautious: 0.8 } },
      relationships: {},
      abilities: { combat: 70 },
      knownInformation: [],
    };

    await characterStateA.createCharacter(starA);
    await characterStateB.createCharacter(starB);

    // 导出 A 并尝试导入到 B
    const exportPackage = await exportService.exportCharacter('star');
    const result = await importService.importCharacter(exportPackage);

    // 应该检测到冲突
    expect(result.conflicts).toBeDefined();
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts[0].type).toBe('id_conflict');
    expect(result.conflicts[0].entityId).toBe('star');
  });

  it('应该支持覆盖策略', async () => {
    // 创建冲突场景
    const starA: Character = {
      id: 'star',
      name: '星（版本A）',
      personality: { traits: { cautious: 0.6 } },
      relationships: {},
      abilities: { combat: 50 },
      knownInformation: [],
    };

    const starB: Character = {
      id: 'star',
      name: '星（版本B）',
      personality: { traits: { cautious: 0.8 } },
      relationships: {},
      abilities: { combat: 70 },
      knownInformation: [],
    };

    await characterStateA.createCharacter(starA);
    await characterStateB.createCharacter(starB);

    // 导出并使用覆盖策略导入
    const exportPackage = await exportService.exportCharacter('star');
    const result = await importService.importCharacter(exportPackage, {
      conflictStrategy: 'overwrite',
    });

    expect(result.success).toBe(true);

    // 验证已覆盖
    const imported = await characterStateB.getCharacter('star');
    expect(imported!.name).toBe('星（版本A）');
    expect(imported!.abilities.combat).toBe(50);
  });

  it('应该支持重命名策略', async () => {
    // 创建冲突场景
    const starA: Character = {
      id: 'star',
      name: '星（版本A）',
      personality: { traits: { cautious: 0.6 } },
      relationships: {},
      abilities: { combat: 50 },
      knownInformation: [],
    };

    const starB: Character = {
      id: 'star',
      name: '星（版本B）',
      personality: { traits: { cautious: 0.8 } },
      relationships: {},
      abilities: { combat: 70 },
      knownInformation: [],
    };

    await characterStateA.createCharacter(starA);
    await characterStateB.createCharacter(starB);

    // 导出并使用重命名策略导入
    const exportPackage = await exportService.exportCharacter('star');
    const result = await importService.importCharacter(exportPackage, {
      conflictStrategy: 'rename',
    });

    expect(result.success).toBe(true);

    // 验证原角色未被修改
    const originalStar = await characterStateB.getCharacter('star');
    expect(originalStar!.name).toBe('星（版本B）');

    // 验证新角色被重命名导入
    expect(result.renamedEntities).toBeDefined();
    expect(result.renamedEntities!.length).toBeGreaterThan(0);

    const newId = result.renamedEntities![0].newId;
    const importedStar = await characterStateB.getCharacter(newId);
    expect(importedStar).toBeDefined();
    expect(importedStar!.name).toBe('星（版本A）');
  });

  it('应该检测依赖缺失', async () => {
    // 创建有依赖的角色（依赖场景）
    const star: Character = {
      id: 'star',
      name: '星',
      personality: { traits: { cautious: 0.6 } },
      relationships: {},
      abilities: {},
      knownInformation: [],
      currentSceneId: 'herta-station', // 依赖场景
    };

    await characterStateA.createCharacter(star);

    // 导出角色（不导出场景）
    const exportPackage = await exportService.exportCharacter('star');

    // 导入到没有该场景的会话
    const result = await importService.importCharacter(exportPackage);

    // 应该检测到依赖缺失
    expect(result.warnings).toBeDefined();
    const missingDep = result.warnings?.find(
      (w) => w.type === 'missing_dependency'
    );
    expect(missingDep).toBeDefined();
    expect(missingDep!.details).toContain('herta-station');
  });
});
