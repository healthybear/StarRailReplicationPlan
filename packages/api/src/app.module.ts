import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { SessionModule } from './modules/session/session.module';
import { StoryModule } from './modules/story/story.module';
import { SnapshotModule } from './modules/snapshot/snapshot.module';
import { createCoreProviders } from './common/providers/core.provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    SessionModule,
    StoryModule,
    SnapshotModule,
  ],
  controllers: [AppController],
  providers: [AppService, ...createCoreProviders(new ConfigService())],
  exports: [
    ...createCoreProviders(new ConfigService()).map((p) =>
      typeof p === 'object' && 'provide' in p ? p.provide : p,
    ),
  ],
})
export class AppModule {}
