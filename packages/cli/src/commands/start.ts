import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { showSessionWorkspace } from '../ui/session-workspace.js';
import { getSessionManager } from '../services/session-manager.js';

export const startCommand = new Command('start')
  .description('启动新会话或继续现有会话')
  .option('-n, --new', '直接创建新会话')
  .option('-c, --continue <sessionId>', '继续指定会话')
  .action(async (options) => {
    const sessionManager = getSessionManager();

    if (options.new) {
      // 直接创建新会话
      await createNewSession(sessionManager);
      return;
    }

    if (options.continue) {
      // 继续指定会话
      await continueSession(sessionManager, options.continue);
      return;
    }

    // 交互式选择
    const spinner = ora('加载会话列表...').start();
    const sessions = await sessionManager.listSessions();
    spinner.succeed('会话列表加载完成');

    const choices = [{ name: chalk.green('+ 创建新会话'), value: 'new' }];

    if (sessions.length > 0) {
      choices.push(
        new inquirer.Separator('─── 现有会话 ───'),
        ...sessions.map((s) => ({
          name: `${s.name} ${chalk.gray(`(${s.id})`)} - ${chalk.dim(formatDate(s.lastSaved))}`,
          value: s.id,
        }))
      );
    }

    choices.push(new inquirer.Separator(), {
      name: chalk.red('退出'),
      value: 'exit',
    });

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '请选择操作：',
        choices,
      },
    ]);

    if (action === 'new') {
      await createNewSession(sessionManager);
    } else if (action === 'exit') {
      console.log(chalk.gray('再见！'));
      process.exit(0);
    } else {
      await continueSession(sessionManager, action);
    }
  });

async function createNewSession(
  sessionManager: ReturnType<typeof getSessionManager>
) {
  const { sessionName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'sessionName',
      message: '请输入会话名称：',
      default: `会话_${new Date().toLocaleDateString('zh-CN')}`,
      validate: (input: string) =>
        input.trim().length > 0 || '会话名称不能为空',
    },
  ]);

  const spinner = ora('创建会话中...').start();

  try {
    const session = await sessionManager.createSession(sessionName.trim());
    spinner.succeed(`会话 "${session.metadata.sessionName}" 创建成功`);
    await showSessionWorkspace(session);
  } catch (error) {
    spinner.fail(`创建会话失败: ${(error as Error).message}`);
  }
}

async function continueSession(
  sessionManager: ReturnType<typeof getSessionManager>,
  sessionId: string
) {
  const spinner = ora('加载会话中...').start();

  try {
    const session = await sessionManager.loadSession(sessionId);
    if (!session) {
      spinner.fail(`会话 ${sessionId} 不存在`);
      return;
    }
    spinner.succeed(`会话 "${session.metadata.sessionName}" 加载成功`);
    await showSessionWorkspace(session);
  } catch (error) {
    spinner.fail(`加载会话失败: ${(error as Error).message}`);
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
