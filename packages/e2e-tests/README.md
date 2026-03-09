# Phase 1 端到端测试

本包包含 Phase 1 的端到端功能测试，用于验证核心验收标准。

## 测试用例

### E2E-01: 视野隔离验证

- **文件**: `src/__tests__/e2e-01-vision-isolation.test.ts`
- **验收标准**: P1-UI-02
- **测试目标**: 验证角色 B 不会泄露仅角色 A 知道的信息

### E2E-02/03/04: 导出/导入功能

- **文件**: `src/__tests__/e2e-02-export-import.test.ts`
- **验收标准**: P1-EI-01, P1-EI-02, P1-EI-03
- **测试目标**: 验证人物/场景导出导入和冲突处理

### E2E-05/06/07: 用户输入解析与推进

- **文件**: `src/__tests__/e2e-05-input-parsing.test.ts`
- **验收标准**: P1-IP-01, P1-IP-02, P1-IP-03, P1-SO-01
- **测试目标**: 验证指令型/对话型输入和越权拒绝

### E2E-08: 状态演化触发

- **文件**: `src/__tests__/e2e-08-state-evolution.test.ts`
- **验收标准**: P1-CS-03
- **测试目标**: 验证关系维度可配置触发并生效

### E2E-09: 单节点对比

- **文件**: `src/__tests__/e2e-09-comparison.test.ts`
- **验收标准**: P1-AE-02
- **测试目标**: 验证当前分支与锚点的对比功能

## 运行测试

### 运行所有测试

```bash
pnpm test
```

### 运行单个测试文件

```bash
pnpm vitest run src/__tests__/e2e-01-vision-isolation.test.ts
```

### 运行测试并生成报告

```bash
pnpm test:e2e
```

这将执行所有测试并在 `docs/Phase1-测试报告.md` 生成详细报告。

### 监听模式

```bash
pnpm test:watch
```

### UI 模式

```bash
pnpm test:ui
```

## 测试数据

测试数据存储在 `test-data/` 目录下，每个测试用例有独立的子目录。测试完成后会自动清理。

## Mock 工具

### MockLLMProvider

位于 `src/__tests__/helpers/mock-llm-provider.ts`，提供可预测的 LLM 响应，避免测试结果不稳定。

使用示例：

```typescript
const mockLLM = new MockLLMProvider();
mockLLM.setResponse('march7th:describe', '自定义响应');
```

## 注意事项

1. **测试隔离**: 每个测试用例使用独立的存储目录，互不干扰
2. **数据清理**: 使用 `beforeEach` 和 `afterEach` 确保测试数据清理
3. **超时设置**: E2E 测试超时时间设置为 30 秒
4. **LLM Mock**: 使用 MockLLMProvider 避免依赖真实 LLM 服务

## 验收标准

所有测试通过即表示 Phase 1 核心验收标准满足：

- ✅ 视野隔离验证通过
- ✅ 导出/导入功能正常
- ✅ 用户输入解析正确
- ✅ 状态演化触发生效
- ✅ 单节点对比可用

## 故障排查

### 测试失败

1. 查看详细错误信息
2. 检查相关模块实现
3. 验证测试数据是否正确
4. 确认依赖模块已正确导出

### 导入错误

如果遇到模块导入错误，确保：

1. 所有依赖包已安装: `pnpm install`
2. 核心模块已构建: `pnpm -r build`
3. TypeScript 配置正确

### 存储错误

如果遇到文件系统错误：

1. 确保有写入权限
2. 手动清理 `test-data/` 目录
3. 检查磁盘空间

## 相关文档

- [Phase 1 端到端测试计划](../../docs/Phase1-端到端测试计划.md)
- [WBS 任务分解表](../../docs/WBS任务分解表.md)
- [概要设计](../../docs/概要设计.md)
