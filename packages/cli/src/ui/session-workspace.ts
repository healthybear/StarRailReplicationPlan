import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import boxen from 'boxen';
import type {
  SessionState,
  SceneConfig,
  ComparisonResult,
} from '@star-rail/types';
import { EnvLoader } from '@star-rail/infrastructure';
import { getSessionManager } from '../services/session-manager.js';
import { getStoryService } from '../services/story-service.js';

/**
 * 会话工作区
 * 剧情推进的主要交互界面
 */
export async function showSessionWorkspace(
  session: SessionState
): Promise<void> {
  const sessionManager = getSessionManager();
  const storyService = getStoryService();

  // 初始化剧情服务（如果尚未初始化）
  if (!storyService.isInitialized()) {
    // 使用 DeepSeek 配置
    const apiKey = EnvLoader.getOptional('DEEPSEEK_API_KEY');

    if (!apiKey) {
      console.log(chalk.red('\n错误: 未设置 DEEPSEEK_API_KEY'));
      console.log(chalk.gray('请在 .env 文件中设置 DEEPSEEK_API_KEY\n'));
      return;
    }

    storyService.initialize({
      provider: 'deepseek',
      model: 'deepseek-chat',
      baseURL: 'https://api.deepseek.com',
    });
  }

  // 初始化会话
  storyService.initializeSession(session);

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
  const storyService = getStoryService();

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

    case 'anchor':
      await handleAnchorCommand(session, storyService, args);
      return false;

    case 'compare':
      await handleCompareCommand(session, storyService, args);
      return false;

    case 'vision':
      await showVisionStatus(session);
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
  console.log('  /anchor          锚点管理');
  console.log('  /compare         对比当前状态与锚点');
  console.log('  /vision          显示视野隔离状态');
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
  sessionManager: ReturnType<typeof getSessionManager>
): Promise<void> {
  const storyService = getStoryService();
  const spinner = ora('处理中...').start();

  try {
    // 创建默认场景配置
    const scene: SceneConfig = {
      id: session.worldState.currentSceneId,
      name: '当前场景',
      description: '当前场景描述',
      participants: Object.keys(session.characters),
      environment: session.worldState.environment,
    };

    // 调用 StoryOrchestrator 推进剧情
    const result = await storyService.advance(session, input, scene);

    spinner.stop();

    if (!result.success) {
      console.log(chalk.red(`\n[错误] ${result.error}\n`));
      return;
    }

    // 显示角色响应
    for (const response of result.responses) {
      displayCharacterResponse(response, session);
    }

    // 显示状态变更
    if (result.stateChanges && result.stateChanges.length > 0) {
      console.log(chalk.gray('\n[状态变更]'));
      for (const change of result.stateChanges) {
        const char = session.characters[change.characterId];
        const charName = char?.name || change.characterId;
        const oldPercent = (change.oldValue * 100).toFixed(0);
        const newPercent = (change.newValue * 100).toFixed(0);
        const arrow = change.newValue > change.oldValue ? '↑' : '↓';
        console.log(
          chalk.gray(
            `  ${charName} ${change.target}: ${oldPercent}% ${arrow} ${newPercent}%`
          )
        );
      }
    }

    console.log();

    // 自动保存
    await sessionManager.saveSession(session);
  } catch (error) {
    spinner.stop();
    console.log(chalk.red(`\n[错误] ${(error as Error).message}\n`));
  }
}

/**
 * 显示角色响应
 */
function displayCharacterResponse(
  response: {
    characterId: string;
    parsed?: { dialogue?: string; action?: string; innerThought?: string };
  },
  session: SessionState
): void {
  const char = session.characters[response.characterId];
  const charName = char?.name || response.characterId;

  if (response.parsed?.dialogue) {
    console.log(
      chalk.cyan(`\n${charName}：`) + chalk.white(response.parsed.dialogue)
    );
  }

  if (response.parsed?.action) {
    console.log(chalk.gray(`  [${charName} ${response.parsed.action}]`));
  }

  if (response.parsed?.innerThought) {
    console.log(
      chalk.gray(`  (${charName}心想：${response.parsed.innerThought})`)
    );
  }
}

/**
 * 处理锚点命令
 */
