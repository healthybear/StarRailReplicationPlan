import { injectable } from 'tsyringe';
import fs from 'fs-extra';
import path from 'path';
import {
  SessionStateSchema,
  SnapshotSchema,
  type SessionState,
  type Snapshot,
} from '@star-rail/types';
import type { StorageAdapter } from './storage.interface.js';

/**
 * JSON 文件存储实现
 * 将会话状态和快照存储为 JSON 文件
 */
@injectable()
export class JsonFileStorage implements StorageAdapter {
  private dataDir: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
  }

  private getSessionDir(sessionId: string): string {
    return path.join(this.dataDir, 'sessions', sessionId);
  }

  private getSessionFilePath(sessionId: string): string {
    return path.join(this.getSessionDir(sessionId), 'state.json');
  }

  private getSnapshotDir(sessionId: string): string {
    return path.join(this.getSessionDir(sessionId), 'snapshots');
  }

  private getSnapshotFilePath(sessionId: string, snapshotId: string): string {
    return path.join(this.getSnapshotDir(sessionId), `${snapshotId}.json`);
  }

  async saveSession(sessionId: string, state: SessionState): Promise<void> {
    const filePath = this.getSessionFilePath(sessionId);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, state, { spaces: 2 });
  }

  async loadSession(sessionId: string): Promise<SessionState | null> {
    const filePath = this.getSessionFilePath(sessionId);

    if (!(await fs.pathExists(filePath))) {
      return null;
    }

    const data = await fs.readJson(filePath);
    return SessionStateSchema.parse(data);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessionDir = this.getSessionDir(sessionId);
    if (await fs.pathExists(sessionDir)) {
      await fs.remove(sessionDir);
    }
  }

  async listSessions(): Promise<string[]> {
    const sessionsDir = path.join(this.dataDir, 'sessions');

    if (!(await fs.pathExists(sessionsDir))) {
      return [];
    }

    const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    const filePath = this.getSessionFilePath(sessionId);
    return fs.pathExists(filePath);
  }

  async saveSnapshot(sessionId: string, snapshot: Snapshot): Promise<void> {
    const filePath = this.getSnapshotFilePath(sessionId, snapshot.id);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, snapshot, { spaces: 2 });
  }

  async loadSnapshot(
    sessionId: string,
    snapshotId: string
  ): Promise<Snapshot | null> {
    const filePath = this.getSnapshotFilePath(sessionId, snapshotId);

    if (!(await fs.pathExists(filePath))) {
      return null;
    }

    const data = await fs.readJson(filePath);
    return SnapshotSchema.parse(data);
  }

  async listSnapshots(sessionId: string): Promise<string[]> {
    const snapshotDir = this.getSnapshotDir(sessionId);

    if (!(await fs.pathExists(snapshotDir))) {
      return [];
    }

    const files = await fs.readdir(snapshotDir);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
  }

  async deleteSnapshot(sessionId: string, snapshotId: string): Promise<void> {
    const filePath = this.getSnapshotFilePath(sessionId, snapshotId);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  }
}
