import { z } from 'zod';
import { CharacterSchema } from './character.js';
import { WorldStateSchema } from './world-state.js';
import { InformationStoreSchema } from './information.js';

/**
 * 会话元数据 Schema
 */
export const SessionMetadataSchema = z.object({
  /** 会话唯一标识 */
  sessionId: z.string(),
  /** 会话名称 */
  sessionName: z.string(),
  /** 创建时间戳 */
  createdAt: z.number(),
  /** 最后保存时间戳 */
  lastSaved: z.number(),
  /** 数据版本 */
  version: z.string(),
});

export type SessionMetadata = z.infer<typeof SessionMetadataSchema>;

/**
 * 会话状态 Schema
 * 单文件存储的完整会话数据
 */
export const SessionStateSchema = z.object({
  /** 世界状态 */
  worldState: WorldStateSchema,
  /** 人物列表（按 ID 索引） */
  characters: z.record(CharacterSchema),
  /** 信息库 */
  information: InformationStoreSchema,
  /** 会话元数据 */
  metadata: SessionMetadataSchema,
});

export type SessionState = z.infer<typeof SessionStateSchema>;

/**
 * 快照 Schema
 * 用于保存和恢复会话状态
 */
export const SnapshotSchema = z.object({
  /** 快照 ID */
  id: z.string(),
  /** 快照名称 */
  name: z.string(),
  /** 创建时间戳 */
  createdAt: z.number(),
  /** 快照描述 */
  description: z.string().optional(),
  /** 会话状态 */
  state: SessionStateSchema,
});

export type Snapshot = z.infer<typeof SnapshotSchema>;

/**
 * 生成会话 ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 生成快照 ID
 */
export function generateSnapshotId(): string {
  return `snapshot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 当前数据版本
 */
export const CURRENT_DATA_VERSION = '0.1.0';
