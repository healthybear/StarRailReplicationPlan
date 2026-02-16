import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getExportService } from '../services/export-service.js';
import { getSessionManager } from '../services/session-manager.js';
import type { ConflictStrategy } from '@star-rail/core';

/**
 * 导入命令的主逻辑
 *
 * 注意：此函数被导出是为了解决 Commander.js 的重复调用问题。
 * 详见 session.ts 中的注释说明。
 */
export async function handleImport(
  filePath?: string,
  options: { session?: string; strategy?: string } = {}
) {
  const exportService = getExportService();
  const sessionManager = getSessionManager();

  // 如果没有指定文件路径，列出可导入的文件
  if (!filePath) {
    const characterExports = await exportService.listExports('character');
    const sceneExports = await exportService.listExports('scene');
    const sessionExports = await exportService.listExports('session');

    const allExports = [
      ...sessionExports.map((e) => ({ ...e, type: 'session' as const })),
      ...characterExports.map((e) => ({ ...e, type: 'character' as const })),
      ...sceneExports.map((e) => ({ ...e, type: 'scene' as const })),
    ];

    if (allExports.length === 0) {
      console.log(chalk.yellow('暂无可导入的文件'));
      return;
    }

    const { selectedFile } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFile',
        message: '请选择要导入的文件：',
        choices: [
          ...allExports.map((e) => ({
            name: `[${e.type}] ${e.filename}`,
            value: { path: e.path, type: e.type },
          })),
          new inquirer.Separator(),
          {
            name: chalk.red('取消'),
            value: { path: 'cancel', type: 'cancel' },
          },
        ],
      },
    ]);

    if (selectedFile.path === 'cancel') {
      return;
    }

    filePath = selectedFile.path;

    // 如果是会话导入，直接处理
    if (selectedFile.type === 'session') {
      await handleSessionImport(
        filePath,
        exportService,
        sessionManager,
        options.strategy
      );
      return;
    }
  }

  // 验证文件
  const spinner = ora('验证文件...').start();
  const validation = await exportService.validateExportPackage(filePath);
  spinner.stop();

  if (!validation.valid) {
    console.log(chalk.red('文件验证失败:'));
    for (const error of validation.errors) {
      console.log(chalk.red(`  • ${error}`));
    }
    return;
  }

  // 检查是否是会话导出
  if (validation.metadata?.type === 'session') {
    await handleSessionImport(
      filePath,
      exportService,
      sessionManager,
      options.strategy
    );
    return;
  }

  // 获取目标会话（用于人物/场景导入）
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
        message: '请选择目标会话：',
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

  // 尝试导入
  const importSpinner = ora('导入中...').start();

  try {
    // 先尝试作为人物导入
    const charResult = await exportService.importCharacter(filePath);
    if (charResult.success && charResult.data) {
      // 检查冲突
      const conflicts = exportService.detectCharacterConflicts(
        charResult.data,
        session.characters
      );

      if (conflicts.length > 0) {
        importSpinner.stop();
        console.log(chalk.yellow('\n检测到冲突:'));
        for (const conflict of conflicts) {
          console.log(chalk.yellow(`  • ${conflict.description}`));
        }

        const { strategy } = await inquirer.prompt([
          {
            type: 'list',
            name: 'strategy',
            message: '请选择处理方式：',
            choices: [
              { name: '覆盖现有数据', value: 'overwrite' },
              { name: '重命名导入数据', value: 'rename' },
              { name: '取消导入', value: 'reject' },
            ],
          },
        ]);

        if (strategy === 'reject') {
          console.log(chalk.gray('已取消导入'));
          return;
        }

        if (strategy === 'rename') {
          const { newId } = await inquirer.prompt([
            {
              type: 'input',
              name: 'newId',
              message: '请输入新的人物 ID：',
              default: `${charResult.data.id}_imported`,
            },
          ]);
          charResult.data.id = newId;
        }

        importSpinner.start('导入中...');
      }

      session.characters[charResult.data.id] = charResult.data;
      await sessionManager.saveSession(session);
      importSpinner.succeed(`人物 "${charResult.data.name}" 导入成功`);
      return;
    }

    // 尝试作为场景导入
    const sceneResult = await exportService.importScene(filePath);
    if (sceneResult.success && sceneResult.data) {
      importSpinner.succeed(`场景 "${sceneResult.data.name}" 导入成功`);
      return;
    }

    importSpinner.fail('导入失败：无法识别文件格式');
  } catch (error) {
    importSpinner.fail(`导入失败: ${(error as Error).message}`);
  }
}

export const importCommand = new Command('import')
  .description('导入人物、场景或会话')
  .argument('[filePath]', '导入文件路径')
  .option('-s, --session <sessionId>', '导入到指定会话')
  .option(
    '--strategy <strategy>',
    '冲突处理策略 (reject/overwrite/rename)',
    'reject'
  )
  .action(handleImport);

/**
 * 处理会话导入
 */
async function handleSessionImport(
  filePath: string,
  exportService: ReturnType<typeof getExportService>,
  sessionManager: ReturnType<typeof getSessionManager>,
  strategyOption: string
): Promise<void> {
  const spinner = ora('导入会话...').start();

  try {
    // 读取元数据
    const metadata = await exportService.readExportMetadata(filePath);
    spinner.stop();

    if (metadata) {
      console.log(chalk.cyan('\n会话信息:'));
      console.log(`  名称: ${metadata.name || '未知'}`);
      console.log(
        `  导出时间: ${new Date(metadata.exportedAt).toLocaleString('zh-CN')}`
      );
      console.log(`  版本: ${metadata.version}`);
      console.log();
    }

    // 检查是否存在同名会话
    const sessions = await sessionManager.listSessions();
    const existingSession = sessions.find((s) => s.name === metadata?.name);

    let strategy: ConflictStrategy = strategyOption as ConflictStrategy;

    if (existingSession) {
      console.log(
        chalk.yellow(
          `检测到同名会话: ${existingSession.name} (${existingSession.id})`
        )
      );

      const { selectedStrategy } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedStrategy',
          message: '请选择处理方式：',
          choices: [
            { name: '覆盖现有会话', value: 'overwrite' },
            { name: '创建新会话（重命名）', value: 'rename' },
            { name: '取消导入', value: 'reject' },
          ],
        },
      ]);

      strategy = selectedStrategy;

      if (strategy === 'reject') {
        console.log(chalk.gray('已取消导入'));
        return;
      }
    }

    spinner.start('导入中...');
    const result = await exportService.importSession(filePath, {
      conflictStrategy: strategy,
    });

    if (result.success && result.data) {
      // 保存导入的会话
      await sessionManager.saveSession(result.data);
      spinner.succeed(`会话 "${result.data.metadata.sessionName}" 导入成功`);

      if (result.warnings && result.warnings.length > 0) {
        console.log(chalk.yellow('\n警告:'));
        for (const warning of result.warnings) {
          console.log(chalk.yellow(`  • ${warning}`));
        }
      }
    } else {
      spinner.fail('导入失败');
      if (result.errors) {
        for (const error of result.errors) {
          console.log(chalk.red(`  • ${error}`));
        }
      }
    }
  } catch (error) {
    spinner.fail(`导入失败: ${(error as Error).message}`);
  }
}
