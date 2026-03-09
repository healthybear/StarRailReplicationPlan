import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { SessionModule } from './modules/session/session.module';
import { StoryModule } from './modules/story/story.module';
import { SnapshotModule } from './modules/snapshot/snapshot.module';
import { CharacterModule } from './modules/character/character.module';
import { SceneModule } from './modules/scene/scene.module';
import { CoreModule } from './common/modules/core.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CoreModule,
    AuthModule,
    SessionModule,
    StoryModule,
    SnapshotModule,
    CharacterModule,
    SceneModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
