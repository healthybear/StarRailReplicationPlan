#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-console */

/**
 * E2E 测试执行脚本
 * 运行所有端到端测试并生成报告
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  results: TestResult[];
  summary: string;
}

async function runE2ETests(): Promise<TestReport> {
  console.log('🚀 开始执行 Phase 1 端到端测试...\n');

  const startTime = Date.now();
  const results: TestResult[] = [];

  const testFiles = [
    'e2e-01-vision-isolation.test.ts',
    'e2e-02-export-import.test.ts',
    'e2e-05-input-parsing.test.ts',
    'e2e-08-state-evolution.test.ts',
    'e2e-09-comparison.test.ts',
  ];

  for (const testFile of testFiles) {
    console.log(`📝 运行测试: ${testFile}`);
    const testStartTime = Date.now();

    try {
      execSync(`pnpm vitest run src/__tests__/${testFile}`, {
        cwd: process.cwd(),
        stdio: 'inherit',
      });

      const duration = Date.now() - testStartTime;
      results.push({
        name: testFile,
        passed: true,
        duration,
      });

      console.log(`✅ ${testFile} 通过 (${duration}ms)\n`);
    } catch (error) {
      const duration = Date.now() - testStartTime;
      results.push({
        name: testFile,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      console.log(`❌ ${testFile} 失败 (${duration}ms)\n`);
    }
  }

  const totalDuration = Date.now() - startTime;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;

  const report: TestReport = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests,
    failedTests,
    duration: totalDuration,
    results,
    summary: generateSummary(passedTests, failedTests, totalDuration),
  };

  return report;
}

function generateSummary(
  passed: number,
  failed: number,
  duration: number
): string {
  const total = passed + failed;
  const passRate = ((passed / total) * 100).toFixed(1);

  return `
测试执行完成！
- 总测试数: ${total}
- 通过: ${passed}
- 失败: ${failed}
- 通过率: ${passRate}%
- 总耗时: ${(duration / 1000).toFixed(2)}s
  `.trim();
}

function generateMarkdownReport(report: TestReport): string {
  const { timestamp, totalTests, passedTests, failedTests, duration, results } =
    report;

  let markdown = `# Phase 1 端到端测试报告

## 测试执行摘要

- **执行时间**: ${new Date(timestamp).toLocaleString('zh-CN')}
- **总测试数**: ${totalTests}
- **通过**: ${passedTests} ✅
- **失败**: ${failedTests} ❌
- **通过率**: ${((passedTests / totalTests) * 100).toFixed(1)}%
- **总耗时**: ${(duration / 1000).toFixed(2)}s

## 测试用例详情

| 测试用例 | 状态 | 耗时 | 备注 |
|---------|------|------|------|
`;

  for (const result of results) {
    const status = result.passed ? '✅ 通过' : '❌ 失败';
    const duration = `${result.duration}ms`;
    const note = result.error ? result.error.substring(0, 50) : '-';
    markdown += `| ${result.name} | ${status} | ${duration} | ${note} |\n`;
  }

  markdown += `
## 验收标准检查

### Phase 1 核心验收标准

| 验收标准 | 对应测试 | 状态 |
|---------|---------|------|
| ① 视野隔离验证 | e2e-01-vision-isolation.test.ts | ${getTestStatus(results, 'e2e-01')} |
| ② 导出/导入功能 | e2e-02-export-import.test.ts | ${getTestStatus(results, 'e2e-02')} |
| ③ 用户输入解析 | e2e-05-input-parsing.test.ts | ${getTestStatus(results, 'e2e-05')} |
| ④ 状态演化触发 | e2e-08-state-evolution.test.ts | ${getTestStatus(results, 'e2e-08')} |
| ⑤ 单节点对比 | e2e-09-comparison.test.ts | ${getTestStatus(results, 'e2e-09')} |

## 测试结论

`;

  if (failedTests === 0) {
    markdown += `
✅ **所有测试通过！Phase 1 核心验收标准全部满足。**

### 下一步工作

1. 更新 \`docs/项目进度表.md\`，标记 M4 完成
2. 准备发布说明文档
3. 进入 Phase 2 规划
`;
  } else {
    markdown += `
⚠️ **存在 ${failedTests} 个测试失败，需要修复后才能通过验收。**

### 待修复问题

`;
    for (const result of results.filter((r) => !r.passed)) {
      markdown += `- **${result.name}**: ${result.error}\n`;
    }

    markdown += `
### 修复建议

1. 查看失败测试的详细日志
2. 检查相关模块的实现
3. 修复问题后重新运行测试
`;
  }

  markdown += `
## 附录

### 测试环境

- Node.js: ${process.version}
- 测试框架: Vitest
- 测试类型: 端到端功能测试

### 测试数据

测试数据位于 \`test-data/\` 目录，测试完成后会自动清理。
`;

  return markdown;
}

function getTestStatus(results: TestResult[], testPrefix: string): string {
  const result = results.find((r) => r.name.startsWith(testPrefix));
  return result?.passed ? '✅ 通过' : '❌ 失败';
}

async function main() {
  try {
    const report = await runE2ETests();

    console.log('\n' + '='.repeat(60));
    console.log(report.summary);
    console.log('='.repeat(60) + '\n');

    // 生成 Markdown 报告
    const markdown = generateMarkdownReport(report);
    const reportPath = path.join(
      process.cwd(),
      '../../docs/Phase1-测试报告.md'
    );
    fs.writeFileSync(reportPath, markdown, 'utf-8');

    console.log(`📄 测试报告已生成: ${reportPath}`);

    // 如果有失败的测试，退出码为 1
    if (report.failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }
}

main();
