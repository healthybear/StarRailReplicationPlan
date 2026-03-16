import { injectable, inject } from 'tsyringe';
import type { SessionState, Snapshot } from '@star-rail/types';
import {
  SnapshotSchema,
  generateSnapshotId,
  CURRENT_DATA_VERSION,
} from '@star-rail/types';
import type { StorageAdapter } from '@star-rail/infrastructure';

/**
 * 快照服务 - 会话状态的保存与恢复（Core 层）
 *
 * 职责：
 * 1. 保存会话状态为快照（完整的状态副本）
 * 2. 加载快照数据
 * 3. 从快照恢复会话状态
 * 4. 管理快照列表（列出、删除）
 *
 * 快照内容：
 * - 完整的会话状态（世界状态、角色状态、信息库）
 * - 快照元数据（ID、名称、创建时间、描述）
 * - 数据版本号（用于兼容性检查）
 *
 * 快照用途：
 * - 存档/读档：玩家可以保存和加载游戏进度
 * - 状态回退：当剧情陷入僵局时，回退到之前的状态
 * - 锚点对比：记录关键时刻的状态，用于分支对比
 * - 调试：开发时快速恢复到特定状态
 *
 * 与 API 层 SnapshotService 的区别：
 * - Core 层：提供核心快照逻辑，与存储适配器交互
 * - API 层：提供 REST API 接口，调用 Core 层服务
 *
 * 对应 WBS：P2-SO-01（快照功能）
 */
@injectable()
export class SnapshotService {
  constructor(@inject('StorageAdapter') private storage: StorageAdapter) {}

  /**
   * 保存当前会话状态为快照
   *
   * 流程：
   * 1. 生成唯一的快照 ID
   * 2. 创建快照对象（包含完整会话状态）
   * 3. 使用 Zod Schema 验证快照数据
   * 4. 通过存储适配器持久化快照
   *
   * 注意：
   * - 快照包含完整的会话状态副本
   * - 自动更新数据版本号和保存时间
   * - 快照数据经过 Schema 验证，确保数据完整性
   *
   * @param session 当前会话状态
   * @param name 快照名称（用户可见）
   * @param description 快照描述（可选，用于说明快照内容）
   * @returns 生成的快照对象
   */
  async saveSnapshot(
    session: SessionState,
    name: string,
    description?: string
  ): Promise<Snapshot> {
    // 创建快照对象，使用 Zod Schema 验证数据完整性
    const snapshot: Snapshot = SnapshotSchema.parse({
      id: generateSnapshotId(),
      name,
      createdAt: Date.now(),
      description,
      state: {
        ...session,
        metadata: {
          ...session.metadata,
          version: CURRENT_DATA_VERSION, // 记录数据版本，用于兼容性检查
          lastSaved: Date.now(),
        },
      },
    });

    // 通过存储适配器持久化快照
    await this.storage.saveSnapshot(session.metadata.sessionId, snapshot);
    return snapshot;
  }

  /**
   * 加载快照
   *
   * 从存储中读取快照数据。
   * 如果快照不存在，返回 null。
   *
   * @param sessionId 会话 ID
   * @param snapshotId 快照 ID
   * @returns 快照对象，不存在时返回 null
   */
  async loadSnapshot(
    sessionId: string,
    snapshotId: string
  ): Promise<Snapshot | null> {
    return this.storage.loadSnapshot(sessionId, snapshotId);
  }

  /**
   * 列出会话的所有快照 ID
   *
   * 返回快照 ID 列表，按创建时间排序（由存储适配器决定）。
   * 用于展示快照列表供用户选择。
   *
   * @param sessionId 会话 ID
   * @returns 快照 ID 列表
   */
  async listSnapshots(sessionId: string): Promise<string[]> {
    return this.storage.listSnapshots(sessionId);
  }

  /**
   * 删除快照
   *
   * 从存储中删除指定快照。
   * 删除操作不可逆，调用前应确认用户意图。
   *
   * @param sessionId 会话 ID
   * @param snapshotId 快照 ID
   */
  async deleteSnapshot(sessionId: string, snapshotId: string): Promise<void> {
    return this.storage.deleteSnapshot(sessionId, snapshotId);
  }

  /**
   * 从快照恢复会话状态
   *
   * 加载快照并返回其中保存的会话状态副本。
   * 调用方负责用返回的状态替换当前会话。
   *
   * 流程：
   * 1. 加载快照数据
   * 2. 提取快照中的会话状态
   * 3. 深拷贝状态（避免修改快照内部数据）
   * 4. 返回状态副本
   *
   * 注意：
   * - 返回的是深拷贝，修改不会影响快照
   * - 调用方需要处理状态替换和相关清理工作
   * - 如果快照不存在，返回 null
   *
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
