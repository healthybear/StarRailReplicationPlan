import 'reflect-metadata';
import { SnapshotService } from '../snapshot.service.js';
import type { SessionState, Snapshot } from '@star-rail/types';
import {
  createDefaultWorldState,
  createEmptyInformationStore,
  generateSessionId,
  CURRENT_DATA_VERSION,
} from '@star-rail/types';

function makeSession(): SessionState {
  return {
    worldState: createDefaultWorldState('scene-1'),
    characters: {},
    information: createEmptyInformationStore(),
    metadata: {
      sessionId: generateSessionId(),
      sessionName: '测试会话',
      createdAt: Date.now(),
      lastSaved: Date.now(),
      version: CURRENT_DATA_VERSION,
    },
  };
}

function makeStorageMock() {
  const snapshots: Map<string, Snapshot> = new Map();
  return {
    saveSession: jest.fn(),
    loadSession: jest.fn(),
    deleteSession: jest.fn(),
    listSessions: jest.fn(),
    sessionExists: jest.fn(),
    saveSnapshot: jest.fn(async (_sessionId: string, snapshot: Snapshot) => {
      snapshots.set(snapshot.id, snapshot);
    }),
    loadSnapshot: jest.fn(async (_sessionId: string, snapshotId: string) => {
      return snapshots.get(snapshotId) ?? null;
    }),
    listSnapshots: jest.fn(async () => Array.from(snapshots.keys())),
    deleteSnapshot: jest.fn(async (_sessionId: string, snapshotId: string) => {
      snapshots.delete(snapshotId);
    }),
    _snapshots: snapshots,
  };
}

describe('SnapshotService', () => {
  let service: SnapshotService;
  let storage: ReturnType<typeof makeStorageMock>;

  beforeEach(() => {
    storage = makeStorageMock();
    service = new SnapshotService(storage as never);
  });

  describe('saveSnapshot', () => {
    it('保存快照并返回快照对象', async () => {
      const session = makeSession();
      const snapshot = await service.saveSnapshot(
        session,
        '存档1',
        '第一个存档'
      );
      expect(snapshot.name).toBe('存档1');
      expect(snapshot.description).toBe('第一个存档');
      expect(snapshot.id).toMatch(/^snapshot_/);
      expect(snapshot.state.metadata.sessionId).toBe(
        session.metadata.sessionId
      );
      expect(storage.saveSnapshot).toHaveBeenCalledWith(
        session.metadata.sessionId,
        snapshot
      );
    });

    it('无描述时 description 为 undefined', async () => {
      const session = makeSession();
      const snapshot = await service.saveSnapshot(session, '存档2');
      expect(snapshot.description).toBeUndefined();
    });
  });

  describe('loadSnapshot', () => {
    it('加载已保存的快照', async () => {
      const session = makeSession();
      const saved = await service.saveSnapshot(session, '存档');
      const loaded = await service.loadSnapshot(
        session.metadata.sessionId,
        saved.id
      );
      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe(saved.id);
    });

    it('快照不存在时返回 null', async () => {
      const result = await service.loadSnapshot('session-1', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('listSnapshots', () => {
    it('列出所有快照 ID', async () => {
      const session = makeSession();
      const s1 = await service.saveSnapshot(session, '存档1');
      const s2 = await service.saveSnapshot(session, '存档2');
      const ids = await service.listSnapshots(session.metadata.sessionId);
      expect(ids).toContain(s1.id);
      expect(ids).toContain(s2.id);
    });
  });

  describe('deleteSnapshot', () => {
    it('删除快照后无法加载', async () => {
      const session = makeSession();
      const saved = await service.saveSnapshot(session, '存档');
      await service.deleteSnapshot(session.metadata.sessionId, saved.id);
      const loaded = await service.loadSnapshot(
        session.metadata.sessionId,
        saved.id
      );
      expect(loaded).toBeNull();
    });
  });

  describe('restoreFromSnapshot', () => {
    it('从快照恢复会话状态', async () => {
      const session = makeSession();
      session.worldState.timeline.currentTurn = 5;
      const saved = await service.saveSnapshot(session, '回合5存档');

      // 修改原始会话
      session.worldState.timeline.currentTurn = 10;

      const restored = await service.restoreFromSnapshot(
        session.metadata.sessionId,
        saved.id
      );
      expect(restored).not.toBeNull();
      expect(restored!.worldState.timeline.currentTurn).toBe(5);
    });

    it('恢复的状态是深拷贝，不影响快照', async () => {
      const session = makeSession();
      const saved = await service.saveSnapshot(session, '存档');
      const restored = await service.restoreFromSnapshot(
        session.metadata.sessionId,
        saved.id
      );
      // 修改恢复的状态
      restored!.worldState.timeline.currentTurn = 99;
      // 再次恢复，应该不受影响
      const restored2 = await service.restoreFromSnapshot(
        session.metadata.sessionId,
        saved.id
      );
      expect(restored2!.worldState.timeline.currentTurn).toBe(0);
    });

    it('快照不存在时返回 null', async () => {
      const result = await service.restoreFromSnapshot(
        'session-1',
        'nonexistent'
      );
      expect(result).toBeNull();
    });
  });
});
