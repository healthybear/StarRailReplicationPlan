import { ExportImportService } from '@star-rail/core';
import type { Character, SceneConfig } from '@star-rail/types';

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
   * 列出可导入的文件
   */
  async listExports(type: 'character' | 'scene') {
    return this.service.listExports(type);
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
