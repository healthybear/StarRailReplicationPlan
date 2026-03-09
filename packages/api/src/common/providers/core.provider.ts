import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  initializeContainer,
  getContainer,
  type SimpleLLMConfig,
} from '@star-rail/core';

// Token 常量
export const CORE_CONTAINER = 'CORE_CONTAINER';
export const STORY_ORCHESTRATOR = 'STORY_ORCHESTRATOR';
export const SNAPSHOT_SERVICE = 'SNAPSHOT_SERVICE';
export const ANCHOR_EVALUATOR = 'ANCHOR_EVALUATOR';
export const CHARACTER_STATE_SERVICE = 'CHARACTER_STATE_SERVICE';
export const FACTION_SERVICE = 'FACTION_SERVICE';
export const WORLD_ENGINE = 'WORLD_ENGINE';
export const EXPORT_IMPORT_SERVICE = 'EXPORT_IMPORT_SERVICE';
export const VISION_MANAGER = 'VISION_MANAGER';

/**
 * 创建 Core 包服务的 NestJS Providers
 * 桥接 tsyringe DI 容器和 NestJS DI 系统
 */
export function createCoreProviders(configService: ConfigService): Provider[] {
  // 从环境变量获取配置
  const dataDir = configService.get<string>('DATA_PATH', './data');
  const configDir = configService.get<string>('CONFIG_PATH', './config');

  // LLM 配置
  const llmConfig: SimpleLLMConfig = {
    provider: configService.get<string>('LLM_PROVIDER', 'deepseek'),
    model: configService.get<string>('LLM_MODEL') || 'deepseek-chat',
  };

  // 初始化 tsyringe 容器
  initializeContainer({
    dataDir,
    configDir,
    llmConfig,
  });

  const container = getContainer();

  // 创建 NestJS Providers
  return [
    {
      provide: CORE_CONTAINER,
      useValue: container,
    },
    {
      provide: STORY_ORCHESTRATOR,
      useFactory: () => container.resolve('StoryOrchestrator'),
    },
    {
      provide: SNAPSHOT_SERVICE,
      useFactory: () => container.resolve('SnapshotService'),
    },
    {
      provide: ANCHOR_EVALUATOR,
      useFactory: () => container.resolve('AnchorEvaluator'),
    },
    {
      provide: CHARACTER_STATE_SERVICE,
      useFactory: () => container.resolve('CharacterStateService'),
    },
    {
      provide: FACTION_SERVICE,
      useFactory: () => container.resolve('FactionService'),
    },
    {
      provide: WORLD_ENGINE,
      useFactory: () => container.resolve('WorldEngine'),
    },
    {
      provide: EXPORT_IMPORT_SERVICE,
      useFactory: () => container.resolve('ExportImportService'),
    },
    {
      provide: VISION_MANAGER,
      useFactory: () => container.resolve('VisionManager'),
    },
  ];
}
