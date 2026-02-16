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

// 加载环境变量：尝试从项目根目录加载 .env
// CLI 可能从 packages/cli 或项目根目录运行，需要向上查找
const possibleEnvPaths = [
  path.join(process.cwd(), '.env'), // 当前工作目录
  path.join(__dirname, '../../..', '.env'), // 从 dist 目录向上三级到根目录
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    EnvLoader.load(envPath);
    break;
  }
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
