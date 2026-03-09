import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  SNAPSHOT_SERVICE,
  STORY_ORCHESTRATOR,
} from '../../common/providers/core.provider';
import type { SnapshotService as CoreSnapshotService } from '@star-rail/core';
import type { StoryOrchestrator } from '@star-rail/core';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';

@Injectable()
export class SnapshotService {
  constructor(
    @Inject(SNAPSHOT_SERVICE)
    private readonly snapshotService: CoreSnapshotService,
    @Inject(STORY_ORCHESTRATOR)
    private readonly storyOrchestrator: StoryOrchestrator,
  ) {}

  /**
   * 创建快照
   */
  async create(sessionId: string, createSnapshotDto: CreateSnapshotDto) {
    const { name, description } = createSnapshotDto;

    // 加载会话
    const session = await this.storyOrchestrator.loadSession(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // 保存快照
    const snapshot = await this.snapshotService.saveSnapshot(
      session,
      name,
      description,
    );

    return snapshot;
  }

  /**
   * 获取快照列表
   */
  async findAll(sessionId: string) {
    // 获取快照 ID 列表
    const snapshotIds = await this.snapshotService.listSnapshots(sessionId);

    // 加载所有快照的完整数据
    const snapshots = await Promise.all(
      snapshotIds.map((id) => this.snapshotService.loadSnapshot(sessionId, id)),
    );

    // 过滤掉加载失败的快照
    return snapshots.filter((s) => s !== null);
  }

  /**
   * 恢复快照
   */
  async restore(sessionId: string, snapshotId: string) {
    // 从快照恢复会话状态
    const restoredSession = await this.snapshotService.restoreFromSnapshot(
      sessionId,
      snapshotId,
    );

    if (!restoredSession) {
      throw new NotFoundException(
        `Snapshot with ID ${snapshotId} not found in session ${sessionId}`,
      );
    }

    // 保存恢复后的会话
    await this.storyOrchestrator.saveSession(restoredSession);

    return { success: true, message: 'Snapshot restored successfully' };
  }

  /**
   * 删除快照
   */
  async remove(sessionId: string, snapshotId: string) {
    // 先检查快照是否存在
    const snapshot = await this.snapshotService.loadSnapshot(
      sessionId,
      snapshotId,
    );

    if (!snapshot) {
      throw new NotFoundException(
        `Snapshot with ID ${snapshotId} not found in session ${sessionId}`,
      );
    }

    // 删除快照
    await this.snapshotService.deleteSnapshot(sessionId, snapshotId);
  }
}
