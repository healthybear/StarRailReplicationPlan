import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCoreProviders } from '../providers/core.provider';

/**
 * Core 模块 - 全局模块
 * 提供 @star-rail/core 包的服务
 */
@Global()
@Module({
  providers: [
    {
      provide: 'CORE_PROVIDERS_INIT',
      useFactory: (configService: ConfigService) => {
        const providers = createCoreProviders(configService);
        // 返回 providers 数组以便其他模块使用
        return providers;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['CORE_PROVIDERS_INIT'],
})
export class CoreModule {}
