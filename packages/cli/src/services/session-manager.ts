import { JsonFileStorage } from '@star-rail/infrastructure';
import type { SessionState, Snapshot } from '@star-rail/types';
import {
  generateSessionId,
  generateSnapshotId,
  createDefaultWorldState,
  createEmptyInformationStore,
  CURRENT_DATA_VERSION,
} from '@star-rail/types';

/**
 * 会话摘要信息
 */
export interface SessionSummary {
  id: string;
  name: string;
  createdAt: number;
  lastSaved: number;
  turnCount: number;
}

/**
 * 会话管理器
 * 封装会话的 CRUD 操作
 */
export class SessionManager {
  private storage: JsonFileStorage;

  constructor(dataDir: string = './data') {
    this.storage = new JsonFileStorage(dataDir);
  }

  /**
   * 创建新会话
   */
  async createSession(
    name: string,
    sceneId: string = 'default'
  ): Promise<SessionState> {
    const sessionId = generateSessionId();
    const now = Date.now();

    const session: SessionState = {
      worldState: createDefaultWorldState(sceneId),
      characters: {},
      information: createEmptyInformationStore(),
      metadata: {
        sessionId,
        sessionName: name,
        createdAt: now,
        lastSaved: now,
        version: CURRENT_DATA_VERSION,
      },
    };

    await this.storage.saveSession(sessionId, session);
    return session;
  }

  /**
   * 加载会话
   */
  async loadSession(sessionId: string): Promise<SessionState | null> {
    return this.storage.loadSession(sessionId);
  }

  /**
   * 保存会话
   */
  async saveSession(session: SessionState): Promise<void> {
    session.metadata.lastSaved = Date.now();
    await this.storage.saveSession(session.metadata.sessionId, session);
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.storage.deleteSession(sessionId);
  }

  /**
   * 列出所有会话
   */
  async listSessions(): Promise<SessionSummary[]> {
    const sessionIds = await this.storage.listSessions();
    const summaries: SessionSummary[] = [];

    for (const id of sessionIds) {
      const session = await this.storage.loadSession(id);
      if (session) {
        summaries.push({
          id: session.metadata.sessionId,
          name: session.metadata.sessionName,
          createdAt: session.metadata.createdAt,
          lastSaved: session.metadata.lastSaved,
          turnCount: session.worldState.timeline.currentTurn,
        });
      }
    }

    // 按最后保存时间倒序排列
    return summaries.sort((a, b) => b.lastSaved - a.lastSaved);
  }

  /**
   * 创建快照
   */
  async createSnapshot(
    sessionId: string,
    description: string
  ): Promise<string> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`);
    }

    const snapshotId = generateSnapshotId();
    const snapshot: Snapshot = {
      id: snapshotId,
      sessionId,
      description,
      createdAt: Date.now(),
      state: JSON.parse(JSON.stringify(session)), // 深拷贝
    };

    await this.storage.saveSnapshot(sessionId, snapshot);
    return snapshotId;
  }

  /**
   * 加载快照
   */
  async loadSnapshot(
    sessionId: string,
    snapshotId: string
  ): Promise<Snapshot | null> {
    return this.storage.loadSnapshot(sessionId, snapshotId);
  }

  /**
   * 列出会话的所有快照
   */
  async listSnapshots(sessionId: string): Promise<string[]> {
    return this.storage.listSnapshots(sessionId);
  }

  /**
   * 从快照恢复会话
   */
  async restoreFromSnapshot(
    sessionId: string,
    snapshotId: string
  ): Promise<SessionState> {
    const snapshot = await this.loadSnapshot(sessionId, snapshotId);
    if (!snapshot) {
      throw new Error(`快照 ${snapshotId} 不存在`);
    }

    const restoredSession = snapshot.state;
    restoredSession.metadata.lastSaved = Date.now();
    await this.saveSession(restoredSession);

    return restoredSession;
  }
}

// 单例
let sessionManager: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManager) {
    sessionManager = new SessionManager();
  }
  return sessionManager;
}
