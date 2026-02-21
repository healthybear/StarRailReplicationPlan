import { injectable } from 'tsyringe';
import fs from 'fs-extra';
import path from 'path';
import type {
  Character,
  SceneConfig,
  SessionState,
  Snapshot,
  Faction,
  PlotGraphConfig,
} from '@star-rail/types';
import {
  CharacterSchema as CharSchema,
  SceneConfigSchema as SceneSchema,
  SessionStateSchema,
  SnapshotSchema,
  FactionSchema,
  PlotGraphConfigSchema,
} from '@star-rail/types';

/**
 * 导出类型
 */
export type ExportType = 'character' | 'scene' | 'session' | 'faction' | 'plot';

/**
 * 冲突策略
 * P1-EI-02: 导入时冲突检查策略
 * P2-EI-01: 新增 merge 策略（合并状态字段）
 *
 * - reject: 存在冲突时拒绝导入（默认）
 * - overwrite: 覆盖已有数据
 * - rename: 生成新 ID 后导入
 * - merge: 合并状态字段（角色能力值取较大值，关系取平均值）
 */
export type ConflictStrategy = 'reject' | 'overwrite' | 'rename' | 'merge';

/**
 * 导出包元数据
 */
export interface ExportMetadata {
  version: string;
  type: ExportType;
  exportedAt: number;
  /** 依赖的其他资源 ID 列表 */
  dependencies: string[];
  /** 导出来源会话 ID */
  sourceSessionId?: string;
  /** 导出描述 */
  description?: string;
}

/**
 * 导出包
 */
export interface ExportPackage<T> {
  metadata: ExportMetadata;
  data: T;
}

/**
 * 冲突信息
 * P1-EI-02: 冲突检查结果
 */
export interface ConflictInfo {
  /** 冲突类型 */
  type: 'id_conflict' | 'dependency_missing';
  /** 冲突资源 ID */
  resourceId: string;
  /** 冲突描述 */
  description: string;
  /** 现有资源（如果是 ID 冲突） */
  existingResource?: string;
}

/**
 * 导入选项
 */
export interface ImportOptions {
  /** 冲突策略 */
  conflictStrategy?: ConflictStrategy;
  /** 现有角色 ID 列表（用于冲突检查） */
  existingCharacterIds?: string[];
  /** 现有场景 ID 列表（用于冲突检查） */
  existingSceneIds?: string[];
  /** 是否验证依赖 */
  validateDependencies?: boolean;
}

/**
 * 导入结果
 */
export interface ImportResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  /** 冲突列表 */
  conflicts?: ConflictInfo[];
  /** 缺失的依赖 */
  missingDependencies?: string[];
  /** 导入后的新 ID（如果使用 rename 策略） */
  newId?: string;
}

/**
 * 导出导入服务
 * 处理人物、场景、会话等数据的导出和导入
 * P1-EI-01~03: JSON 序列化/反序列化、冲突检查、成功/失败用例
 */
@injectable()
export class ExportImportService {
  private exportDir: string;

  constructor(exportDir: string = './exports') {
    this.exportDir = exportDir;
  }

  /**
   * 设置导出目录
   */
  setExportDir(dir: string): void {
    this.exportDir = dir;
  }

  /**
   * 获取导出目录
   */
  getExportDir(): string {
    return this.exportDir;
  }

  // ==================== 角色导出/导入 ====================

  /**
   * 导出人物
   * P1-EI-01: 人物 JSON 序列化
   * @param character 角色数据
   * @param options 导出选项
   */
  async exportCharacter(
    character: Character,
    options?: {
      filename?: string;
      description?: string;
      sourceSessionId?: string;
    }
  ): Promise<string> {
    // 收集依赖：关系中引用的其他角色 ID
    const dependencies: string[] = Object.keys(
      character.state.relationships || {}
    );

    const pkg: ExportPackage<Character> = {
      metadata: {
        version: '0.1.0',
        type: 'character',
        exportedAt: Date.now(),
        dependencies,
        sourceSessionId: options?.sourceSessionId,
        description: options?.description,
      },
      data: character,
    };

    const filePath = path.join(
      this.exportDir,
      'characters',
      options?.filename || `${character.id}.json`
    );

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, pkg, { spaces: 2 });

