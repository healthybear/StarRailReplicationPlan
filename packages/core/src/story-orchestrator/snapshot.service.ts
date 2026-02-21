import { injectable, inject } from 'tsyringe';
import type { SessionState, Snapshot } from '@star-rail/types';
import {
  SnapshotSchema,
  generateSnapshotId,
  CURRENT_DATA_VERSION,
} from '@star-rail/types';
import type { StorageAdapter } from '@star-rail/infrastructure';

/**
 * 快照服务
 * P2-SO-01: 提供会话快照的保存、加载和恢复功能
 */
@injectable()
export class SnapshotService {
  constructor(@inject('StorageAdapter') private storage: StorageAdapter) {}

  /**
   * 保存当前会话状态为快照
   * @param session 当前会话状态
   * @param name 快照名称
   * @param description 快照描述（可选）
   * @returns 生成的快照
   */
  async saveSnapshot(
    session: SessionState,
    name: string,
    description?: string
  ): Promise<Snapshot> {
    const snapshot: Snapshot = SnapshotSchema.parse({
      id: generateSnapshotId(),
      name,
      createdAt: Date.now(),
      description,
      state: {
        ...session,
        metadata: {
          ...session.metadata,
          version: CURRENT_DATA_VERSION,
          lastSaved: Date.now(),
        },
      },
    });

    await this.storage.saveSnapshot(session.metadata.sessionId, snapshot);
    return snapshot;
  }

  /**
   * 加载快照
   * @param sessionId 会话 ID
   * @param snapshotId 快照 ID
   */
  async loadSnapshot(
    sessionId: string,
    snapshotId: string
  ): Promise<Snapshot | null> {
    return this.storage.loadSnapshot(sessionId, snapshotId);
  }

  /**
   * 列出会话的所有快照 ID
   * @param sessionId 会话 ID
   */
  async listSnapshots(sessionId: string): Promise<string[]> {
    return this.storage.listSnapshots(sessionId);
  }

  /**
   * 删除快照
   * @param sessionId 会话 ID
   * @param snapshotId 快照 ID
   */
  async deleteSnapshot(sessionId: string, snapshotId: string): Promise<void> {
    return this.storage.deleteSnapshot(sessionId, snapshotId);
  }

  /**
   * 从快照恢复会话状态
   * 返回快照中保存的 SessionState 副本，调用方负责替换当前会话
   * @param sessionId 会话 ID
   * @param snapshotId 快照 ID
   * @returns 恢复的会话状态，快照不存在时返回 null
   */
  async restoreFromSnapshot(
    sessionId: string,
    snapshotId: string
  ): Promise<SessionState | null> {
    const snapshot = await this.storage.loadSnapshot(sessionId, snapshotId);
    if (!snapshot) return null;

    // 深拷贝，避免修改快照内部状态
    return JSON.parse(JSON.stringify(snapshot.state)) as SessionState;
  }
}
