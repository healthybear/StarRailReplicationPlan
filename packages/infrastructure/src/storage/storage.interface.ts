import type { SessionState, Snapshot } from '@star-rail/types';

/**
 * 存储适配器接口
 * 定义状态存储的读写操作
 */
export interface StorageAdapter {
  /**
   * 保存会话状态
   * @param sessionId 会话 ID
   * @param state 会话状态
   */
  saveSession(sessionId: string, state: SessionState): Promise<void>;

  /**
   * 加载会话状态
   * @param sessionId 会话 ID
   * @returns 会话状态，不存在时返回 null
   */
  loadSession(sessionId: string): Promise<SessionState | null>;

  /**
   * 删除会话
   * @param sessionId 会话 ID
   */
  deleteSession(sessionId: string): Promise<void>;

  /**
   * 列出所有会话 ID
   */
  listSessions(): Promise<string[]>;

  /**
   * 检查会话是否存在
   * @param sessionId 会话 ID
   */
  sessionExists(sessionId: string): Promise<boolean>;

  /**
   * 保存快照
   * @param sessionId 会话 ID
   * @param snapshot 快照数据
   */
  saveSnapshot(sessionId: string, snapshot: Snapshot): Promise<void>;

  /**
   * 加载快照
   * @param sessionId 会话 ID
   * @param snapshotId 快照 ID
   */
  loadSnapshot(sessionId: string, snapshotId: string): Promise<Snapshot | null>;

  /**
   * 列出会话的所有快照
   * @param sessionId 会话 ID
   */
  listSnapshots(sessionId: string): Promise<string[]>;

  /**
   * 删除快照
   * @param sessionId 会话 ID
   * @param snapshotId 快照 ID
   */
  deleteSnapshot(sessionId: string, snapshotId: string): Promise<void>;
}
