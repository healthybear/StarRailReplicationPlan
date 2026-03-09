import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { STORY_ORCHESTRATOR } from '../../common/providers/core.provider';
import type { StoryOrchestrator } from '@star-rail/core';
import type { SceneConfig } from '@star-rail/types';
import { AdvanceDto } from './dto/advance.dto';
import { AdvanceMultiDto } from './dto/advance-multi.dto';
import { AdvanceDualDto } from './dto/advance-dual.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StoryService {
  constructor(
    @Inject(STORY_ORCHESTRATOR)
    private readonly storyOrchestrator: StoryOrchestrator,
  ) {}

  /**
   * 加载场景配置
   */
  private async loadSceneConfig(sceneId: string): Promise<SceneConfig> {
    const configPath = path.join(
      process.env.CONFIG_PATH || './config',
      'scenes',
      `${sceneId}.json`,
    );
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * 单角色剧情推进
   */
  async advance(advanceDto: AdvanceDto) {
    const { sessionId, userInput, sceneId } = advanceDto;

    // 加载会话
    const session = await this.storyOrchestrator.loadSession(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // 加载场景配置
    const scene = await this.loadSceneConfig(sceneId);

    // 推进剧情
    const result = await this.storyOrchestrator.advance(
      session,
      userInput,
      scene,
    );

    // 保存会话
    if (result.success) {
      await this.storyOrchestrator.saveSession(session);
    }

    return result;
  }

  /**
   * 多角色剧情推进
   */
  async advanceMulti(advanceMultiDto: AdvanceMultiDto) {
    const { sessionId, userInput, characterIds, sceneId } = advanceMultiDto;

    // 加载会话
    const session = await this.storyOrchestrator.loadSession(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // 加载场景配置
    const scene = await this.loadSceneConfig(sceneId);

    // 推进剧情
    const result = await this.storyOrchestrator.advanceMultiCharacter(
      session,
      scene,
      {
        characterIds,
        userInput,
      },
    );

    // 保存会话
    if (result.success) {
      await this.storyOrchestrator.saveSession(session);
    }

    return result;
  }

  /**
   * 双角色剧情推进
   */
  async advanceDual(advanceDualDto: AdvanceDualDto) {
    const { sessionId, userInput, characterId1, characterId2, sceneId } =
      advanceDualDto;

    // 加载会话
    const session = await this.storyOrchestrator.loadSession(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // 加载场景配置
    const scene = await this.loadSceneConfig(sceneId);

    // 推进剧情
    const result = await this.storyOrchestrator.advanceDualCharacter(
      session,
      scene,
      characterId1,
      characterId2,
      userInput,
    );

    // 保存会话
    if (result.success) {
      await this.storyOrchestrator.saveSession(session);
    }

    return result;
  }
}