async function handleAnchorCommand(
  session: SessionState,
  storyService: ReturnType<typeof getStoryService>,
  args: string[]
): Promise<void> {
  const subCommand = args[0]?.toLowerCase();

  switch (subCommand) {
    case 'create': {
      // 创建锚点
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: '锚点名称：',
          default: `锚点_${new Date().toLocaleTimeString('zh-CN')}`,
        },
      ]);

      const { storylineId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'storylineId',
          message: '剧情线 ID：',
          default: 'main',
        },
      ]);

      const { plotDescription } = await inquirer.prompt([
        {
          type: 'input',
          name: 'plotDescription',
          message: '情节描述：',
          default: '当前剧情节点',
        },
      ]);

      const anchors = storyService.getAnchorsByStoryline(storylineId);
      const sequence = anchors.length + 1;

      const anchor = storyService.createAnchorFromSession(session, {
        name,
        nodeId: `node_${Date.now()}`,
        storylineId,
        sequence,
        plotDescription,
      });

      console.log(chalk.green(`\n锚点已创建: ${anchor.id}`));
      console.log(chalk.gray(`  名称: ${anchor.name}`));
      console.log(chalk.gray(`  剧情线: ${anchor.storylineId}`));
      console.log(chalk.gray(`  顺序: ${anchor.sequence}`));
      console.log(chalk.gray(`  人物数: ${anchor.characters.length}`));
      console.log();
      break;
    }

    case 'list': {
      // 列出锚点
      const anchors = storyService.getAllAnchors();
      if (anchors.length === 0) {
        console.log(chalk.yellow('\n暂无锚点\n'));
        return;
      }

      console.log(chalk.cyan('\n═══ 锚点列表 ═══\n'));
      for (const anchor of anchors) {
        console.log(
          chalk.bold(`  ${anchor.name}`) + chalk.gray(` (${anchor.id})`)
        );
        console.log(
          chalk.gray(`    剧情线: ${anchor.storylineId} #${anchor.sequence}`)
        );
        console.log(chalk.gray(`    人物数: ${anchor.characters.length}`));
      }
      console.log();
      break;
    }

    case 'delete': {
      // 删除锚点
      const anchors = storyService.getAllAnchors();
      if (anchors.length === 0) {
        console.log(chalk.yellow('\n暂无锚点\n'));
        return;
      }

      const { anchorId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'anchorId',
          message: '选择要删除的锚点：',
          choices: anchors.map((a) => ({
            name: `${a.name} (${a.storylineId} #${a.sequence})`,
            value: a.id,
          })),
        },
      ]);

      const result = storyService.removeAnchor(anchorId);
      if (result) {
        console.log(chalk.green('\n锚点已删除\n'));
      } else {
        console.log(chalk.red('\n删除失败\n'));
      }
      break;
    }

    default:
      console.log(chalk.cyan('\n═══ 锚点命令 ═══\n'));
      console.log('  /anchor create   创建锚点');
      console.log('  /anchor list     列出锚点');
      console.log('  /anchor delete   删除锚点');
      console.log();
  }
}

/**
 * 处理对比命令
 */
async function handleCompareCommand(
  session: SessionState,
  storyService: ReturnType<typeof getStoryService>,
  _args: string[]
): Promise<void> {
  const anchors = storyService.getAllAnchors();

  if (anchors.length === 0) {
    console.log(chalk.yellow('\n暂无锚点，请先创建锚点\n'));
    console.log(chalk.gray('使用 /anchor create 创建锚点'));
    return;
  }

  // 选择锚点
  const { anchorId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'anchorId',
      message: '选择要对比的锚点：',
      choices: anchors.map((a) => ({
        name: `${a.name} (${a.storylineId} #${a.sequence})`,
        value: a.id,
      })),
    },
  ]);

  const anchor = storyService.getAnchor(anchorId);
  if (!anchor) {
    console.log(chalk.red('\n锚点不存在\n'));
    return;
  }

  const spinner = ora('对比中...').start();
  const result = storyService.compare(session, anchor);
  spinner.stop();

  displayComparisonResult(result, anchor.name);
}

/**
 * 显示对比结果
 */
