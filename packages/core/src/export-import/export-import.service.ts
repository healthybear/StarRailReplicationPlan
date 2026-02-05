import { injectable } from 'tsyringe';
import fs from 'fs-extra';
import path from 'path';
import type { Character, SceneConfig } from '@star-rail/types';
import {
  CharacterSchema as CharSchema,
  SceneConfigSchema as SceneSchema,
} from '@star-rail/types';

/**
 * 导出包元数据
 */
export interface ExportMetadata {
  version: string;
  type: 'character' | 'scene' | 'session';
  exportedAt: number;
  dependencies: string[];
}

/**
 * 导出包
 */
export interface ExportPackage<T> {
  metadata: ExportMetadata;
  data: T;
}

/**
 * 导入结果
 */
export interface ImportResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  conflicts?: string[];
}

/**
 * 导出导入服务
 * 处理人物、场景等数据的导出和导入
 */
@injectable()
export class ExportImportService {
  private exportDir: string;

  constructor(exportDir: string = './exports') {
    this.exportDir = exportDir;
  }

  /**
   * 导出人物
   */
  async exportCharacter(
    character: Character,
    filename?: string
  ): Promise<string> {
    const pkg: ExportPackage<Character> = {
      metadata: {
        version: '0.1.0',
        type: 'character',
        exportedAt: Date.now(),
        dependencies: [],
      },
      data: character,
    };

    const filePath = path.join(
      this.exportDir,
      'characters',
      filename || `${character.id}.json`
    );

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, pkg, { spaces: 2 });

    return filePath;
  }

  /**
   * 导入人物
   */
  async importCharacter(filePath: string): Promise<ImportResult<Character>> {
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

      return {
        success: true,
        data: parsed.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `导入失败: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 导出场景
   */
  async exportScene(scene: SceneConfig, filename?: string): Promise<string> {
    const pkg: ExportPackage<SceneConfig> = {
      metadata: {
        version: '0.1.0',
        type: 'scene',
        exportedAt: Date.now(),
        dependencies: [],
      },
      data: scene,
    };

    const filePath = path.join(
      this.exportDir,
      'scenes',
      filename || `${scene.id}.json`
    );

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, pkg, { spaces: 2 });

    return filePath;
  }

  /**
   * 导入场景
   */
  async importScene(filePath: string): Promise<ImportResult<SceneConfig>> {
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

      return {
        success: true,
        data: parsed.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `导入失败: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 列出可导入的文件
   */
  async listExports(
    type: 'character' | 'scene'
  ): Promise<Array<{ filename: string; path: string }>> {
    const dir = path.join(this.exportDir, `${type}s`);

    if (!(await fs.pathExists(dir))) {
      return [];
    }

    const files = await fs.readdir(dir);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => ({
        filename: f,
        path: path.join(dir, f),
      }));
  }
}
