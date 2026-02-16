import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { EnvLoader } from '@star-rail/infrastructure';

export const configCommand = new Command('config').description('配置管理');

/**
 * 显示当前配置
 *
 * 注意：此函数被导出是为了解决 Commander.js 的重复调用问题。
 * 详见 session.ts 中的注释说明。
 */
export function showConfig() {
  console.log(chalk.cyan('\n═══ 当前配置 ═══\n'));

  // 环境变量
  console.log(chalk.bold('环境变量:'));
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || chalk.gray('未设置')}`);
  console.log(`  LOG_LEVEL: ${process.env.LOG_LEVEL || chalk.gray('未设置')}`);

  // API Keys（脱敏显示）
  console.log(chalk.bold('\nAPI Keys:'));
  const deepseekKey = EnvLoader.getOptional('DEEPSEEK_API_KEY');
  const anthropicKey = EnvLoader.getOptional('ANTHROPIC_API_KEY');

  console.log(
    `  DEEPSEEK_API_KEY: ${deepseekKey ? maskKey(deepseekKey) : chalk.red('未设置')}`
  );
  console.log(
    `  ANTHROPIC_API_KEY: ${anthropicKey ? maskKey(anthropicKey) : chalk.red('未设置')}`
  );

  console.log(chalk.bold('\n配置文件路径:'));
  console.log(`  LLM 配置: ${chalk.gray('./config/llm.yaml')}`);
  console.log(`  人物配置: ${chalk.gray('./config/characters/')}`);
  console.log(`  场景配置: ${chalk.gray('./config/scenes/')}`);
  console.log(`  触发表配置: ${chalk.gray('./config/triggers/')}`);
}

// 查看配置
configCommand.command('show').description('显示当前配置').action(showConfig);

/**
 * 验证配置是否正确
 *
 * 注意：此函数被导出是为了解决 Commander.js 的重复调用问题。
 */
export async function checkConfig() {
  console.log(chalk.cyan('\n═══ 配置检查 ═══\n'));

  let hasError = false;

  // 检查必需的环境变量
  console.log(chalk.bold('检查环境变量...'));

  const deepseekKey = EnvLoader.getOptional('DEEPSEEK_API_KEY');
  const anthropicKey = EnvLoader.getOptional('ANTHROPIC_API_KEY');

  if (!deepseekKey && !anthropicKey) {
    console.log(chalk.red('  ✗ 至少需要设置一个 LLM API Key'));
    hasError = true;
  } else {
    if (deepseekKey) {
      console.log(chalk.green('  ✓ DEEPSEEK_API_KEY 已设置'));
    }
    if (anthropicKey) {
      console.log(chalk.green('  ✓ ANTHROPIC_API_KEY 已设置'));
    }
  }

  // 检查配置文件
  console.log(chalk.bold('\n检查配置文件...'));

  const fs = await import('fs/promises');
  const configFiles = [{ path: './config/llm.yaml', name: 'LLM 配置' }];

  for (const file of configFiles) {
    try {
      await fs.access(file.path);
      console.log(chalk.green(`  ✓ ${file.name} 存在`));
    } catch {
      console.log(chalk.yellow(`  ! ${file.name} 不存在 (${file.path})`));
    }
  }

  // 检查目录
  console.log(chalk.bold('\n检查目录...'));

  const directories = [
    { path: './data/sessions', name: '会话数据目录' },
    { path: './exports', name: '导出目录' },
    { path: './logs', name: '日志目录' },
  ];

  for (const dir of directories) {
    try {
      await fs.access(dir.path);
      console.log(chalk.green(`  ✓ ${dir.name} 存在`));
    } catch {
      console.log(chalk.yellow(`  ! ${dir.name} 不存在，将自动创建`));
    }
  }

  // 总结
  console.log();
  if (hasError) {
    console.log(chalk.red('配置检查未通过，请修复上述问题'));
  } else {
    console.log(chalk.green('配置检查通过'));
  }
}

// 验证配置
configCommand
  .command('check')
  .description('验证配置是否正确')
  .action(checkConfig);

/**
 * 初始化配置文件
 *
 * 注意：此函数被导出是为了解决 Commander.js 的重复调用问题。
 */
export async function initConfig() {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '这将创建默认配置文件，是否继续？',
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray('已取消'));
    return;
  }

  const fs = await import('fs/promises');

  // 创建必要的目录
  const directories = [
    './data/sessions',
    './data/anchors',
    './exports/characters',
    './exports/scenes',
    './logs',
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(chalk.green(`✓ 创建目录: ${dir}`));
    } catch (error) {
      console.log(chalk.yellow(`! 目录已存在: ${dir}`));
    }
  }

  console.log(chalk.green('\n配置初始化完成'));
}

// 初始化配置
configCommand.command('init').description('初始化配置文件').action(initConfig);

function maskKey(key: string): string {
  if (key.length <= 8) {
    return '****';
  }
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}
