import 'reflect-metadata';
import { JsonFileStorage } from '../json-file-storage.js';
import type { SessionState, Snapshot } from '@star-rail/types';
import {
  generateSessionId,
  generateSnapshotId,
  createDefaultWorldState,
} from '@star-rail/types';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// 创建测试用会话状态
function createTestSessionState(sessionId: string): SessionState {
  return {
    worldState: createDefaultWorldState('test_scene'),
    characters: {},
    information: {
      global: [],
      byCharacter: {},
    },
    metadata: {
      sessionId,
      sessionName: 'Test Session',
      createdAt: Date.now(),
      lastSaved: Date.now(),
      version: '1.0.0',
    },
  };
}

// 创建测试用快照
function createTestSnapshot(
  snapshotId: string,
  sessionState: SessionState
): Snapshot {
  return {
    id: snapshotId,
    name: 'Test Snapshot',
    description: 'Test snapshot description',
    createdAt: Date.now(),
    state: sessionState,
  };
}

describe('JsonFileStorage', () => {
  let storage: JsonFileStorage;
  let testDir: string;

  beforeEach(async () => {
    // 创建临时测试目录
    testDir = path.join(
      os.tmpdir(),
      `test_storage_${Date.now()}_${Math.random()}`
    );
    await fs.ensureDir(testDir);
    storage = new JsonFileStorage(testDir);
  });

  afterEach(async () => {
    // 清理测试目录
    await fs.remove(testDir);
  });

  describe('saveSession and loadSession', () => {
    it('should save and load session state', async () => {
      const sessionId = generateSessionId();
      const state = createTestSessionState(sessionId);

      await storage.saveSession(sessionId, state);
      const loaded = await storage.loadSession(sessionId);

      expect(loaded).not.toBeNull();
      expect(loaded?.metadata.sessionId).toBe(sessionId);
      expect(loaded?.metadata.sessionName).toBe('Test Session');
    });

    it('should return null for non-existent session', async () => {
      const loaded = await storage.loadSession('nonexistent');

      expect(loaded).toBeNull();
    });

    it('should overwrite existing session', async () => {
      const sessionId = generateSessionId();
      const state1 = createTestSessionState(sessionId);
      state1.metadata.sessionName = 'First';

      await storage.saveSession(sessionId, state1);

      const state2 = createTestSessionState(sessionId);
      state2.metadata.sessionName = 'Second';

      await storage.saveSession(sessionId, state2);

      const loaded = await storage.loadSession(sessionId);
      expect(loaded?.metadata.sessionName).toBe('Second');
    });

    it('should update lastSaved timestamp on save', async () => {
      const sessionId = generateSessionId();
      const state = createTestSessionState(sessionId);
      const originalTimestamp = state.metadata.lastSaved;

      // 等待足够长的时间确保时间戳不同
      await new Promise((resolve) => setTimeout(resolve, 50));

      await storage.saveSession(sessionId, state);
      const loaded = await storage.loadSession(sessionId);

      expect(loaded?.metadata.lastSaved).toBeGreaterThanOrEqual(
        originalTimestamp
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session', async () => {
      const sessionId = generateSessionId();
      const state = createTestSessionState(sessionId);

      await storage.saveSession(sessionId, state);
      expect(await storage.sessionExists(sessionId)).toBe(true);

      await storage.deleteSession(sessionId);
      expect(await storage.sessionExists(sessionId)).toBe(false);
    });

    it('should not throw error when deleting non-existent session', async () => {
      await expect(storage.deleteSession('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('listSessions', () => {
    it('should list all session IDs', async () => {
      const sessionId1 = generateSessionId();
      const sessionId2 = generateSessionId();
      const sessionId3 = generateSessionId();

      await storage.saveSession(sessionId1, createTestSessionState(sessionId1));
      await storage.saveSession(sessionId2, createTestSessionState(sessionId2));
      await storage.saveSession(sessionId3, createTestSessionState(sessionId3));

      const sessions = await storage.listSessions();

      expect(sessions).toHaveLength(3);
      expect(sessions).toContain(sessionId1);
      expect(sessions).toContain(sessionId2);
      expect(sessions).toContain(sessionId3);
    });

    it('should return empty array when no sessions exist', async () => {
      const sessions = await storage.listSessions();

      expect(sessions).toEqual([]);
    });
  });

  describe('sessionExists', () => {
    it('should return true for existing session', async () => {
      const sessionId = generateSessionId();
      await storage.saveSession(sessionId, createTestSessionState(sessionId));

      const exists = await storage.sessionExists(sessionId);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      const exists = await storage.sessionExists('nonexistent');

      expect(exists).toBe(false);
    });
  });

  describe('saveSnapshot and loadSnapshot', () => {
    it('should save and load snapshot', async () => {
      const sessionId = generateSessionId();
      const state = createTestSessionState(sessionId);
      await storage.saveSession(sessionId, state);

      const snapshotId = generateSnapshotId();
      const snapshot = createTestSnapshot(snapshotId, state);

      await storage.saveSnapshot(sessionId, snapshot);
      const loaded = await storage.loadSnapshot(sessionId, snapshotId);

      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe(snapshotId);
      expect(loaded?.name).toBe('Test Snapshot');
    });

    it('should return null for non-existent snapshot', async () => {
      const sessionId = generateSessionId();
      await storage.saveSession(sessionId, createTestSessionState(sessionId));

      const loaded = await storage.loadSnapshot(sessionId, 'nonexistent');

      expect(loaded).toBeNull();
    });

    it('should save multiple snapshots for same session', async () => {
      const sessionId = generateSessionId();
      const state = createTestSessionState(sessionId);
      await storage.saveSession(sessionId, state);

      const snapshot1 = createTestSnapshot(generateSnapshotId(), state);
      const snapshot2 = createTestSnapshot(generateSnapshotId(), state);

      await storage.saveSnapshot(sessionId, snapshot1);
      await storage.saveSnapshot(sessionId, snapshot2);

      const loaded1 = await storage.loadSnapshot(sessionId, snapshot1.id);
      const loaded2 = await storage.loadSnapshot(sessionId, snapshot2.id);

      expect(loaded1).not.toBeNull();
      expect(loaded2).not.toBeNull();
      expect(loaded1?.id).toBe(snapshot1.id);
      expect(loaded2?.id).toBe(snapshot2.id);
    });
  });

  describe('listSnapshots', () => {
    it('should list all snapshot IDs for a session', async () => {
      const sessionId = generateSessionId();
      const state = createTestSessionState(sessionId);
      await storage.saveSession(sessionId, state);

      const snapshotId1 = generateSnapshotId();
      const snapshotId2 = generateSnapshotId();
      const snapshotId3 = generateSnapshotId();

      await storage.saveSnapshot(
        sessionId,
        createTestSnapshot(snapshotId1, state)
      );
      await storage.saveSnapshot(
        sessionId,
        createTestSnapshot(snapshotId2, state)
      );
      await storage.saveSnapshot(
        sessionId,
        createTestSnapshot(snapshotId3, state)
      );

      const snapshots = await storage.listSnapshots(sessionId);

      expect(snapshots).toHaveLength(3);
      expect(snapshots).toContain(snapshotId1);
      expect(snapshots).toContain(snapshotId2);
      expect(snapshots).toContain(snapshotId3);
    });

    it('should return empty array when no snapshots exist', async () => {
      const sessionId = generateSessionId();
      await storage.saveSession(sessionId, createTestSessionState(sessionId));

      const snapshots = await storage.listSnapshots(sessionId);

      expect(snapshots).toEqual([]);
    });

    it('should return empty array for non-existent session', async () => {
      const snapshots = await storage.listSnapshots('nonexistent');

      expect(snapshots).toEqual([]);
    });
  });

  describe('deleteSnapshot', () => {
    it('should delete existing snapshot', async () => {
      const sessionId = generateSessionId();
      const state = createTestSessionState(sessionId);
      await storage.saveSession(sessionId, state);

      const snapshotId = generateSnapshotId();
      await storage.saveSnapshot(
        sessionId,
        createTestSnapshot(snapshotId, state)
      );

      const snapshotsBefore = await storage.listSnapshots(sessionId);
      expect(snapshotsBefore).toContain(snapshotId);

      await storage.deleteSnapshot(sessionId, snapshotId);

      const snapshotsAfter = await storage.listSnapshots(sessionId);
      expect(snapshotsAfter).not.toContain(snapshotId);
    });

    it('should not throw error when deleting non-existent snapshot', async () => {
      const sessionId = generateSessionId();
      await storage.saveSession(sessionId, createTestSessionState(sessionId));

      await expect(
        storage.deleteSnapshot(sessionId, 'nonexistent')
      ).resolves.not.toThrow();
    });
  });

  describe('Data Integrity', () => {
    it('should preserve complex nested data structures', async () => {
      const sessionId = generateSessionId();
      const state = createTestSessionState(sessionId);

      // 添加复杂数据
      state.characters['char1'] = {
        id: 'char1',
        name: 'Character 1',
        state: {
          relationships: {
            char2: {
              trust: 0.8,
              hostility: 0.1,
              intimacy: 0.6,
              respect: 0.7,
            },
          },
          abilities: {
            combat: 75,
            diplomacy: 60,
          },
          knownInformation: [
            {
              informationId: 'info1',
              acquiredAt: Date.now(),
              confidence: 0.9,
            },
          ],
        },
        personality: {
          traits: {
            openness: 0.7,
            conscientiousness: 0.6,
            extraversion: 0.8,
            agreeableness: 0.7,
            neuroticism: 0.3,
          },
          values: {
            selfDirection: 0.8,
            benevolence: 0.7,
            security: 0.6,
          },
        },
      };

      await storage.saveSession(sessionId, state);
      const loaded = await storage.loadSession(sessionId);

      expect(loaded?.characters['char1']).toEqual(state.characters['char1']);
      expect(
        loaded?.characters['char1'].state.relationships['char2'].trust
      ).toBe(0.8);
    });
  });
});
