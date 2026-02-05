import { ExportImportService } from '@star-rail/core';
import type {
  Character,
  SceneConfig,
  SessionState,
  ExportPackage,
  ImportResult,
} from '@star-rail/types';
import type { ImportOptions } from '@star-rail/core';

/**
 * 导出服务封装
 */
class ExportService {
  private service: ExportImportService;

  constructor(exportDir: string = './exports') {
    this.service = new ExportImportService(exportDir);
  }

  /**
   * 导出人物
   */
  async exportCharacter(
    character: Character,
    filename?: string
  ): Promise<string> {
    return this.service.exportCharacter(character, filename);
  }

  /**
   * 导入人物
   */
  async importCharacter(filePath: string) {
    return this.service.importCharacter(filePath);
  }

  /**
   * 导出场景
   */
  async exportScene(scene: SceneConfig, filename?: string): Promise<string> {
    return this.service.exportScene(scene, filename);
  }

  /**
   * 导入场景
   */
  async importScene(filePath: string) {
    return this.service.importScene(filePath);
  }

  /**
   * 导出会话
   */
  async exportSession(
    session: SessionState,
    filename?: string
  ): Promise<string> {
    return this.service.exportSession(session, filename);
  }

  /**
   * 导入会话
   */
  async importSession(
    filePath: string,
    options?: ImportOptions
  ): Promise<ImportResult<SessionState>> {
    return this.service.importSession(filePath, options);
  }

  /**
   * 列出可导入的文件
   */
  async listExports(type: 'character' | 'scene' | 'session') {
    return this.service.listExports(type);
  }

  /**
   * 验证导出包
   */
  async validateExportPackage(filePath: string): Promise<{
    valid: boolean;
    errors: string[];
    metadata?: ExportPackage<unknown>['metadata'];
  }> {
    return this.service.validateExportPackage(filePath);
  }

  /**
   * 读取导出包元数据
   */
  async readExportMetadata(
    filePath: string
  ): Promise<ExportPackage<unknown>['metadata'] | null> {
    return this.service.readExportMetadata(filePath);
  }

  /**
   * 检测导入冲突
   */
  detectCharacterConflicts(
    character: Character,
    existingCharacters: Record<string, Character>
  ) {
    return this.service.detectCharacterConflicts(character, existingCharacters);
  }

  /**
   * 检测场景导入冲突
   */
  detectSceneConflicts(scene: SceneConfig, existingScenes: SceneConfig[]) {
    return this.service.detectSceneConflicts(scene, existingScenes);
  }
}

// 单例
let exportService: ExportService | null = null;

export function getExportService(): ExportService {
  if (!exportService) {
    exportService = new ExportService();
  }
  return exportService;
}
