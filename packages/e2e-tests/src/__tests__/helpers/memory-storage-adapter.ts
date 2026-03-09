/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-console */
/**
 * 内存存储适配器
 * 用于测试，数据存储在内存中，不写入文件系统
 */

import type { StorageAdapter } from '@star-rail/infrastructure';

export class MemoryStorageAdapter implements StorageAdapter {
  private data: Map<string, any> = new Map();
  private basePath: string;

  constructor(basePath: string = './test-data') {
    this.basePath = basePath;
  }

  async read<T>(key: string): Promise<T | null> {
    const value = this.data.get(key);
    return value !== undefined ? value : null;
  }

  async write<T>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.data.has(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.data.keys());
    if (prefix) {
      return keys.filter((key) => key.startsWith(prefix));
    }
    return keys;
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  /**
   * 获取所有数据（用于调试）
   */
  getAllData(): Map<string, any> {
    return new Map(this.data);
  }

  /**
   * 设置数据（用于测试准备）
   */
  setData(key: string, value: any): void {
    this.data.set(key, value);
  }
}
