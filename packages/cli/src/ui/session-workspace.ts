import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import boxen from 'boxen';
import type { SessionState } from '@star-rail/types';
import { getSessionManager } from '../services/session-manager.js';

/**
 * 会话工作区
 * 剧情推进的主要交互界面
 */
export async function showSessionWorkspace(
  session: SessionState
): Promise<void> {
  const sessionManager = getSessionManager();

  // 显示会话信息
  displaySessionHeader(session);

  // 主循环
  while (true) {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: chalk.cyan('▶'),
        prefix: '',
      },
    ]);

    const trimmedInput = input.trim();

    // 处理命令
    if (trimmedInput.startsWith('/')) {
      const shouldExit = await handleCommand(
        trimmedInput,
        session,
        sessionManager
      );
      if (shouldExit) {
        break;
      }
      continue;
    }

    // 空输入
    if (!trimmedInput) {
      continue;
    }

    // 处理剧情输入
    await handleStoryInput(trimmedInput, session, sessionManager);
  }
}

/**
 * 显示会话头部信息
 */
function displaySessionHeader(session: SessionState): void {
  const header = boxen(
    chalk.bold(session.metadata.sessionName) +
      '\n' +
      chalk.gray(`场景: ${session.worldState.currentSceneId}`) +
      '  ' +
      chalk.gray(`回合: ${session.worldState.timeline.currentTurn}`),
    {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderStyle: 'single',
      borderColor: 'cyan',
    }
  );

  console.log(header);
  console.log(chalk.gray('输入 /help 查看可用命令\n'));
}

/**
 * 处理命令
 */
async function handleCommand(
  input: string,
  session: SessionState,
  sessionManager: ReturnType<typeof getSessionManager>
): Promise<boolean> {
  const [command, ...args] = input.slice(1).split(' ');

  switch (command.toLowerCase()) {
    case 'help':
    case 'h':
      showHelp();
      return false;

    case 'status':
    case 's':
      showStatus(session);
      return false;

    case 'characters':
    case 'chars':
      showCharacters(session);
      return false;

    case 'events':
      showRecentEvents(session);
      return false;

    case 'save':
      await saveSession(session, sessionManager);
      return false;

    case 'snapshot':
      await createSnapshot(session, sessionManager, args.join(' '));
      return false;

    case 'quit':
    case 'exit':
    case 'q':
      await confirmExit(session, sessionManager);
      return true;

    default:
      console.log(chalk.yellow(`未知命令: ${command}`));
      console.log(chalk.gray('输入 /help 查看可用命令'));
      return false;
  }
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(chalk.cyan('\n═══ 可用命令 ═══\n'));
  console.log('  /help, /h        显示帮助信息');
  console.log('  /status, /s      显示当前状态');
  console.log('  /characters      显示人物列表');
  console.log('  /events          显示最近事件');
  console.log('  /save            保存会话');
  console.log('  /snapshot [描述] 创建快照');
  console.log('  /quit, /q        退出会话');
  console.log();
  console.log(chalk.cyan('═══ 输入格式 ═══\n'));
  console.log('  对话型: 对[人物]说：[内容]');
  console.log('  指令型: 让[人物][动作]');
  console.log();
}

/**
 * 显示当前状态
 */
function showStatus(session: SessionState): void {
  console.log(chalk.cyan('\n═══ 当前状态 ═══\n'));
  console.log(`场景: ${session.worldState.currentSceneId}`);
  console.log(`回合: ${session.worldState.timeline.currentTurn}`);
  console.log(`人物数: ${Object.keys(session.characters).length}`);
  console.log(`事件数: ${session.worldState.eventChain.length}`);
  console.log(`信息数: ${session.information.global.length}`);

  const env = session.worldState.environment;
  if (env.physical.weather) {
    console.log(`天气: ${env.physical.weather}`);
  }
  if (env.physical.timeOfDay) {
    console.log(`时间: ${env.physical.timeOfDay}`);
  }
  console.log();
}

/**
 * 显示人物列表
 */
function showCharacters(session: SessionState): void {
  const characters = Object.values(session.characters);

  if (characters.length === 0) {
    console.log(chalk.yellow('\n暂无人物\n'));
    return;
  }

  console.log(chalk.cyan('\n═══ 人物列表 ═══\n'));

  for (const char of characters) {
    console.log(chalk.bold(`  ${char.name}`) + chalk.gray(` (${char.id})`));

    // 显示关系
    const relationships = Object.entries(char.state.relationships);
    if (relationships.length > 0) {
      for (const [targetId, rel] of relationships) {
        console.log(
          chalk.gray(`    → ${targetId}: `) +
            `信任 ${(rel.trust * 100).toFixed(0)}% ` +
            `亲密 ${(rel.intimacy * 100).toFixed(0)}%`
        );
      }
    }
  }
  console.log();
}

/**
 * 显示最近事件
 */
function showRecentEvents(session: SessionState): void {
  const events = session.worldState.eventChain.slice(-10);

  if (events.length === 0) {
    console.log(chalk.yellow('\n暂无事件\n'));
    return;
  }

  console.log(chalk.cyan('\n═══ 最近事件 ═══\n'));

  for (const event of events) {
    const time = new Date(event.timestamp).toLocaleTimeString('zh-CN');
    console.log(
      chalk.gray(`  [${time}]`) +
        ` ${event.description || event.eventId}` +
        chalk.gray(` @ ${event.sceneId}`)
    );
  }
  console.log();
}

/**
 * 保存会话
 */
async function saveSession(
  session: SessionState,
  sessionManager: ReturnType<typeof getSessionManager>
): Promise<void> {
  const spinner = ora('保存中...').start();
  try {
    await sessionManager.saveSession(session);
    spinner.succeed('会话已保存');
  } catch (error) {
    spinner.fail(`保存失败: ${(error as Error).message}`);
  }
}

/**
 * 创建快照
 */
async function createSnapshot(
  session: SessionState,
  sessionManager: ReturnType<typeof getSessionManager>,
  description: string
): Promise<void> {
  const spinner = ora('创建快照中...').start();
  try {
    const snapshotId = await sessionManager.createSnapshot(
      session.metadata.sessionId,
      description || `快照_${new Date().toLocaleTimeString('zh-CN')}`
    );
    spinner.succeed(`快照已创建: ${snapshotId}`);
  } catch (error) {
    spinner.fail(`创建快照失败: ${(error as Error).message}`);
  }
}

/**
 * 确认退出
 */
async function confirmExit(
  session: SessionState,
  sessionManager: ReturnType<typeof getSessionManager>
): Promise<void> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '退出前是否保存？',
      choices: [
        { name: '保存并退出', value: 'save' },
        { name: '直接退出', value: 'exit' },
        { name: '取消', value: 'cancel' },
      ],
    },
  ]);

  if (action === 'save') {
    await saveSession(session, sessionManager);
  }

  if (action !== 'cancel') {
    console.log(chalk.gray('\n再见！\n'));
  }
}

/**
 * 处理剧情输入
 */
async function handleStoryInput(
  input: string,
  session: SessionState,
  _sessionManager: ReturnType<typeof getSessionManager>
): Promise<void> {
  // TODO: 集成 StoryOrchestrator 进行剧情推进
  // 目前只是占位实现

  const spinner = ora('处理中...').start();

  // 模拟处理延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  spinner.stop();

  console.log(chalk.yellow('\n[系统] 剧情推进功能开发中...\n'));
  console.log(chalk.gray(`收到输入: ${input}`));
  console.log(chalk.gray('请等待后续版本更新\n'));

  // 自动保存
  session.metadata.lastSaved = Date.now();
}
