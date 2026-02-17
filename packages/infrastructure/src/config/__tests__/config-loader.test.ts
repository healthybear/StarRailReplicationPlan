import 'reflect-metadata';
import { ConfigLoader } from '../config-loader.js';
import { z } from 'zod';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// 测试用 Schema
const TestConfigSchema = z.object({
  name: z.string(),
  value: z.number(),
  enabled: z.boolean().optional(),
});

type TestConfig = z.infer<typeof TestConfigSchema>;

describe('ConfigLoader', () => {
  let configLoader: ConfigLoader;
  let testDir: string;

  beforeEach(async () => {
    // 创建临时测试目录
    testDir = path.join(
      os.tmpdir(),
      `test_config_${Date.now()}_${Math.random()}`
    );
    await fs.ensureDir(testDir);
    configLoader = new ConfigLoader(testDir);
  });

  afterEach(async () => {
    // 清理测试目录
    await fs.remove(testDir);
  });

  describe('loadYaml', () => {
    it('should load and parse valid YAML file', async () => {
      const yamlContent = `
name: test
value: 42
enabled: true
`;
      await fs.writeFile(path.join(testDir, 'test.yaml'), yamlContent);

      const config = await configLoader.loadYaml('test.yaml', TestConfigSchema);

      expect(config.name).toBe('test');
      expect(config.value).toBe(42);
      expect(config.enabled).toBe(true);
    });

    it('should throw error for invalid YAML schema', async () => {
      const yamlContent = `
name: test
value: "not a number"
`;
      await fs.writeFile(path.join(testDir, 'invalid.yaml'), yamlContent);

      await expect(
        configLoader.loadYaml('invalid.yaml', TestConfigSchema)
      ).rejects.toThrow();
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        configLoader.loadYaml('nonexistent.yaml', TestConfigSchema)
      ).rejects.toThrow();
    });
  });

  describe('loadJson', () => {
    it('should load and parse valid JSON file', async () => {
      const jsonContent = {
        name: 'test',
        value: 42,
        enabled: true,
      };
      await fs.writeJson(path.join(testDir, 'test.json'), jsonContent);

      const config = await configLoader.loadJson('test.json', TestConfigSchema);

      expect(config.name).toBe('test');
      expect(config.value).toBe(42);
      expect(config.enabled).toBe(true);
    });

    it('should throw error for invalid JSON schema', async () => {
      const jsonContent = {
        name: 'test',
        value: 'not a number',
      };
      await fs.writeJson(path.join(testDir, 'invalid.json'), jsonContent);

      await expect(
        configLoader.loadJson('invalid.json', TestConfigSchema)
      ).rejects.toThrow();
    });

    it('should throw error for malformed JSON', async () => {
      await fs.writeFile(
        path.join(testDir, 'malformed.json'),
        '{invalid json}'
      );

      await expect(
        configLoader.loadJson('malformed.json', TestConfigSchema)
      ).rejects.toThrow();
    });
  });

  describe('loadDirectory', () => {
    it('should load all YAML and JSON files from directory', async () => {
      const subDir = path.join(testDir, 'configs');
      await fs.ensureDir(subDir);

      // 创建多个配置文件
      await fs.writeFile(
        path.join(subDir, 'config1.yaml'),
        'name: config1\nvalue: 1'
      );
      await fs.writeFile(
        path.join(subDir, 'config2.yml'),
        'name: config2\nvalue: 2'
      );
      await fs.writeJson(path.join(subDir, 'config3.json'), {
        name: 'config3',
        value: 3,
      });

      const configs = await configLoader.loadDirectory(
        'configs',
        TestConfigSchema
      );

      expect(configs.size).toBe(3);
      expect(configs.get('config1')?.value).toBe(1);
      expect(configs.get('config2')?.value).toBe(2);
      expect(configs.get('config3')?.value).toBe(3);
    });

    it('should return empty map for non-existent directory', async () => {
      const configs = await configLoader.loadDirectory(
        'nonexistent',
        TestConfigSchema
      );

      expect(configs.size).toBe(0);
    });

    it('should skip non-config files', async () => {
      const subDir = path.join(testDir, 'mixed');
      await fs.ensureDir(subDir);

      await fs.writeFile(
        path.join(subDir, 'config.yaml'),
        'name: config\nvalue: 1'
      );
      await fs.writeFile(path.join(subDir, 'readme.txt'), 'some text');
      await fs.writeFile(path.join(subDir, 'script.sh'), '#!/bin/bash');

      const configs = await configLoader.loadDirectory(
        'mixed',
        TestConfigSchema
      );

      expect(configs.size).toBe(1);
      expect(configs.has('config')).toBe(true);
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await fs.writeFile(
        path.join(testDir, 'exists.yaml'),
        'name: test\nvalue: 1'
      );

      const exists = await configLoader.exists('exists.yaml');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await configLoader.exists('nonexistent.yaml');

      expect(exists).toBe(false);
    });
  });

  describe('saveYaml', () => {
    it('should save data as YAML file', async () => {
      const data: TestConfig = {
        name: 'saved',
        value: 99,
        enabled: false,
      };

      await configLoader.saveYaml('saved.yaml', data);

      const exists = await fs.pathExists(path.join(testDir, 'saved.yaml'));
      expect(exists).toBe(true);

      // 验证可以重新加载
      const loaded = await configLoader.loadYaml(
        'saved.yaml',
        TestConfigSchema
      );
      expect(loaded.name).toBe('saved');
      expect(loaded.value).toBe(99);
    });

    it('should create parent directories if not exist', async () => {
      const data: TestConfig = {
        name: 'nested',
        value: 1,
      };

      await configLoader.saveYaml('nested/deep/config.yaml', data);

      const exists = await fs.pathExists(
        path.join(testDir, 'nested/deep/config.yaml')
      );
      expect(exists).toBe(true);
    });
  });

  describe('saveJson', () => {
    it('should save data as JSON file', async () => {
      const data: TestConfig = {
        name: 'saved',
        value: 99,
        enabled: false,
      };

      await configLoader.saveJson('saved.json', data);

      const exists = await fs.pathExists(path.join(testDir, 'saved.json'));
      expect(exists).toBe(true);

      // 验证可以重新加载
      const loaded = await configLoader.loadJson(
        'saved.json',
        TestConfigSchema
      );
      expect(loaded.name).toBe('saved');
      expect(loaded.value).toBe(99);
    });

    it('should format JSON with proper indentation', async () => {
      const data: TestConfig = {
        name: 'formatted',
        value: 42,
      };

      await configLoader.saveJson('formatted.json', data);

      const content = await fs.readFile(
        path.join(testDir, 'formatted.json'),
        'utf-8'
      );
      expect(content).toContain('\n');
      expect(content).toContain('  ');
    });
  });
});
