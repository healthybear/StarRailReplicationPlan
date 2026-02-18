---
name: module-doc-generator
description: 自动生成模块完成文档，基于CLAUDE.md模板，从代码中提取API和功能清单，减少重复工作
version: 1.0.0
---

# 模块文档生成器

自动生成《星穹铁道剧情复现计划》项目的模块完成文档，遵循 CLAUDE.md 规范，从代码中智能提取信息。

## 功能

1. **模板生成** - 基于 CLAUDE.md 自动生成文档框架
2. **API 提取** - 从代码中提取导出的类、函数、接口
3. **功能清单** - 扫描文件生成功能列表
4. **WBS 关联** - 自动关联 WBS 任务 ID
5. **验收标准** - 从 WBS 提取验收标准
6. **测试索引** - 自动查找对应的测试文件

## 文档模板结构

根据 CLAUDE.md 规范，每个模块文档包含：

```markdown
# {模块ID} {模块名称}

## 一、模块概述

- 模块目标
- 对应 WBS 任务 ID
- 依赖模块
- 被依赖模块

## 二、功能清单

（从代码中提取）

## 三、API 接口

（从代码中提取导出）

## 四、配置文件

（扫描 config/ 目录）

## 五、验收标准

（从 WBS 提取）

## 六、测试用例

（从测试文件提取）

## 七、已知限制

（手动填写）

## 八、变更记录

（自动生成初始记录）
```

## 使用方法

### 1. 生成新模块文档

```bash
# 为 DEV-P1-XX 模块生成文档
# 需要提供：模块ID、模块名称、包名
```

**示例**：

```
用户: 为 DEV-P1-02 视野与信息 生成文档
处理:
1. 扫描 packages/core/src/vision-manager/
2. 提取导出的类和函数
3. 查找测试文件
4. 从 WBS 提取验收标准
5. 生成文档框架
```

### 2. 更新现有模块文档

```bash
# 更新文档的特定章节
# 如：更新 API 接口、功能清单
```

**示例**：

```
用户: 更新 DEV-P1-01 的 API 接口部分
处理:
1. 读取现有文档
2. 重新扫描代码提取 API
3. 更新 "三、API 接口" 章节
4. 保留其他章节不变
```

### 3. 批量生成文档

```bash
# 为多个模块批量生成文档
```

## 代码扫描策略

### 提取导出的 API

使用 grep 和正则表达式提取：

```bash
# 提取 export class
grep -r "export class" packages/{package}/src/{module}/ --include="*.ts" -h

# 提取 export function
grep -r "export function" packages/{package}/src/{module}/ --include="*.ts" -h

# 提取 export interface
grep -r "export interface" packages/{package}/src/{module}/ --include="*.ts" -h

# 提取 export type
grep -r "export type" packages/{package}/src/{module}/ --include="*.ts" -h
```

### 生成功能清单

扫描主要文件，提取类和方法：

```bash
# 列出模块中的所有 TypeScript 文件
find packages/{package}/src/{module}/ -name "*.ts" -not -path "*/__tests__/*"

# 对每个文件提取主要类和方法
grep -E "(class|function|interface)" {file} | head -20
```

### 查找测试文件

```bash
# 查找对应的测试文件
find packages/{package}/src/{module}/__tests__/ -name "*.test.ts"

# 统计测试数量
grep -c "it\(|test\(" {test_file}
```

### 查找配置文件

```bash
# 扫描 config/ 目录
find config/ -name "*.yaml" -o -name "*.json" -o -name "*.yml"

# 检查模块是否引用配置
grep -r "config/" packages/{package}/src/{module}/ --include="*.ts"
```

## 模块映射表

### Phase 1 模块映射

| 模块ID    | 模块名称           | 包名                  | 主要目录                                          | WBS 任务     |
| --------- | ------------------ | --------------------- | ------------------------------------------------- | ------------ |
| DEV-P1-01 | 基础设施与数据模型 | types, infrastructure | packages/types/src/, packages/infrastructure/src/ | P1-INF-01~03 |
| DEV-P1-02 | 视野与信息         | core                  | packages/core/src/vision-manager/                 | P1-VM-01~03  |
| DEV-P1-03 | 人物状态演化       | core                  | packages/core/src/character-state/                | P1-CS-01~03  |
| DEV-P1-04 | 输入解析           | core                  | packages/core/src/input-parser/                   | P1-IP-01~03  |
| DEV-P1-05 | 角色Agent          | core                  | packages/core/src/character-agent/                | P1-CA-01~03  |
| DEV-P1-06 | 剧情编排           | core                  | packages/core/src/story-orchestrator/             | P1-SO-01~02  |
| DEV-P1-07 | 导出导入           | core                  | packages/core/src/export-import/                  | P1-EI-01~03  |
| DEV-P1-08 | 锚点与对比         | core                  | packages/core/src/anchor-evaluation/              | P1-AC-01~03  |
| DEV-P1-09 | 表现层UI           | cli                   | packages/cli/src/                                 | P1-UI-01~02  |

## 文档生成流程

### 步骤 1: 收集基础信息

```bash
# 1. 确定模块ID和名称
MODULE_ID="DEV-P1-XX"
MODULE_NAME="模块名称"

# 2. 确定包名和目录
PACKAGE="core"
MODULE_DIR="packages/core/src/{module}/"

# 3. 查找 WBS 任务
grep -A 5 "${MODULE_ID}" docs/WBS任务分解表.md
```

### 步骤 2: 扫描代码结构

```bash
# 1. 列出所有源文件
find ${MODULE_DIR} -name "*.ts" -not -path "*/__tests__/*"

# 2. 提取导出的 API
grep -r "export" ${MODULE_DIR} --include="*.ts" -h | grep -v "test"

# 3. 查找测试文件
find ${MODULE_DIR}__tests__/ -name "*.test.ts"
```

