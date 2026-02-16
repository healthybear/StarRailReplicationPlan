import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getExportService } from '../services/export-service.js';
import { getSessionManager } from '../services/session-manager.js';

/**
 * 导出命令的主逻辑
 *
 * 注意：此函数被导出是为了解决 Commander.js 的重复调用问题。
 * 详见 session.ts 中的注释说明。
 */
export async function handleExport(
  type?: string,
  id?: string,
  options: { session?: string; output?: string } = {}
) {
  const exportService = getExportService();
  const sessionManager = getSessionManager();

  // 如果没有指定类型，进入交互模式
  if (!type) {
    const { exportType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'exportType',
        message: '请选择导出类型：',
        choices: [
          { name: '人物配置', value: 'character' },
          { name: '场景配置', value: 'scene' },
          { name: '完整会话', value: 'session' },
          { name: '取消', value: 'cancel' },
        ],
      },
    ]);

    if (exportType === 'cancel') {
      return;
    }

    type = exportType;
  }

  // 会话导出
  if (type === 'session') {
    const sessions = await sessionManager.listSessions();
    if (sessions.length === 0) {
      console.log(chalk.yellow('暂无会话'));
      return;
    }

    let sessionId = options.session || id;
    if (!sessionId) {
      const { selectedSession } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedSession',
          message: '请选择要导出的会话：',
          choices: sessions.map((s) => ({
            name: `${s.name} (${s.id}) - 回合 ${s.turnCount}`,
            value: s.id,
          })),
        },
      ]);
      sessionId = selectedSession;
    }

    const session = await sessionManager.loadSession(sessionId);
    if (!session) {
      console.log(chalk.red(`会话 ${sessionId} 不存在`));
      return;
    }

    const spinner = ora('导出中...').start();
    try {
      const filePath = await exportService.exportSession(
        session,
        options.output
      );
      spinner.succeed(
        `会话 "${session.metadata.sessionName}" 已导出到: ${filePath}`
      );
    } catch (error) {
      spinner.fail(`导出失败: ${(error as Error).message}`);
    }
    return;
  }

  // 获取会话（用于人物/场景导出）
  let sessionId = options.session;
  if (!sessionId) {
    const sessions = await sessionManager.listSessions();
    if (sessions.length === 0) {
      console.log(chalk.yellow('暂无会话，请先创建会话'));
      return;
    }

    const { selectedSession } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedSession',
        message: '请选择会话：',
        choices: sessions.map((s) => ({
          name: `${s.name} (${s.id})`,
          value: s.id,
        })),
      },
    ]);

    sessionId = selectedSession;
  }

  const session = await sessionManager.loadSession(sessionId);
  if (!session) {
    console.log(chalk.red(`会话 ${sessionId} 不存在`));
    return;
  }

  // 根据类型导出
  if (type === 'character') {
    const characters = Object.values(session.characters);
    if (characters.length === 0) {
      console.log(chalk.yellow('该会话暂无人物'));
      return;
    }

    let characterId = id;
    if (!characterId) {
      const { selectedChar } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedChar',
          message: '请选择要导出的人物：',
          choices: characters.map((c) => ({
            name: `${c.name} (${c.id})`,
            value: c.id,
          })),
        },
      ]);
      characterId = selectedChar;
    }

    const character = session.characters[characterId];
    if (!character) {
      console.log(chalk.red(`人物 ${characterId} 不存在`));
      return;
    }

    const spinner = ora('导出中...').start();
    try {
      const filePath = await exportService.exportCharacter(
        character,
        options.output
      );
      spinner.succeed(`人物 "${character.name}" 已导出到: ${filePath}`);
    } catch (error) {
      spinner.fail(`导出失败: ${(error as Error).message}`);
    }
  } else if (type === 'scene') {
    console.log(chalk.yellow('场景导出功能开发中...'));
  } else {
    console.log(chalk.red(`未知的导出类型: ${type}`));
  }
}

export const exportCommand = new Command('export')
  .description('导出人物、场景或会话')
  .argument('[type]', '导出类型 (character/scene/session)')
  .argument('[id]', '实体 ID')
  .option('-s, --session <sessionId>', '从指定会话导出')
  .option('-o, --output <path>', '输出路径')
  .action(handleExport);
