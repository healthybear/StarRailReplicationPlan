import dotenv from 'dotenv';
import path from 'path';

/**
 * 环境变量加载器
 * 从 .env 文件加载环境变量
 */
export class EnvLoader {
  private static loaded = false;

  /**
   * 加载环境变量
   * @param envPath .env 文件路径（可选）
   */
  static load(envPath?: string): void {
    if (this.loaded) return;

    const resolvedPath = envPath || path.join(process.cwd(), '.env');
    dotenv.config({ path: resolvedPath });
    this.loaded = true;
  }

  /**
   * 获取环境变量
   * @param key 环境变量名
   * @param defaultValue 默认值
   */
  static get(key: string, defaultValue?: string): string {
    this.load();
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    return value || defaultValue!;
  }

  /**
   * 获取必需的环境变量
   * @param key 环境变量名
   */
  static getRequired(key: string): string {
    this.load();
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * 获取可选的环境变量
   * @param key 环境变量名
   */
  static getOptional(key: string): string | undefined {
    this.load();
    return process.env[key];
  }

  /**
   * 检查环境变量是否存在
   * @param key 环境变量名
   */
  static has(key: string): boolean {
    this.load();
    return process.env[key] !== undefined;
  }
}
