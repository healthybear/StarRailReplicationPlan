#!/usr/bin/env node
import 'reflect-metadata';
import { Command } from 'commander';
import chalk from 'chalk';
import { startCommand } from './commands/start.js';
import { sessionCommand } from './commands/session.js';
import { exportCommand } from './commands/export.js';
import { importCommand } from './commands/import.js';
import { configCommand } from './commands/config.js';

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
