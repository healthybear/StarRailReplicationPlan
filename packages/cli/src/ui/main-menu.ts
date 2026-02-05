import chalk from 'chalk';
import inquirer from 'inquirer';
import boxen from 'boxen';

/**
 * 显示主菜单
 */
export async function showMainMenu(): Promise<void> {
  // 显示欢迎信息
  const welcome = boxen(
    chalk.cyan.bold('星穹铁道剧情复现计划') +
      '\n\n' +
      chalk.gray('基于 LLM 的剧情模拟系统') +
      '\n' +
      chalk.gray('版本: 0.1.0'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    }
  );

  console.log(welcome);

  // 主菜单循环
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '请选择操作：',
        choices: [
          { name: chalk.green('▶ 开始会话'), value: 'start' },
          { name: chalk.blue('📋 会话管理'), value: 'session' },
          { name: chalk.yellow('📤 导出配置'), value: 'export' },
          { name: chalk.yellow('📥 导入配置'), value: 'import' },
          { name: chalk.gray('⚙ 配置检查'), value: 'config' },
          new inquirer.Separator(),
          { name: chalk.red('退出'), value: 'exit' },
        ],
      },
    ]);

    switch (action) {
      case 'start': {
        const { startCommand } = await import('../commands/start.js');
        await startCommand.parseAsync(['node', 'star-rail', 'start']);
        break;
      }
      case 'session': {
        await showSessionMenu();
        break;
      }
      case 'export': {
        const { exportCommand } = await import('../commands/export.js');
        await exportCommand.parseAsync(['node', 'star-rail', 'export']);
        break;
      }
      case 'import': {
        const { importCommand } = await import('../commands/import.js');
        await importCommand.parseAsync(['node', 'star-rail', 'import']);
        break;
      }
      case 'config': {
        const { configCommand } = await import('../commands/config.js');
        await configCommand.parseAsync([
          'node',
          'star-rail',
          'config',
          'check',
        ]);
        break;
      }
      case 'exit':
        console.log(chalk.gray('\n再见！祝你旅途愉快 ✨\n'));
        process.exit(0);
    }
  }
}

/**
 * 会话管理子菜单
 */
async function showSessionMenu(): Promise<void> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '会话管理：',
      choices: [
        { name: '列出所有会话', value: 'list' },
        { name: '查看会话详情', value: 'info' },
        { name: '删除会话', value: 'delete' },
        { name: '创建快照', value: 'snapshot' },
        new inquirer.Separator(),
        { name: chalk.gray('返回'), value: 'back' },
      ],
    },
  ]);

  if (action === 'back') {
    return;
  }

  const { sessionCommand } = await import('../commands/session.js');

  switch (action) {
    case 'list':
      await sessionCommand.parseAsync(['node', 'star-rail', 'session', 'list']);
      break;
    case 'info': {
      const { sessionId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'sessionId',
          message: '请输入会话 ID：',
        },
      ]);
      if (sessionId) {
        await sessionCommand.parseAsync([
          'node',
          'star-rail',
          'session',
          'info',
          sessionId,
        ]);
      }
      break;
    }
    case 'delete': {
      const { sessionId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'sessionId',
          message: '请输入要删除的会话 ID：',
        },
      ]);
      if (sessionId) {
        await sessionCommand.parseAsync([
          'node',
          'star-rail',
          'session',
          'delete',
          sessionId,
        ]);
      }
      break;
    }
    case 'snapshot': {
      const { sessionId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'sessionId',
          message: '请输入会话 ID：',
        },
      ]);
      if (sessionId) {
        await sessionCommand.parseAsync([
          'node',
          'star-rail',
          'session',
          'snapshot',
          sessionId,
        ]);
      }
      break;
    }
  }
}
