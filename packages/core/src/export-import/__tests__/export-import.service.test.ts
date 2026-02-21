import 'reflect-metadata';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ExportImportService } from '../export-import.service.js';
import type { Character, SceneConfig, SessionState } from '@star-rail/types';

// 创建测试用角色
const createTestCharacter = (id: string, name: string): Character => ({
  id,
  name,
  state: {
    relationships: {
      stelle: {
        trust: 0.8,
        hostility: 0,
        intimacy: 0.6,
        respect: 0.7,
      },
    },
    abilities: {},
    knownInformation: [],
  },
  personality: {
    traits: {
      openness: 0.7,
      conscientiousness: 0.6,
      extraversion: 0.8,
      agreeableness: 0.9,
      neuroticism: 0.3,
    },
    values: {
      selfDirection: 0.6,
      benevolence: 0.8,
      security: 0.5,
    },
  },
});

// 创建测试用场景
const createTestScene = (id: string = 'scene_test'): SceneConfig => ({
  id,
  name: '测试场景',
  description: '这是一个测试场景',
  participants: ['march7', 'stelle'],
});

// 创建测试用会话
const createTestSession = (): SessionState => ({
  worldState: {
    currentSceneId: 'scene_test',
    timeline: {
      currentTurn: 5,
      timestamp: Date.now(),
    },
    eventChain: [
      {
        eventId: 'event_1',
        timestamp: Date.now(),
        sceneId: 'scene_test',
        participants: ['march7'],
        description: '三月七说了一句话',
      },
    ],
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
  characters: {
    march7: createTestCharacter('march7', '三月七'),
    stelle: createTestCharacter('stelle', '星'),
  },
  information: {
    global: [
      {
        id: 'info_1',
        content: '空间站的秘密',
        source: 'witnessed',
        timestamp: Date.now(),
        sceneId: 'scene_test',
      },
    ],
    byCharacter: {
      march7: ['info_1'],
    },
  },
  metadata: {
    sessionId: 'test_session_001',
    sessionName: '测试会话',
    createdAt: Date.now(),
    lastSaved: Date.now(),
    version: '0.1.0',
  },
});

describe('ExportImportService', () => {
  let service: ExportImportService;
  let testDir: string;

  beforeEach(async () => {
    // 创建临时测试目录
    testDir = path.join(os.tmpdir(), `export-import-test-${Date.now()}`);
    await fs.ensureDir(testDir);
    service = new ExportImportService(testDir);
  });

  afterEach(async () => {
    // 清理测试目录
    await fs.remove(testDir);
  });

  describe('Character Export/Import (P1-EI-01)', () => {
    it('should export character to JSON file', async () => {
      const character = createTestCharacter('march7', '三月七');
      const filePath = await service.exportCharacter(character);

      expect(await fs.pathExists(filePath)).toBe(true);

      const pkg = await fs.readJson(filePath);
      expect(pkg.metadata.type).toBe('character');
      expect(pkg.metadata.version).toBe('0.1.0');
      expect(pkg.data.id).toBe('march7');
      expect(pkg.data.name).toBe('三月七');
    });

    it('should export character with dependencies', async () => {
      const character = createTestCharacter('march7', '三月七');
      const filePath = await service.exportCharacter(character);

      const pkg = await fs.readJson(filePath);
      expect(pkg.metadata.dependencies).toContain('stelle');
    });

    it('should export character with custom filename', async () => {
      const character = createTestCharacter('march7', '三月七');
      const filePath = await service.exportCharacter(character, {
        filename: 'custom_name.json',
      });

      expect(filePath).toContain('custom_name.json');
      expect(await fs.pathExists(filePath)).toBe(true);
    });

    it('should import character from JSON file', async () => {
      const character = createTestCharacter('march7', '三月七');
      const filePath = await service.exportCharacter(character);

      const result = await service.importCharacter(filePath);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('march7');
      expect(result.data?.name).toBe('三月七');
    });

    it('should fail import for wrong type', async () => {
      const scene = createTestScene();
      const filePath = await service.exportScene(scene);

      const result = await service.importCharacter(filePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('文件类型不匹配');
    });

    it('should fail import for non-existent file', async () => {
      const result = await service.importCharacter('/non/existent/file.json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('导入失败');
    });
  });

  describe('Scene Export/Import (P1-EI-01)', () => {
    it('should export scene to JSON file', async () => {
      const scene = createTestScene();
      const filePath = await service.exportScene(scene);

      expect(await fs.pathExists(filePath)).toBe(true);

      const pkg = await fs.readJson(filePath);
      expect(pkg.metadata.type).toBe('scene');
      expect(pkg.data.id).toBe('scene_test');
    });

    it('should export scene without dependencies (scenes have no participants in schema)', async () => {
      const scene = createTestScene();
      const filePath = await service.exportScene(scene);

      const pkg = await fs.readJson(filePath);
      expect(pkg.metadata.dependencies).toEqual([]);
    });

    it('should import scene from JSON file', async () => {
      const scene = createTestScene();
      const filePath = await service.exportScene(scene);

      const result = await service.importScene(filePath);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('scene_test');
    });
  });

  describe('Session Export/Import (P1-EI-01)', () => {
    it('should export session to JSON file', async () => {
      const session = createTestSession();
      const filePath = await service.exportSession(session);

      expect(await fs.pathExists(filePath)).toBe(true);

      const pkg = await fs.readJson(filePath);
      expect(pkg.metadata.type).toBe('session');
      expect(pkg.data.metadata.sessionId).toBe('test_session_001');
    });

    it('should export session with all dependencies', async () => {
      const session = createTestSession();
      const filePath = await service.exportSession(session);

      const pkg = await fs.readJson(filePath);
      expect(pkg.metadata.dependencies).toContain('march7');
      expect(pkg.metadata.dependencies).toContain('stelle');
      expect(pkg.metadata.dependencies).toContain('scene_test');
    });

    it('should import session from JSON file', async () => {
      const session = createTestSession();
      const filePath = await service.exportSession(session);

      const result = await service.importSession(filePath);

      expect(result.success).toBe(true);
      expect(result.data?.metadata.sessionId).toBe('test_session_001');
      expect(Object.keys(result.data?.characters || {}).length).toBe(2);
    });
  });

  describe('Conflict Detection (P1-EI-02)', () => {
    it('should detect character ID conflict', async () => {
      const character = createTestCharacter('march7', '三月七');
      const filePath = await service.exportCharacter(character);

      const result = await service.importCharacter(filePath, {
        existingCharacterIds: ['march7'],
        conflictStrategy: 'reject',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('ID 冲突');
      expect(result.conflicts?.length).toBe(1);
      expect(result.conflicts?.[0].type).toBe('id_conflict');
      expect(result.conflicts?.[0].resourceId).toBe('march7');
    });

    it('should rename character on conflict with rename strategy', async () => {
      const character = createTestCharacter('march7', '三月七');
      const filePath = await service.exportCharacter(character);

      const result = await service.importCharacter(filePath, {
        existingCharacterIds: ['march7'],
        conflictStrategy: 'rename',
      });

      expect(result.success).toBe(true);
      expect(result.newId).toBeDefined();
      expect(result.newId).toContain('march7_');
      expect(result.data?.id).toBe(result.newId);
    });

    it('should overwrite on conflict with overwrite strategy', async () => {
      const character = createTestCharacter('march7', '三月七');
      const filePath = await service.exportCharacter(character);

      const result = await service.importCharacter(filePath, {
        existingCharacterIds: ['march7'],
        conflictStrategy: 'overwrite',
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('march7');
    });

    it('should detect scene ID conflict', async () => {
      const scene = createTestScene();
      const filePath = await service.exportScene(scene);

      const result = await service.importScene(filePath, {
        existingSceneIds: ['scene_test'],
        conflictStrategy: 'reject',
      });

      expect(result.success).toBe(false);
      expect(result.conflicts?.length).toBe(1);
    });

    it('should detect session ID conflict', async () => {
      const session = createTestSession();
      const filePath = await service.exportSession(session);

      const result = await service.importSession(filePath, {
        existingSessionIds: ['test_session_001'],
        conflictStrategy: 'reject',
      });

      expect(result.success).toBe(false);
      expect(result.conflicts?.length).toBe(1);
    });
  });

  describe('Dependency Validation (P1-EI-02)', () => {
    it('should detect missing character dependencies', async () => {
      const character = createTestCharacter('march7', '三月七');
      const filePath = await service.exportCharacter(character);

      const result = await service.importCharacter(filePath, {
        existingCharacterIds: [], // stelle is missing
        validateDependencies: true,
      });

      expect(result.success).toBe(true);
      expect(result.missingDependencies).toContain('stelle');
    });

    it('should import scene without dependency validation (scenes have no dependencies)', async () => {
      const scene = createTestScene();
      const filePath = await service.exportScene(scene);

      const result = await service.importScene(filePath, {
        existingCharacterIds: ['march7'], // stelle is missing but scenes don't have dependencies
        validateDependencies: true,
      });

      expect(result.success).toBe(true);
      expect(result.missingDependencies).toBeUndefined();
    });

    it('should pass when all dependencies exist', async () => {
      const character = createTestCharacter('march7', '三月七');
      const filePath = await service.exportCharacter(character);

      const result = await service.importCharacter(filePath, {
        existingCharacterIds: ['stelle'],
        validateDependencies: true,
      });

      expect(result.success).toBe(true);
      expect(result.missingDependencies).toBeUndefined();
    });
  });

  describe('Batch Operations', () => {
    it('should export multiple characters', async () => {
      const characters = [
        createTestCharacter('march7', '三月七'),
        createTestCharacter('stelle', '星'),
      ];

      const paths = await service.exportCharacters(characters);

      expect(paths.length).toBe(2);
      for (const p of paths) {
        expect(await fs.pathExists(p)).toBe(true);
      }
    });

    it('should import multiple characters with conflict tracking', async () => {
      const char1 = createTestCharacter('march7', '三月七');
      const char2 = createTestCharacter('stelle', '星');

      const path1 = await service.exportCharacter(char1);
      const path2 = await service.exportCharacter(char2);

      const results = await service.importCharacters([path1, path2], {
        existingCharacterIds: [],
      });

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should track imported IDs during batch import', async () => {
      const char1 = createTestCharacter('march7', '三月七');
      const char2 = createTestCharacter('march7', '三月七复制'); // Same ID

      const path1 = await service.exportCharacter(char1);
      const path2 = await service.exportCharacter(char2, {
        filename: 'march7_copy.json',
      });

      const results = await service.importCharacters([path1, path2], {
        existingCharacterIds: [],
        conflictStrategy: 'reject',
      });

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].conflicts?.[0].type).toBe('id_conflict');
    });
  });

  describe('List and Query (P1-EI-03)', () => {
    it('should list exported characters', async () => {
      const char1 = createTestCharacter('march7', '三月七');
      const char2 = createTestCharacter('stelle', '星');

      await service.exportCharacter(char1);
      await service.exportCharacter(char2);

      const list = await service.listExports('character');

      expect(list.length).toBe(2);
      expect(list.some((item) => item.filename === 'march7.json')).toBe(true);
      expect(list.some((item) => item.filename === 'stelle.json')).toBe(true);
    });

    it('should list exported scenes', async () => {
      const scene = createTestScene();
      await service.exportScene(scene);

      const list = await service.listExports('scene');

      expect(list.length).toBe(1);
      expect(list[0].metadata?.type).toBe('scene');
    });

    it('should list exported sessions', async () => {
      const session = createTestSession();
      await service.exportSession(session);

      const list = await service.listExports('session');

      expect(list.length).toBe(1);
      expect(list[0].metadata?.type).toBe('session');
    });

    it('should return empty list for non-existent directory', async () => {
      const list = await service.listExports('character');
      expect(list.length).toBe(0);
    });
  });

  describe('Validation (P1-EI-03)', () => {
    it('should validate valid character export', async () => {
      const character = createTestCharacter('march7', '三月七');
      const filePath = await service.exportCharacter(character);

      const result = await service.validateExportPackage(filePath);

      expect(result.valid).toBe(true);
      expect(result.type).toBe('character');
    });

    it('should validate valid scene export', async () => {
      const scene = createTestScene();
      const filePath = await service.exportScene(scene);

      const result = await service.validateExportPackage(filePath);

      expect(result.valid).toBe(true);
      expect(result.type).toBe('scene');
    });

    it('should validate valid session export', async () => {
      const session = createTestSession();
      const filePath = await service.exportSession(session);

      const result = await service.validateExportPackage(filePath);

      expect(result.valid).toBe(true);
      expect(result.type).toBe('session');
    });

    it('should fail validation for invalid file', async () => {
      const invalidPath = path.join(testDir, 'invalid.json');
      await fs.writeJson(invalidPath, { invalid: 'data' });

      const result = await service.validateExportPackage(invalidPath);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('缺少元数据');
    });

    it('should fail validation for corrupted data', async () => {
      const corruptedPath = path.join(testDir, 'corrupted.json');
      await fs.writeJson(corruptedPath, {
        metadata: { type: 'character', version: '0.1.0' },
        data: { invalid: 'character' },
      });

      const result = await service.validateExportPackage(corruptedPath);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('数据校验失败');
    });
  });

  describe('Metadata Operations', () => {
    it('should read export metadata', async () => {
      const character = createTestCharacter('march7', '三月七');
      const filePath = await service.exportCharacter(character, {
        description: '测试角色导出',
      });

      const metadata = await service.readMetadata(filePath);

      expect(metadata).not.toBeNull();
      expect(metadata?.type).toBe('character');
      expect(metadata?.description).toBe('测试角色导出');
    });

    it('should return null for invalid file', async () => {
      const metadata = await service.readMetadata('/non/existent/file.json');
      expect(metadata).toBeNull();
    });
  });

  describe('Delete and Clear Operations', () => {
    it('should delete export file', async () => {
      const character = createTestCharacter('march7', '三月七');
      const filePath = await service.exportCharacter(character);

      expect(await fs.pathExists(filePath)).toBe(true);

      const result = await service.deleteExport(filePath);

      expect(result).toBe(true);
      expect(await fs.pathExists(filePath)).toBe(false);
    });

    it('should clear exports by type', async () => {
      const character = createTestCharacter('march7', '三月七');
      const scene = createTestScene();

      await service.exportCharacter(character);
      await service.exportScene(scene);

      await service.clearExports('character');

      const charList = await service.listExports('character');
      const sceneList = await service.listExports('scene');

      expect(charList.length).toBe(0);
      expect(sceneList.length).toBe(1);
    });

    it('should clear all exports', async () => {
      const character = createTestCharacter('march7', '三月七');
      const scene = createTestScene();

      await service.exportCharacter(character);
      await service.exportScene(scene);

      await service.clearExports();

      const charList = await service.listExports('character');
      const sceneList = await service.listExports('scene');

      expect(charList.length).toBe(0);
      expect(sceneList.length).toBe(0);
    });
  });

  describe('Directory Management', () => {
    it('should get and set export directory', () => {
      expect(service.getExportDir()).toBe(testDir);

      service.setExportDir('/new/path');
      expect(service.getExportDir()).toBe('/new/path');

      // Reset for cleanup
      service.setExportDir(testDir);
    });
  });

  // ==================== P2-EI-01 测试 ====================

  describe('mergeCharacterState', () => {
    it('能力值取较大值', () => {
      const base = createTestCharacter('char-a', '角色A');
      base.state.abilities = { combat: 40, stealth: 60 };
      const incoming = createTestCharacter('char-a', '角色A');
      incoming.state.abilities = { combat: 70, stealth: 30, magic: 50 };

      const merged = service.mergeCharacterState(base, incoming);
      expect(merged.state.abilities.combat).toBe(70);
      expect(merged.state.abilities.stealth).toBe(60);
      expect(merged.state.abilities.magic).toBe(50);
    });

    it('关系各维度取平均值', () => {
      const base = createTestCharacter('char-a', '角色A');
      base.state.relationships = {
        'char-b': { trust: 0.8, hostility: 0.2, intimacy: 0.6, respect: 0.7 },
      };
      const incoming = createTestCharacter('char-a', '角色A');
      incoming.state.relationships = {
        'char-b': { trust: 0.4, hostility: 0.6, intimacy: 0.2, respect: 0.3 },
      };

      const merged = service.mergeCharacterState(base, incoming);
      expect(merged.state.relationships['char-b'].trust).toBeCloseTo(0.6);
      expect(merged.state.relationships['char-b'].hostility).toBeCloseTo(0.4);
    });

    it('已知信息取并集', () => {
      const base = createTestCharacter('char-a', '角色A');
      base.state.knownInformation = [
        { informationId: 'info-1', acquiredAt: 1000 },
      ];
      const incoming = createTestCharacter('char-a', '角色A');
      incoming.state.knownInformation = [
        { informationId: 'info-1', acquiredAt: 1000 },
        { informationId: 'info-2', acquiredAt: 2000 },
      ];

      const merged = service.mergeCharacterState(base, incoming);
      expect(merged.state.knownInformation).toHaveLength(2);
    });

    it('不修改原对象', () => {
      const base = createTestCharacter('char-a', '角色A');
      base.state.abilities = { combat: 40 };
      const incoming = createTestCharacter('char-a', '角色A');
      incoming.state.abilities = { combat: 80 };

      service.mergeCharacterState(base, incoming);
      expect(base.state.abilities.combat).toBe(40);
    });
  });

  describe('importSnapshotToSession', () => {
    const makeSnapshot = (characters: Record<string, Character>) => ({
      id: 'snap-1',
      name: '测试快照',
      createdAt: Date.now(),
      state: {
        worldState: createTestSession().worldState,
        characters,
        information: createTestSession().information,
        metadata: createTestSession().metadata,
      },
    });

    it('reject 策略：已存在角色被跳过', () => {
      const session = createTestSession();
      const snap = makeSnapshot({
        march7: createTestCharacter('march7', '三月七'),
        newChar: createTestCharacter('newChar', '新角色'),
      });

      const result = service.importSnapshotToSession(
        snap as never,
        session,
        'reject'
      );
      expect(result.success).toBe(true);
      expect(result.importedCharacterIds).toContain('newChar');
      expect(result.skippedCharacterIds).toContain('march7');
    });

    it('overwrite 策略：覆盖已存在角色', () => {
      const session = createTestSession();
      const newMarch = createTestCharacter('march7', '三月七');
      newMarch.state.abilities = { combat: 99 };
      const snap = makeSnapshot({ march7: newMarch });

      const result = service.importSnapshotToSession(
        snap as never,
        session,
        'overwrite'
      );
      expect(result.importedCharacterIds).toContain('march7');
      expect(session.characters['march7'].state.abilities.combat).toBe(99);
    });

    it('rename 策略：已存在角色生成新 ID', () => {
      const session = createTestSession();
      const snap = makeSnapshot({
        march7: createTestCharacter('march7', '三月七'),
      });

      const result = service.importSnapshotToSession(
        snap as never,
        session,
        'rename'
      );
      expect(result.importedCharacterIds.length).toBe(1);
      expect(result.importedCharacterIds[0]).toMatch(/^march7_snap_/);
    });

    it('merge 策略：合并角色状态', () => {
      const session = createTestSession();
      session.characters['march7'].state.abilities = { combat: 40 };
      const newMarch = createTestCharacter('march7', '三月七');
      newMarch.state.abilities = { combat: 80 };
      const snap = makeSnapshot({ march7: newMarch });

      const result = service.importSnapshotToSession(
        snap as never,
        session,
        'merge'
      );
      expect(result.importedCharacterIds).toContain('march7');
      expect(session.characters['march7'].state.abilities.combat).toBe(80);
    });
  });

  // ==================== P3-EI-01 势力/剧情图导出导入 ====================

  describe('Faction Export/Import (P3-EI-01)', () => {
    const createTestFaction = () => ({
      id: 'faction_astral',
      name: '星穹列车',
      description: '穿越星际的列车',
      members: ['march7', 'stelle'],
      goals: ['探索宇宙'],
      tags: ['main'],
    });

    it('导出势力到 JSON 文件', async () => {
      const faction = createTestFaction();
      const filePath = await service.exportFaction(faction);

      expect(await fs.pathExists(filePath)).toBe(true);
      const pkg = await fs.readJson(filePath);
      expect(pkg.metadata.type).toBe('faction');
      expect(pkg.data.id).toBe('faction_astral');
    });

    it('导入势力成功', async () => {
      const faction = createTestFaction();
      const filePath = await service.exportFaction(faction);

      const result = await service.importFaction(filePath);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('faction_astral');
      expect(result.data?.members).toContain('march7');
    });

    it('ID 冲突时 reject 策略拒绝导入', async () => {
      const faction = createTestFaction();
      const filePath = await service.exportFaction(faction);

      const result = await service.importFaction(filePath, {
        existingFactionIds: ['faction_astral'],
        conflictStrategy: 'reject',
      });

      expect(result.success).toBe(false);
      expect(result.conflicts?.length).toBeGreaterThan(0);
    });

    it('ID 冲突时 rename 策略生成新 ID', async () => {
      const faction = createTestFaction();
      const filePath = await service.exportFaction(faction);

      const result = await service.importFaction(filePath, {
        existingFactionIds: ['faction_astral'],
        conflictStrategy: 'rename',
      });

      expect(result.success).toBe(true);
      expect(result.newId).toBeDefined();
      expect(result.data?.id).not.toBe('faction_astral');
    });

    it('文件类型不匹配时返回错误', async () => {
      const character = createTestCharacter('march7', '三月七');
      const charPath = await service.exportCharacter(character);

      const result = await service.importFaction(charPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('faction');
    });
  });

  describe('PlotGraph Export/Import (P3-EI-01)', () => {
    const createTestPlotGraph = () => ({
      version: '1.0',
      startNodeId: 'node_start',
      nodes: {
        node_start: {
          id: 'node_start',
          name: '开始节点',
          branches: [
            {
              id: 'branch_1',
              name: '分支一',
              outcomes: [],
              nextNodeId: 'node_end',
            },
          ],
          isTerminal: false,
        },
        node_end: {
          id: 'node_end',
          name: '结束节点',
          branches: [],
          isTerminal: true,
        },
      },
    });

    it('导出剧情图到 JSON 文件（含主题标签）', async () => {
      const plotGraph = createTestPlotGraph();
      const filePath = await service.exportPlotGraph(plotGraph, {
        themes: ['friendship', 'adventure'],
        description: '主线剧情',
      });

      expect(await fs.pathExists(filePath)).toBe(true);
      const pkg = await fs.readJson(filePath);
      expect(pkg.metadata.type).toBe('plot');
      expect(pkg.themes).toEqual(['friendship', 'adventure']);
    });

    it('导入剧情图成功并保留主题标签', async () => {
      const plotGraph = createTestPlotGraph();
      const filePath = await service.exportPlotGraph(plotGraph, {
        themes: ['friendship'],
      });

      const result = await service.importPlotGraph(filePath);

      expect(result.success).toBe(true);
      expect(result.data?.startNodeId).toBe('node_start');
      expect(result.data?.nodes['node_start']).toBeDefined();
      expect(result.themes).toEqual(['friendship']);
    });

    it('导入的剧情图可参与新剧情（节点结构完整）', async () => {
      const plotGraph = createTestPlotGraph();
      const filePath = await service.exportPlotGraph(plotGraph);

      const result = await service.importPlotGraph(filePath);

      expect(result.success).toBe(true);
      const imported = result.data!;
      // 验证节点结构完整，可用于新剧情
      expect(Object.keys(imported.nodes)).toHaveLength(2);
      expect(imported.nodes['node_end'].isTerminal).toBe(true);
    });

    it('文件类型不匹配时返回错误', async () => {
      const character = createTestCharacter('march7', '三月七');
      const charPath = await service.exportCharacter(character);

      const result = await service.importPlotGraph(charPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('plot');
    });
  });
});
