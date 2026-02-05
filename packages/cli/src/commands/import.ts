import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getExportService } from '../services/export-service.js';
import { getSessionManager } from '../services/session-manager.js';

export const importCommand = new Command('import')
  .description('导入人物或场景配置')
  .argument('[filePath]', '导入文件路径')
  .option('-s, --session <sessionId>', '导入到指定会话')
  .action(async (filePath, options) => {
    const exportService = getExportService();
    const sessionManager = getSessionManager();

    // 如果没有指定文件路径，列出可导入的文件
    if (!filePath) {
      const characterExports = await exportService.listExports('character');
      const sceneExports = await exportService.listExports('scene');

      const allExports = [
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
              value: e.path,
            })),
            new inquirer.Separator(),
            { name: chalk.red('取消'), value: 'cancel' },
          ],
        },
      ]);

      if (selectedFile === 'cancel') {
        return;
      }

      filePath = selectedFile;
    }

    // 获取目标会话
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
    const spinner = ora('导入中...').start();

    try {
      // 先尝试作为人物导入
      const charResult = await exportService.importCharacter(filePath);
      if (charResult.success && charResult.data) {
        // 检查是否已存在
        if (session.characters[charResult.data.id]) {
          spinner.stop();
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: chalk.yellow(
                `人物 "${charResult.data.name}" 已存在，是否覆盖？`
              ),
              default: false,
            },
          ]);

          if (!overwrite) {
            console.log(chalk.gray('已取消导入'));
            return;
          }
          spinner.start('导入中...');
        }

        session.characters[charResult.data.id] = charResult.data;
        await sessionManager.saveSession(session);
        spinner.succeed(`人物 "${charResult.data.name}" 导入成功`);
        return;
      }

      // 尝试作为场景导入
      const sceneResult = await exportService.importScene(filePath);
      if (sceneResult.success && sceneResult.data) {
        spinner.succeed(`场景 "${sceneResult.data.name}" 导入成功`);
        return;
      }

      spinner.fail('导入失败：无法识别文件格式');
    } catch (error) {
      spinner.fail(`导入失败: ${(error as Error).message}`);
    }
  });