    return filePath;
  }

  /**
   * 导入人物（带冲突检查）
   * P1-EI-02: 导入时冲突检查
   * @param filePath 文件路径
   * @param options 导入选项
   */
  async importCharacter(
    filePath: string,
    options?: ImportOptions
  ): Promise<ImportResult<Character>> {
    try {
      const pkg = await fs.readJson(filePath);

      if (pkg.metadata?.type !== 'character') {
        return {
          success: false,
          error: '文件类型不匹配，期望 character 类型',
        };
      }

      const parsed = CharSchema.safeParse(pkg.data);

      if (!parsed.success) {
        return {
          success: false,
          error: `数据校验失败: ${parsed.error.message}`,
        };
      }

      const character = parsed.data;
      const conflicts: ConflictInfo[] = [];
      const missingDependencies: string[] = [];

      // 检查 ID 冲突
      if (options?.existingCharacterIds?.includes(character.id)) {
        conflicts.push({
          type: 'id_conflict',
          resourceId: character.id,
          description: `角色 ID "${character.id}" 已存在`,
          existingResource: character.id,
        });
      }

      // 检查依赖（关系中引用的角色）
      if (options?.validateDependencies && pkg.metadata?.dependencies) {
        for (const depId of pkg.metadata.dependencies) {
          if (!options.existingCharacterIds?.includes(depId)) {
            missingDependencies.push(depId);
          }
        }
      }

      // 处理冲突
      if (conflicts.length > 0) {
        const strategy = options?.conflictStrategy || 'reject';

        if (strategy === 'reject') {
          return {
            success: false,
            error: '存在 ID 冲突',
            conflicts,
            missingDependencies:
              missingDependencies.length > 0 ? missingDependencies : undefined,
          };
        } else if (strategy === 'rename') {
          // 生成新 ID
          const newId = `${character.id}_${Date.now()}`;
          character.id = newId;
          return {
            success: true,
            data: character,
            conflicts,
            newId,
            missingDependencies:
              missingDependencies.length > 0 ? missingDependencies : undefined,
          };
        } else if (strategy === 'merge') {
          // merge: 合并状态字段（能力值取较大值，关系取平均值）
          // 调用方需自行传入 existingCharacter 进行合并，此处仅标记冲突并返回数据
          return {
            success: true,
            data: character,
            conflicts,
            missingDependencies:
              missingDependencies.length > 0 ? missingDependencies : undefined,
          };
        }
        // strategy === 'overwrite' 时直接返回数据
      }

      return {
        success: true,
        data: character,
        missingDependencies:
          missingDependencies.length > 0 ? missingDependencies : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: `导入失败: ${(error as Error).message}`,
      };
    }
  }

  // ==================== 场景导出/导入 ====================

  /**
   * 导出场景
   * P1-EI-01: 场景 JSON 序列化
   * @param scene 场景配置
   * @param options 导出选项
   */
  async exportScene(
    scene: SceneConfig,
    options?: {
      filename?: string;
      description?: string;
      sourceSessionId?: string;
    }
  ): Promise<string> {
    // 收集依赖：场景没有直接依赖
    const dependencies: string[] = [];

    const pkg: ExportPackage<SceneConfig> = {
      metadata: {
        version: '0.1.0',
        type: 'scene',
        exportedAt: Date.now(),
        dependencies,
        sourceSessionId: options?.sourceSessionId,
        description: options?.description,
      },
      data: scene,
    };

    const filePath = path.join(
      this.exportDir,
      'scenes',
      options?.filename || `${scene.id}.json`
    );

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, pkg, { spaces: 2 });

    return filePath;
  }

  /**
   * 导入场景（带冲突检查）
   * P1-EI-02: 导入时冲突检查
   * @param filePath 文件路径
   * @param options 导入选项
   */
  async importScene(
    filePath: string,
    options?: ImportOptions
  ): Promise<ImportResult<SceneConfig>> {
    try {
      const pkg = await fs.readJson(filePath);

      if (pkg.metadata?.type !== 'scene') {
        return {
          success: false,
          error: '文件类型不匹配，期望 scene 类型',
        };
      }

      const parsed = SceneSchema.safeParse(pkg.data);

      if (!parsed.success) {
        return {
          success: false,
          error: `数据校验失败: ${parsed.error.message}`,
        };
      }

      const scene = parsed.data;
      const conflicts: ConflictInfo[] = [];
      const missingDependencies: string[] = [];

      // 检查 ID 冲突
      if (options?.existingSceneIds?.includes(scene.id)) {
        conflicts.push({
          type: 'id_conflict',
          resourceId: scene.id,
          description: `场景 ID "${scene.id}" 已存在`,
          existingResource: scene.id,
        });
      }

      // 检查依赖（场景中的参与者角色）
      if (options?.validateDependencies && pkg.metadata?.dependencies) {
        for (const depId of pkg.metadata.dependencies) {
          if (!options.existingCharacterIds?.includes(depId)) {
            missingDependencies.push(depId);
          }
        }
      }

      // 处理冲突
      if (conflicts.length > 0) {
        const strategy = options?.conflictStrategy || 'reject';

        if (strategy === 'reject') {
          return {
            success: false,
            error: '存在 ID 冲突',
            conflicts,
            missingDependencies:
              missingDependencies.length > 0 ? missingDependencies : undefined,
          };
        } else if (strategy === 'rename') {
          const newId = `${scene.id}_${Date.now()}`;
          scene.id = newId;
          return {
            success: true,
            data: scene,
            conflicts,
            newId,
            missingDependencies:
              missingDependencies.length > 0 ? missingDependencies : undefined,
          };
        }
      }

      return {
        success: true,
        data: scene,
        missingDependencies:
          missingDependencies.length > 0 ? missingDependencies : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: `导入失败: ${(error as Error).message}`,
      };
    }
  }

  // ==================== 会话导出/导入 ====================

  /**
   * 导出会话
   * P1-EI-01: 会话 JSON 序列化
   * @param session 会话状态
   * @param options 导出选项
   */
  async exportSession(
    session: SessionState,
    options?: {
      filename?: string;
      description?: string;
    }
  ): Promise<string> {
    // 收集依赖：会话中的所有角色和场景 ID
    const characterIds = Object.keys(session.characters);
    const sceneId = session.worldState.currentSceneId;
    const dependencies = [...characterIds, sceneId];

    const pkg: ExportPackage<SessionState> = {
      metadata: {
        version: '0.1.0',
        type: 'session',
        exportedAt: Date.now(),
        dependencies,
        sourceSessionId: session.metadata.sessionId,
        description: options?.description,
      },
      data: session,
    };

    const filePath = path.join(
      this.exportDir,
      'sessions',
      options?.filename || `${session.metadata.sessionId}.json`
    );

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, pkg, { spaces: 2 });

    return filePath;
  }

  /**
   * 导入会话
   * P1-EI-02: 导入时冲突检查
   * @param filePath 文件路径
   * @param options 导入选项
   */
  async importSession(
    filePath: string,
    options?: ImportOptions & { existingSessionIds?: string[] }
  ): Promise<ImportResult<SessionState>> {
    try {
      const pkg = await fs.readJson(filePath);

      if (pkg.metadata?.type !== 'session') {
        return {
          success: false,
          error: '文件类型不匹配，期望 session 类型',
        };
      }

      const parsed = SessionStateSchema.safeParse(pkg.data);

      if (!parsed.success) {
        return {
          success: false,
          error: `数据校验失败: ${parsed.error.message}`,
        };
      }

      const session = parsed.data;
      const conflicts: ConflictInfo[] = [];

      // 检查会话 ID 冲突
      if (options?.existingSessionIds?.includes(session.metadata.sessionId)) {
        conflicts.push({
          type: 'id_conflict',
          resourceId: session.metadata.sessionId,
          description: `会话 ID "${session.metadata.sessionId}" 已存在`,
          existingResource: session.metadata.sessionId,
        });
      }

      // 处理冲突
      if (conflicts.length > 0) {
        const strategy = options?.conflictStrategy || 'reject';

        if (strategy === 'reject') {
          return {
            success: false,
            error: '存在 ID 冲突',
            conflicts,
          };
        } else if (strategy === 'rename') {
          const newId = `${session.metadata.sessionId}_${Date.now()}`;
          session.metadata.sessionId = newId;
          return {
            success: true,
            data: session,
            conflicts,
            newId,
          };
        }
      }

      return {
        success: true,
        data: session,
      };
    } catch (error) {
      return {
        success: false,
        error: `导入失败: ${(error as Error).message}`,
      };
    }
  }

  // ==================== 批量操作 ====================

  /**
   * 批量导出角色
   * @param characters 角色列表
   * @param sourceSessionId 来源会话 ID
   */
  async exportCharacters(
    characters: Character[],
    sourceSessionId?: string
  ): Promise<string[]> {
    const paths: string[] = [];
    for (const character of characters) {
      const filePath = await this.exportCharacter(character, {
        sourceSessionId,
      });
      paths.push(filePath);
    }
    return paths;
  }

  /**
   * 批量导入角色
   * @param filePaths 文件路径列表
   * @param options 导入选项
   */
  async importCharacters(
    filePaths: string[],
    options?: ImportOptions
  ): Promise<ImportResult<Character>[]> {
    const results: ImportResult<Character>[] = [];
    const importedIds: string[] = [...(options?.existingCharacterIds || [])];

    for (const filePath of filePaths) {
      const result = await this.importCharacter(filePath, {
        ...options,
        existingCharacterIds: importedIds,
      });
      results.push(result);

      // 如果导入成功，将 ID 添加到已存在列表
      if (result.success && result.data) {
        importedIds.push(result.newId || result.data.id);
      }
    }

    return results;
  }

  // ==================== 列表与查询 ====================

  /**
   * 列出可导入的文件
   * @param type 导出类型
   */
  async listExports(
    type: ExportType
  ): Promise<
    Array<{ filename: string; path: string; metadata?: ExportMetadata }>
  > {
    const dir = path.join(this.exportDir, `${type}s`);

    if (!(await fs.pathExists(dir))) {
      return [];
    }

    const files = await fs.readdir(dir);
    const results: Array<{
      filename: string;
      path: string;
      metadata?: ExportMetadata;
    }> = [];

    for (const f of files) {
      if (!f.endsWith('.json')) continue;

      const filePath = path.join(dir, f);
      try {
        const pkg = await fs.readJson(filePath);
        results.push({
          filename: f,
          path: filePath,
          metadata: pkg.metadata,
        });
      } catch {
        // 无法读取的文件跳过
        results.push({
          filename: f,
          path: filePath,
        });
      }
    }

    return results;
  }

  /**
   * 读取导出包元数据
   * @param filePath 文件路径
   */
  async readMetadata(filePath: string): Promise<ExportMetadata | null> {
    try {
      const pkg = await fs.readJson(filePath);
      return pkg.metadata || null;
    } catch {
      return null;
    }
  }

  /**
   * 验证导出包
   * @param filePath 文件路径
   */
  async validateExportPackage(
    filePath: string
  ): Promise<{ valid: boolean; type?: ExportType; error?: string }> {
    try {
      const pkg = await fs.readJson(filePath);

      if (!pkg.metadata) {
        return { valid: false, error: '缺少元数据' };
      }

      if (!pkg.metadata.type) {
        return { valid: false, error: '缺少类型信息' };
      }

      if (!pkg.data) {
        return { valid: false, error: '缺少数据' };
      }

      // 根据类型验证数据
      let parseResult;
      switch (pkg.metadata.type) {
        case 'character':
          parseResult = CharSchema.safeParse(pkg.data);
          break;
        case 'scene':
          parseResult = SceneSchema.safeParse(pkg.data);
          break;
        case 'session':
          parseResult = SessionStateSchema.safeParse(pkg.data);
          break;
        case 'faction':
          parseResult = FactionSchema.safeParse(pkg.data);
          break;
        case 'plot':
          parseResult = PlotGraphConfigSchema.safeParse(pkg.data);
          break;
        default:
          return { valid: false, error: `未知类型: ${pkg.metadata.type}` };
      }

      if (!parseResult.success) {
        return {
          valid: false,
          type: pkg.metadata.type,
          error: `数据校验失败: ${parseResult.error.message}`,
        };
      }

      return { valid: true, type: pkg.metadata.type };
    } catch (error) {
      return { valid: false, error: `读取失败: ${(error as Error).message}` };
    }
  }

  /**
   * 删除导出文件
   * @param filePath 文件路径
   */
  async deleteExport(filePath: string): Promise<boolean> {
    try {
      await fs.remove(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清空导出目录
   * @param type 导出类型（可选，不指定则清空所有）
   */
  async clearExports(type?: ExportType): Promise<void> {
    if (type) {
      const dir = path.join(this.exportDir, `${type}s`);
      if (await fs.pathExists(dir)) {
        await fs.emptyDir(dir);
      }
    } else {
      if (await fs.pathExists(this.exportDir)) {
        await fs.emptyDir(this.exportDir);
      }
    }
  }

  // ==================== P2-EI-01 扩展 ====================

  /**
   * 合并角色状态（merge 策略）
   * 能力值取较大值，关系各维度取平均值
   * P2-EI-01: 角色状态快照导入到另一剧情时的合并逻辑
   * @param base 目标角色（被合并到）
   * @param incoming 导入的角色（来源）
   * @returns 合并后的角色（不修改原对象）
   */
  mergeCharacterState(base: Character, incoming: Character): Character {
    const merged: Character = JSON.parse(JSON.stringify(base));

    // 合并能力值：取较大值
    for (const [key, value] of Object.entries(incoming.state.abilities)) {
      const baseValue = merged.state.abilities[key] ?? 0;
      merged.state.abilities[key] = Math.max(baseValue, value);
    }

    // 合并关系：各维度取平均值
    for (const [targetId, incomingRel] of Object.entries(
      incoming.state.relationships
    )) {
      const baseRel = merged.state.relationships[targetId];
      if (baseRel) {
        merged.state.relationships[targetId] = {
          trust: (baseRel.trust + incomingRel.trust) / 2,
          hostility: (baseRel.hostility + incomingRel.hostility) / 2,
          intimacy: (baseRel.intimacy + incomingRel.intimacy) / 2,
          respect: (baseRel.respect + incomingRel.respect) / 2,
        };
      } else {
        merged.state.relationships[targetId] = { ...incomingRel };
      }
    }

    // 合并已知信息：取并集
    const knownIds = new Set(
      merged.state.knownInformation.map((k) => k.informationId)
    );
    for (const ref of incoming.state.knownInformation) {
      if (!knownIds.has(ref.informationId)) {
        merged.state.knownInformation.push({ ...ref });
        knownIds.add(ref.informationId);
      }
    }

    return merged;
  }

  /**
   * 将快照中的角色状态导入到目标会话
   * P2-EI-01: 角色状态快照导入到另一剧情（验收标准③）
   * @param snapshot 快照数据
   * @param targetSession 目标会话
   * @param strategy 冲突策略
   * @returns 导入结果（成功导入的角色 ID 列表）
   */
  importSnapshotToSession(
    snapshot: Snapshot,
    targetSession: SessionState,
    strategy: ConflictStrategy = 'reject'
  ): {
    success: boolean;
    importedCharacterIds: string[];
    skippedCharacterIds: string[];
    error?: string;
  } {
    const importedCharacterIds: string[] = [];
    const skippedCharacterIds: string[] = [];

    for (const [charId, snapshotChar] of Object.entries(
      snapshot.state.characters
    )) {
      const existing = targetSession.characters[charId];

      if (!existing) {
        // 角色不存在，直接导入
        targetSession.characters[charId] = JSON.parse(
          JSON.stringify(snapshotChar)
        );
        importedCharacterIds.push(charId);
        continue;
      }

      // 角色已存在，按策略处理
      switch (strategy) {
        case 'reject':
          skippedCharacterIds.push(charId);
          break;
        case 'overwrite':
          targetSession.characters[charId] = JSON.parse(
            JSON.stringify(snapshotChar)
          );
          importedCharacterIds.push(charId);
          break;
        case 'rename': {
          const newId = `${charId}_snap_${Date.now()}`;
          const renamed = JSON.parse(JSON.stringify(snapshotChar));
          renamed.id = newId;
          targetSession.characters[newId] = renamed;
          importedCharacterIds.push(newId);
          break;
        }
        case 'merge': {
          targetSession.characters[charId] = this.mergeCharacterState(
            existing,
            snapshotChar
          );
          importedCharacterIds.push(charId);
          break;
        }
      }
    }

    return {
      success: true,
      importedCharacterIds,
      skippedCharacterIds,
    };
  }

  /**
   * 导出快照到文件
   * P2-EI-01: 快照序列化
   * @param snapshot 快照数据
   * @param options 导出选项
   */
  async exportSnapshot(
    snapshot: Snapshot,
    options?: { filename?: string; description?: string }
  ): Promise<string> {
    const filePath = path.join(
      this.exportDir,
      'snapshots',
      options?.filename || `${snapshot.id}.json`
    );
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, snapshot, { spaces: 2 });
    return filePath;
  }

  /**
   * 从文件导入快照
   * P2-EI-01: 快照反序列化
   * @param filePath 文件路径
   */
  async importSnapshot(filePath: string): Promise<ImportResult<Snapshot>> {
    try {
      const data = await fs.readJson(filePath);
      const parsed = SnapshotSchema.safeParse(data);
      if (!parsed.success) {
        return {
          success: false,
          error: `快照数据校验失败: ${parsed.error.message}`,
        };
      }
      return { success: true, data: parsed.data };
    } catch (error) {
      return {
        success: false,
        error: `导入失败: ${(error as Error).message}`,
      };
    }
  }

  // ==================== P3-EI-01 势力/剧情图/主题导出导入 ====================

  /**
   * 导出势力数据
   * P3-EI-01: 势力/情节线/主题导出与复用
   * @param faction 势力数据
   * @param options 导出选项
   */
  async exportFaction(
    faction: Faction,
    options?: {
      filename?: string;
      description?: string;
      sourceSessionId?: string;
    }
  ): Promise<string> {
    const pkg: ExportPackage<Faction> = {
      metadata: {
        version: '1.0.0',
        type: 'faction',
        exportedAt: Date.now(),
        dependencies: faction.members,
        sourceSessionId: options?.sourceSessionId,
        description: options?.description,
      },
      data: faction,
    };

    const filePath = path.join(
      this.exportDir,
      'factions',
      options?.filename || `${faction.id}.json`
    );
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, pkg, { spaces: 2 });
    return filePath;
  }

  /**
   * 导入势力数据
   * P3-EI-01: 势力/情节线/主题导出与复用
   * @param filePath 文件路径
   * @param options 导入选项
   */
  async importFaction(
    filePath: string,
    options?: ImportOptions & { existingFactionIds?: string[] }
  ): Promise<ImportResult<Faction>> {
    try {
      const pkg = await fs.readJson(filePath);

      if (pkg.metadata?.type !== 'faction') {
        return { success: false, error: '文件类型不匹配，期望 faction 类型' };
      }

      const parsed = FactionSchema.safeParse(pkg.data);
      if (!parsed.success) {
        return {
          success: false,
          error: `数据校验失败: ${parsed.error.message}`,
        };
      }

      const faction = parsed.data;
      const conflicts: ConflictInfo[] = [];

      if (options?.existingFactionIds?.includes(faction.id)) {
        conflicts.push({
          type: 'id_conflict',
          resourceId: faction.id,
          description: `势力 ID "${faction.id}" 已存在`,
          existingResource: faction.id,
        });
      }

      if (conflicts.length > 0) {
        const strategy = options?.conflictStrategy || 'reject';
        if (strategy === 'reject') {
          return { success: false, error: '存在 ID 冲突', conflicts };
        } else if (strategy === 'rename') {
          const newId = `${faction.id}_${Date.now()}`;
          faction.id = newId;
          return { success: true, data: faction, conflicts, newId };
        }
      }

      return { success: true, data: faction };
    } catch (error) {
      return { success: false, error: `导入失败: ${(error as Error).message}` };
    }
  }

  /**
   * 导出剧情图配置
   * P3-EI-01: 势力/情节线/主题导出与复用
   * @param plotGraph 剧情图配置
   * @param options 导出选项
   */
  async exportPlotGraph(
    plotGraph: PlotGraphConfig,
    options?: {
      filename?: string;
      description?: string;
      sourceSessionId?: string;
      themes?: string[];
    }
  ): Promise<string> {
    const pkg: ExportPackage<PlotGraphConfig> & { themes?: string[] } = {
      metadata: {
        version: '1.0.0',
        type: 'plot',
        exportedAt: Date.now(),
        dependencies: [],
        sourceSessionId: options?.sourceSessionId,
        description: options?.description,
      },
      data: plotGraph,
      themes: options?.themes,
    };

    const filename = options?.filename || `plot_${plotGraph.startNodeId}.json`;
    const filePath = path.join(this.exportDir, 'plots', filename);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, pkg, { spaces: 2 });
    return filePath;
  }

  /**
   * 导入剧情图配置
   * P3-EI-01: 势力/情节线/主题导出与复用
   * @param filePath 文件路径
   */
  async importPlotGraph(
    filePath: string
  ): Promise<ImportResult<PlotGraphConfig> & { themes?: string[] }> {
    try {
      const pkg = await fs.readJson(filePath);

      if (pkg.metadata?.type !== 'plot') {
        return { success: false, error: '文件类型不匹配，期望 plot 类型' };
      }

      const parsed = PlotGraphConfigSchema.safeParse(pkg.data);
      if (!parsed.success) {
        return {
          success: false,
          error: `数据校验失败: ${parsed.error.message}`,
        };
      }

      return { success: true, data: parsed.data, themes: pkg.themes };
    } catch (error) {
      return { success: false, error: `导入失败: ${(error as Error).message}` };
    }
  }
}
