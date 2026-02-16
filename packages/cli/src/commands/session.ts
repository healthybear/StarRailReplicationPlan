import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { getSessionManager } from '../services/session-manager.js';

export const sessionCommand = new Command('session').description('会话管理');

/**
 * 列出所有会话
 *
 * 注意：此函数被导出是为了解决 Commander.js 的一个已知问题：
 * 当同一个 Command 实例多次调用 parseAsync() 时，会因为内部状态冲突而报错 "unknown command"。
 *
 * 解决方案：将命令的业务逻辑提取为独立函数，在交互式菜单中直接调用函数，
 * 而不是通过 parseAsync() 调用。这样既保持了命令行接口的正常工作，
 * 又避免了交互式菜单中的重复调用问题。
 */
export async function listSessions() {
  const spinner = ora('加载会话列表...').start();
  const sessionManager = getSessionManager();

  try {
    const sessions = await sessionManager.listSessions();
    spinner.stop();

    if (sessions.length === 0) {
      console.log(
        chalk.yellow('暂无会话，使用 `star-rail start -n` 创建新会话')
      );
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan('ID'),
        chalk.cyan('名称'),
        chalk.cyan('创建时间'),
        chalk.cyan('最后保存'),
        chalk.cyan('回合数'),
      ],
      style: { head: [], border: [] },
    });

    for (const session of sessions) {
      table.push([
        session.id,
        session.name,
        formatDate(session.createdAt),
        formatDate(session.lastSaved),
        String(session.turnCount),
      ]);
    }

    console.log(table.toString());
    console.log(chalk.gray(`\n共 ${sessions.length} 个会话`));
  } catch (error) {
    spinner.fail(`加载失败: ${(error as Error).message}`);
  }
}

// 列出所有会话
sessionCommand
  .command('list')
  .alias('ls')
  .description('列出所有会话')
  .action(listSessions);

/**
 * 删除会话
 * @param sessionId 会话 ID
 * @param force 是否强制删除（跳过确认）
 *
 * 注意：导出此函数以供交互式菜单直接调用，避免 Commander parseAsync 重复调用问题
 */
export async function deleteSession(sessionId: string, force = false) {
  const sessionManager = getSessionManager();

  if (!force) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.red(`确定要删除会话 ${sessionId} 吗？此操作不可恢复。`),
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.gray('已取消'));
      return;
    }
  }

  const spinner = ora('删除会话中...').start();

  try {
    await sessionManager.deleteSession(sessionId);
    spinner.succeed(`会话 ${sessionId} 已删除`);
  } catch (error) {
    spinner.fail(`删除失败: ${(error as Error).message}`);
  }
}

// 删除会话
sessionCommand
  .command('delete <sessionId>')
  .alias('rm')
  .description('删除指定会话')
  .option('-f, --force', '强制删除，不确认')
  .action(async (sessionId: string, options) => {
    await deleteSession(sessionId, options.force);
  });

/**
 * 显示会话详细信息
 * @param sessionId 会话 ID
 *
 * 注意：导出此函数以供交互式菜单直接调用，避免 Commander parseAsync 重复调用问题
 */
export async function showSessionInfo(sessionId: string) {
  const spinner = ora('加载会话...').start();
  const sessionManager = getSessionManager();

  try {
    const session = await sessionManager.loadSession(sessionId);
    spinner.stop();

    if (!session) {
      console.log(chalk.red(`会话 ${sessionId} 不存在`));
      return;
    }

    console.log(chalk.cyan('\n═══ 会话信息 ═══\n'));
    console.log(`${chalk.bold('ID:')} ${session.metadata.sessionId}`);
    console.log(`${chalk.bold('名称:')} ${session.metadata.sessionName}`);
    console.log(`${chalk.bold('版本:')} ${session.metadata.version}`);
    console.log(
      `${chalk.bold('创建时间:')} ${formatDate(session.metadata.createdAt)}`
    );
    console.log(
      `${chalk.bold('最后保存:')} ${formatDate(session.metadata.lastSaved)}`
    );

    console.log(chalk.cyan('\n═══ 世界状态 ═══\n'));
    console.log(
      `${chalk.bold('当前场景:')} ${session.worldState.currentSceneId}`
    );
    console.log(
      `${chalk.bold('当前回合:')} ${session.worldState.timeline.currentTurn}`
    );
    console.log(
      `${chalk.bold('事件数量:')} ${session.worldState.eventChain.length}`
    );

    console.log(chalk.cyan('\n═══ 人物 ═══\n'));
    const characters = Object.values(session.characters);
    if (characters.length === 0) {
      console.log(chalk.gray('暂无人物'));
    } else {
      for (const char of characters) {
        console.log(`  - ${char.name} (${char.id})`);
      }
    }

    console.log(chalk.cyan('\n═══ 信息库 ═══\n'));
    console.log(
      `${chalk.bold('全局信息数:')} ${session.information.global.length}`
    );
  } catch (error) {
    spinner.fail(`加载失败: ${(error as Error).message}`);
  }
}

// 查看会话详情
sessionCommand
  .command('info <sessionId>')
  .description('查看会话详情')
  .action(showSessionInfo);

/**
 * 创建会话快照
 * @param sessionId 会话 ID
 * @param description 快照描述（可选）
 *
 * 注意：导出此函数以供交互式菜单直接调用，避免 Commander parseAsync 重复调用问题
 */
export async function createSnapshot(sessionId: string, description?: string) {
  const spinner = ora('创建快照中...').start();
  const sessionManager = getSessionManager();

  try {
    const snapshotId = await sessionManager.createSnapshot(
      sessionId,
      description || `快照_${new Date().toLocaleTimeString('zh-CN')}`
    );
    spinner.succeed(`快照创建成功: ${snapshotId}`);
  } catch (error) {
    spinner.fail(`创建快照失败: ${(error as Error).message}`);
  }
}

// 创建快照
sessionCommand
  .command('snapshot <sessionId>')
  .description('为会话创建快照')
  .option('-d, --description <desc>', '快照描述')
  .action(async (sessionId: string, options) => {
    await createSnapshot(sessionId, options.description);
  });

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN');
}
