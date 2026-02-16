#!/usr/bin/env node
import 'reflect-metadata';
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { EnvLoader } from '@star-rail/infrastructure';
import { startCommand } from './commands/start.js';
import { sessionCommand } from './commands/session.js';
import { exportCommand } from './commands/export.js';
import { importCommand } from './commands/import.js';
import { configCommand } from './commands/config.js';

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 查找项目根目录（包含 package.json 且有 workspaces 字段的目录）
function findProjectRoot(): string {
  let currentDir = __dirname;

  // 从 CLI dist 目录向上查找，最多查找 5 层
  for (let i = 0; i < 5; i++) {
    const packageJsonPath = path.join(currentDir, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8')
        );
        // 检查是否是 monorepo 根目录（有 workspaces 字段）
        if (packageJson.workspaces) {
          return currentDir;
        }
      } catch (error) {
        // 忽略 JSON 解析错误，继续向上查找
      }
    }

    currentDir = path.dirname(currentDir);
  }

  // 如果找不到，使用当前工作目录
  return process.cwd();
}

// 获取项目根目录
const projectRoot = findProjectRoot();

// 如果当前工作目录不是项目根目录，切换到项目根目录
if (process.cwd() !== projectRoot) {
  console.log(chalk.gray(`[Info] 切换工作目录到项目根目录: ${projectRoot}`));
  process.chdir(projectRoot);
}

// 加载环境变量：从项目根目录加载 .env
const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
  EnvLoader.load(envPath);
}

const program = new Command();

// 程序基本信息
program
  .name('star-rail')
  .description(chalk.cyan('星穹铁道剧情复现计划 CLI'))
  .version('0.1.0');

// 注册命令
program.addCommand(startCommand);
program.addCommand(sessionCommand);
program.addCommand(exportCommand);
program.addCommand(importCommand);
program.addCommand(configCommand);

// 默认命令：显示主菜单
program.action(async () => {
  const { showMainMenu } = await import('./ui/main-menu.js');
  await showMainMenu();
});

// 解析命令行参数
program.parse();