### 步骤 3: 生成文档内容

```markdown
# ${MODULE_ID} ${MODULE_NAME}

## 一、模块概述

### 1.1 模块目标

[从 WBS 任务描述提取]

### 1.2 对应 WBS 任务 ID

[从 WBS 查询]

### 1.3 依赖模块

[分析 import 语句]

### 1.4 被依赖模块

[查询其他模块的 import]

---

## 二、功能清单

[从代码扫描生成表格]

| 功能名称 | 功能描述 | 核心类/方法 | 文件位置 |
| -------- | -------- | ----------- | -------- |
| ...      | ...      | ...         | ...      |

---

## 三、API 接口

[从导出提取，生成代码示例]

### 3.1 核心类

\`\`\`typescript
// 从代码中提取
\`\`\`

### 3.2 核心方法

\`\`\`typescript
// 从代码中提取
\`\`\`

---

## 四、配置文件

[扫描 config/ 目录]

---

## 五、验收标准

[从 WBS 提取]

- [ ] 验收项 1
- [ ] 验收项 2

---

## 六、测试用例

[从测试文件提取]

| 测试用例 | 测试目的 | 预期结果 | 测试文件位置 |
| -------- | -------- | -------- | ------------ |

---

## 七、已知限制

### 7.1 Phase 1 限制

[需要手动填写]

---

## 八、变更记录

| 日期       | 版本 | 变更内容 | 变更人            |
| ---------- | ---- | -------- | ----------------- |
| [当前日期] | v1.0 | 初始版本 | Claude Sonnet 4.5 |
```

### 步骤 4: 保存文档

```bash
# 保存到 docs/modules/
OUTPUT_FILE="docs/modules/${MODULE_ID}-${MODULE_NAME}.md"
```

## 智能提取示例

### 示例 1: 提取 VisionManager API

```bash
# 扫描 vision-manager 目录
grep -r "export" packages/core/src/vision-manager/ --include="*.ts" -h | grep -v "test"
```

**输出**：

```typescript
export class VisionManager
export interface VisionFilter
export type VisionScope
```

**生成文档**：

```markdown
### 3.1 VisionManager

\`\`\`typescript
import { VisionManager } from '@star-rail/core';

const visionManager = new VisionManager(informationRepository);

// 获取角色视野
const vision = await visionManager.getCharacterVision('march7');

// 过滤信息
const filtered = visionManager.filterByVision(allInfo, 'march7');
\`\`\`
```

### 示例 2: 提取测试用例

```bash
# 扫描测试文件
grep -E "describe\(|it\(" packages/core/src/vision-manager/__tests__/vision-manager.test.ts
```

**输出**：

```
describe('VisionManager', () => {
  it('should filter information by character vision', async () => {
  it('should return empty array for character with no vision', async () => {
  it('should handle global information correctly', async () => {
```

**生成文档**：

```markdown
| 测试用例           | 测试目的           | 预期结果             | 测试文件位置              |
| ------------------ | ------------------ | -------------------- | ------------------------- |
| 按角色视野过滤信息 | 验证视野过滤功能   | 只返回角色可见的信息 | vision-manager.test.ts:15 |
| 无视野角色处理     | 验证边界情况       | 返回空数组           | vision-manager.test.ts:28 |
| 全局信息处理       | 验证全局信息可见性 | 所有角色可见         | vision-manager.test.ts:42 |
```

## Token 优化

### 对比传统方式

**传统方式**（手动编写文档）：

1. 阅读代码理解功能（5000 tokens）
2. 查看测试文件（3000 tokens）
3. 查询 WBS 任务（2000 tokens）
4. 编写文档（需要大量上下文）

**总计**：10,000+ tokens

**使用 module-doc-generator**：

- 扫描代码提取 API（500 tokens）
- 查询 WBS（200 tokens）
- 生成文档框架（300 tokens）

**总计**：1,000 tokens

**节省**：9,000 tokens（**90% 节省**）

## 使用场景

### 场景 1: 新模块开发完成

```
用户: DEV-P1-10 模块开发完成，生成文档

处理:
1. 确认模块ID和名称
2. 扫描代码目录
3. 提取 API 和功能
4. 查询 WBS 验收标准
5. 生成完整文档
6. 保存到 docs/modules/
```

### 场景 2: 更新模块文档

```
用户: DEV-P1-02 添加了新的 API，更新文档

处理:
1. 读取现有文档
2. 重新扫描代码
3. 更新 API 接口章节
4. 更新变更记录
5. 保存文档
```

### 场景 3: 批量生成文档

```
用户: 为所有 Phase 1 模块生成文档

处理:
1. 遍历 9 个模块
2. 依次生成每个模块的文档
3. 汇总生成报告
```

## 文档质量检查

### 必须包含的内容

- [x] 模块概述（目标、WBS任务、依赖）
- [x] 功能清单（至少 3 项）
- [x] API 接口（至少 1 个导出）
- [x] 验收标准（从 WBS 提取）
- [x] 测试用例（至少 5 个）
- [x] 变更记录（初始版本）

### 可选内容

- [ ] 配置文件（如果有）
- [ ] 使用示例（复杂 API）
- [ ] 架构图（复杂模块）
- [ ] 性能指标（关键模块）

## 注意事项

1. **代码扫描限制** - 只能提取导出的 API，内部实现需要手动补充
2. **文档完整性** - 生成的是框架，详细描述需要人工审核
3. **WBS 同步** - 确保 WBS 任务 ID 正确对应
4. **测试覆盖** - 自动提取测试用例名称，详细说明需要补充

## 更新日志

- v1.0.0 (2026-02-18) - 初始版本，支持模块文档自动生成
