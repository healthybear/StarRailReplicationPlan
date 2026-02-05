import { injectable } from 'tsyringe';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import type { ZodSchema } from 'zod';

/**
 * 配置加载器
 * 支持加载 JSON 和 YAML 配置文件，并通过 Zod 校验
 */
@injectable()
export class ConfigLoader {
  private configDir: string;

  constructor(configDir: string = './config') {
    this.configDir = configDir;
  }

  /**
   * 加载 YAML 配置文件
   * @param filePath 相对于 configDir 的文件路径
   * @param schema Zod schema 用于校验
   */
  async loadYaml<T>(filePath: string, schema: ZodSchema<T>): Promise<T> {
    const fullPath = path.join(this.configDir, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const data = yaml.load(content);
    return schema.parse(data);
  }

  /**
   * 加载 JSON 配置文件
   * @param filePath 相对于 configDir 的文件路径
   * @param schema Zod schema 用于校验
   */
  async loadJson<T>(filePath: string, schema: ZodSchema<T>): Promise<T> {
    const fullPath = path.join(this.configDir, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const data = JSON.parse(content);
    return schema.parse(data);
  }

  /**
   * 批量加载目录下的配置文件
   * @param dirPath 相对于 configDir 的目录路径
   * @param schema Zod schema 用于校验
   */
  async loadDirectory<T>(
    dirPath: string,
    schema: ZodSchema<T>
  ): Promise<Map<string, T>> {
    const fullPath = path.join(this.configDir, dirPath);
    const configs = new Map<string, T>();

    if (!(await fs.pathExists(fullPath))) {
      return configs;
    }

    const files = await fs.readdir(fullPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);

      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const config = await this.loadYaml(filePath, schema);
        const key = file.replace(/\.ya?ml$/, '');
        configs.set(key, config);
      } else if (file.endsWith('.json')) {
        const config = await this.loadJson(filePath, schema);
        const key = file.replace('.json', '');
        configs.set(key, config);
      }
    }

    return configs;
  }

  /**
   * 检查配置文件是否存在
   * @param filePath 相对于 configDir 的文件路径
   */
  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.configDir, filePath);
    return fs.pathExists(fullPath);
  }

  /**
   * 保存 YAML 配置文件
   * @param filePath 相对于 configDir 的文件路径
   * @param data 要保存的数据
   */
  async saveYaml<T>(filePath: string, data: T): Promise<void> {
    const fullPath = path.join(this.configDir, filePath);
    await fs.ensureDir(path.dirname(fullPath));
    const content = yaml.dump(data, { indent: 2, lineWidth: 120 });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  /**
   * 保存 JSON 配置文件
   * @param filePath 相对于 configDir 的文件路径
   * @param data 要保存的数据
   */
  async saveJson<T>(filePath: string, data: T): Promise<void> {
    const fullPath = path.join(this.configDir, filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeJson(fullPath, data, { spaces: 2 });
  }
}
