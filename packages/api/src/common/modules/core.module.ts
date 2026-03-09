import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCoreProviders } from '../providers/core.provider';

/**
 * Core 模块 - 全局模块
 * 提供 @star-rail/core 包的服务
 */
@Global()
@Module({
  providers: createCoreProviders(new ConfigService()),
  exports: createCoreProviders(new ConfigService()).map((p) =>
    typeof p === 'object' && 'provide' in p ? p.provide : p,
  ),
})
export class CoreModule {}