function displayComparisonResult(
  result: ComparisonResult,
  anchorName: string
): void {
  const divergencePercent = (result.overallDivergence * 100).toFixed(1);
  const divergenceColor =
    result.overallDivergence < 0.2
      ? chalk.green
      : result.overallDivergence < 0.5
        ? chalk.yellow
        : chalk.red;

  console.log(chalk.cyan(`\n═══ 对比结果: ${anchorName} ═══\n`));
  console.log(`总体差异度: ${divergenceColor(divergencePercent + '%')}`);
  console.log(`评估: ${result.overallAssessment}`);

  if (result.differences.length > 0) {
    console.log(chalk.cyan('\n差异详情:'));
    for (const diff of result.differences) {
      console.log(chalk.yellow(`  • ${diff}`));
    }
  }

  if (result.dimensions.length > 0) {
    console.log(chalk.cyan('\n维度对比:'));
    for (const dim of result.dimensions) {
      const dimDivergence = (dim.divergence * 100).toFixed(1);
      console.log(chalk.gray(`  ${dim.name}:`));
      console.log(chalk.gray(`    原值: ${dim.originalValue}`));
      console.log(chalk.gray(`    现值: ${dim.currentValue}`));
      console.log(
        chalk.gray(`    差异: ${dim.difference} (${dimDivergence}%)`)
      );
    }
  }

  console.log();
}

/**
 * 显示视野隔离状态
 * P1-UI-02: 视野隔离验收
 */
async function showVisionStatus(session: SessionState): Promise<void> {
  const characters = Object.values(session.characters);

  if (characters.length === 0) {
    console.log(chalk.yellow('\n暂无人物\n'));
    return;
  }

  console.log(chalk.cyan('\n═══ 视野隔离状态 ═══\n'));

  // 收集所有信息
  const allInfoIds = new Set<string>();
  for (const char of characters) {
    for (const known of char.state.knownInformation) {
      allInfoIds.add(known.informationId);
    }
  }

  // 显示每个角色的已知信息
  for (const char of characters) {
    const knownIds = new Set(
      char.state.knownInformation.map((k) => k.informationId)
    );

    console.log(chalk.bold(`  ${char.name}`) + chalk.gray(` (${char.id})`));
    console.log(chalk.gray(`    已知信息: ${knownIds.size} 条`));

    if (knownIds.size > 0) {
      for (const infoId of knownIds) {
        const info = session.information.global.find((i) => i.id === infoId);
        const infoName = info?.content?.substring(0, 30) || infoId;
        console.log(chalk.green(`      ✓ ${infoName}`));
      }
    }

    // 显示该角色不知道的信息
    const unknownIds = [...allInfoIds].filter((id) => !knownIds.has(id));
    if (unknownIds.length > 0) {
      console.log(chalk.gray(`    未知信息: ${unknownIds.length} 条`));
      for (const infoId of unknownIds) {
        const info = session.information.global.find((i) => i.id === infoId);
        const infoName = info?.content?.substring(0, 30) || infoId;
        console.log(chalk.red(`      ✗ ${infoName}`));
      }
    }

    console.log();
  }

  // 视野隔离验证
  if (characters.length >= 2) {
    console.log(chalk.cyan('═══ 视野隔离验证 ═══\n'));

    // 找出只有部分角色知道的信息
    const exclusiveInfo: Array<{
      infoId: string;
      knownBy: string[];
      unknownBy: string[];
    }> = [];

    for (const infoId of allInfoIds) {
      const knownBy: string[] = [];
      const unknownBy: string[] = [];

      for (const char of characters) {
        const knows = char.state.knownInformation.some(
          (k) => k.informationId === infoId
        );
        if (knows) {
          knownBy.push(char.name);
        } else {
          unknownBy.push(char.name);
        }
      }

      if (knownBy.length > 0 && unknownBy.length > 0) {
        exclusiveInfo.push({ infoId, knownBy, unknownBy });
      }
    }

    if (exclusiveInfo.length > 0) {
      console.log(chalk.green('  ✓ 存在视野隔离的信息:\n'));
      for (const item of exclusiveInfo) {
        const info = session.information.global.find(
          (i) => i.id === item.infoId
        );
        const infoName = info?.content?.substring(0, 40) || item.infoId;
        console.log(chalk.white(`    "${infoName}"`));
        console.log(chalk.green(`      知道: ${item.knownBy.join(', ')}`));
        console.log(chalk.red(`      不知道: ${item.unknownBy.join(', ')}`));
        console.log();
      }
    } else {
      console.log(
        chalk.yellow('  暂无视野隔离的信息（所有角色知道相同的信息）\n')
      );
    }
  }
}
