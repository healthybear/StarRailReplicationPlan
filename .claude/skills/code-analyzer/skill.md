---
name: code-analyzer
description: 快速分析代码结构，提取导出API、依赖关系和代码摘要，避免完整读取文件
version: 1.0.0
---

# 代码结构分析器

快速分析《星穹铁道剧情复现计划》项目的代码结构，智能提取关键信息，避免完整读取文件，节省 60-80% 的 token 消耗。

## 功能

1. **API 提取** - 提取导出的类、函数、接口、类型
2. **依赖分析** - 分析模块间的依赖关系
3. **代码摘要** - 生成文件/模块的结构摘要
4. **未测试代码** - 识别缺少测试的代码
5. **复杂度评估** - 评估代码复杂度（文件大小、函数数量）

## 使用方法

### 1. 分析单个文件

```bash
# 提取文件的导出 API
grep -E "export (class|function|interface|type|const)" {file_path}

# 提取文件的 import 依赖
grep "^import" {file_path}

# 统计文件行数
wc -l {file_path}
```

**示例**：

```
用户: 分析 packages/core/src/vision-manager/vision-manager.ts

输出:
📄 vision-manager.ts (245 行)

导出 API:
- export class VisionManager
- export interface VisionFilter
- export type VisionScope

依赖:
- @star-rail/types (Information, Character)
- @star-rail/infrastructure (Logger)

方法数量: 8 个
复杂度: 中等
```

### 2. 分析模块目录

```bash
# 列出模块中的所有文件
find {module_dir} -name "*.ts" -not -path "*/__tests__/*"

# 统计模块代码行数
find {module_dir} -name "*.ts" -not -path "*/__tests__/*" | xargs wc -l | tail -1

# 提取所有导出
find {module_dir} -name "*.ts" -not -path "*/__tests__/*" -exec grep -h "^export" {} \;
```

**示例**：

```
用户: 分析 vision-manager 模块

输出:
📦 vision-manager 模块

文件结构:
- vision-manager.ts (245 行)
- vision-filter.ts (120 行)
- types.ts (45 行)

总代码行数: 410 行

导出 API:
- VisionManager (class)
- VisionFilter (interface)
- VisionScope (type)
- filterByVision (function)

测试覆盖: ✅ (12 tests)
```

### 3. 分析包级别

```bash
# 统计包的代码行数
find packages/{package}/src -name "*.ts" -not -path "*/__tests__/*" | xargs wc -l | tail -1

# 统计包的测试行数
find packages/{package}/src -name "*.test.ts" | xargs wc -l | tail -1

# 列出包的所有模块
ls packages/{package}/src/
```

**示例**：

```
用户: 分析 core 包

输出:
📦 @star-rail/core

模块数量: 7 个
- vision-manager
- character-state
- input-parser
- character-agent
- story-orchestrator
- export-import
- anchor-evaluation

代码行数: 2,450 行
测试行数: 1,820 行
测试覆盖率: 82.75% ✅

主要导出:
- VisionManager
- CharacterStateManager
- InputParser
- CharacterAgent
- StoryOrchestrator
- ExportImportService
- AnchorEvaluator
```

### 4. 依赖关系分析

```bash
# 分析文件的 import 依赖
grep "^import.*from" {file_path} | sed "s/.*from '\(.*\)'.*/\1/"

# 分析模块间依赖
grep -r "from '@star-rail/" packages/{package}/src/{module}/ --include="*.ts" -h | sort | uniq
```

**示例**：

```
用户: 分析 story-orchestrator 的依赖

输出:
📊 story-orchestrator 依赖关系

内部依赖:
- @star-rail/types (SessionState, WorldState, Character)
- @star-rail/core/vision-manager (VisionManager)
- @star-rail/core/character-agent (CharacterAgent)
- @star-rail/core/input-parser (InputParser)

外部依赖:
- tsyringe (依赖注入)

被依赖:
- @star-rail/cli (CLI 入口)
```

### 5. 识别未测试代码

```bash
# 列出所有源文件
find packages/{package}/src -name "*.ts" -not -path "*/__tests__/*" -not -name "*.test.ts"

# 列出所有测试文件
find packages/{package}/src -name "*.test.ts"

# 对比找出缺少测试的文件
```

**示例**：

```
用户: 检查 infrastructure 包的测试覆盖

输出:
⚠️ 未测试的文件

Infrastructure 包:
- llm/llm-provider.factory.ts (0% 覆盖)
- llm/providers/deepseek.provider.ts (0% 覆盖)
- llm/providers/claude.provider.ts (0% 覆盖)
- logging/logger.ts (0% 覆盖)
- error/app-error.ts (0% 覆盖)

建议: 为这些文件添加单元测试
```

## 分析策略

### 快速扫描（不读取文件内容）

使用 `grep`、`find`、`wc` 等命令快速提取信息：

```bash
# 1. 文件列表和行数
find {dir} -name "*.ts" -exec wc -l {} \; | sort -rn

# 2. 导出 API
grep -r "^export" {dir} --include="*.ts" -h

# 3. 依赖关系
grep -r "^import.*from" {dir} --include="*.ts" -h

# 4. 类和函数数量
grep -r "^export (class|function)" {dir} --include="*.ts" | wc -l
```

### 深度分析（选择性读取）

只在需要时读取特定文件：

```bash
# 1. 读取文件的前 50 行（查看导入和类型定义）
head -50 {file_path}

# 2. 读取文件的导出部分
grep -A 10 "^export class" {file_path}

# 3. 读取文件的注释
grep "^/\*\*" -A 5 {file_path}
```

## 代码复杂度评估

### 文件复杂度

```bash
# 行数
wc -l {file_path}

# 函数/方法数量
grep -c "function\|=>" {file_path}

# 类数量
grep -c "^export class" {file_path}
```

**复杂度等级**：

- 简单：< 100 行，< 5 个函数
- 中等：100-300 行，5-15 个函数
- 复杂：> 300 行，> 15 个函数

### 模块复杂度

```bash
# 总行数
find {module_dir} -name "*.ts" -not -path "*/__tests__/*" | xargs wc -l | tail -1

# 文件数量
find {module_dir} -name "*.ts" -not -path "*/__tests__/*" | wc -l

# 导出数量
grep -r "^export" {module_dir} --include="*.ts" -h | wc -l
```

**复杂度等级**：

- 简单：< 500 行，< 3 个文件，< 10 个导出
- 中等：500-1500 行，3-8 个文件，10-30 个导出
- 复杂：> 1500 行，> 8 个文件，> 30 个导出

## 输出格式

### 文件分析输出

```
📄 {文件名} ({行数} 行)

导出 API:
- export class ClassName
- export function functionName
- export interface InterfaceName
- export type TypeName

依赖:
- @star-rail/types (Type1, Type2)
- @star-rail/infrastructure (Service1)

内部方法: {数量} 个
复杂度: {简单|中等|复杂}
测试覆盖: {✅ 有测试 | ⚠️ 无测试}
```

### 模块分析输出

```
📦 {模块名} 模块

文件结构:
- file1.ts ({行数} 行)
- file2.ts ({行数} 行)
- file3.ts ({行数} 行)

总代码行数: {总行数} 行
复杂度: {简单|中等|复杂}

导出 API:
- API1 (class)
- API2 (function)
- API3 (interface)

依赖:
- 内部: {依赖列表}
- 外部: {依赖列表}

测试覆盖: {✅ 完整 | ⚠️ 部分 | ❌ 无测试}
测试数量: {数量} 个
```

### 包分析输出

```
📦 @star-rail/{包名}

模块数量: {数量} 个
代码行数: {总行数} 行
测试行数: {测试行数} 行
测试覆盖率: {百分比}% {✅|⚠️|❌}

模块列表:
- module1 ({行数} 行, {复杂度})
- module2 ({行数} 行, {复杂度})
- module3 ({行数} 行, {复杂度})

主要导出:
- Export1
- Export2
- Export3

依赖关系:
- 依赖: {依赖包列表}
- 被依赖: {被依赖包列表}
```

## 常用分析命令

### 项目级别统计

```bash
# 统计所有包的代码行数
find packages -name "*.ts" -not -path "*/node_modules/*" -not -path "*/__tests__/*" | xargs wc -l | tail -1

# 统计所有测试行数
find packages -name "*.test.ts" | xargs wc -l | tail -1

# 统计所有导出 API
grep -r "^export" packages --include="*.ts" -h | wc -l

# 列出所有包
ls packages/
```

### 包级别统计

```bash
# 统计包的代码行数
find packages/{package}/src -name "*.ts" -not -path "*/__tests__/*" | xargs wc -l | tail -1

# 统计包的模块数
ls packages/{package}/src/ | wc -l

# 列出包的所有导出
grep -r "^export" packages/{package}/src --include="*.ts" -h | grep -v "test"
```

### 模块级别统计

```bash
# 统计模块的文件数
find packages/{package}/src/{module} -name "*.ts" -not -path "*/__tests__/*" | wc -l

# 统计模块的代码行数
find packages/{package}/src/{module} -name "*.ts" -not -path "*/__tests__/*" | xargs wc -l | tail -1

# 列出模块的导出
grep -r "^export" packages/{package}/src/{module} --include="*.ts" -h | grep -v "test"
```

## Token 优化

### 对比传统方式

**传统方式**（完整读取文件）：

```
读取 vision-manager.ts (245 行) → 3000 tokens
读取 vision-filter.ts (120 行) → 1500 tokens
读取 types.ts (45 行) → 600 tokens
```

**总计**：5,100 tokens

**使用 code-analyzer**（只提取关键信息）：

```
扫描文件列表 → 50 tokens
提取导出 API → 200 tokens
分析依赖关系 → 150 tokens
生成摘要 → 100 tokens
```

**总计**：500 tokens

**节省**：4,600 tokens（**90% 节省**）

## 使用场景

### 场景 1: 了解新模块

```
用户: 分析 character-agent 模块

输出:
📦 character-agent 模块

文件: character-agent.ts (320 行)
复杂度: 中等

导出:
- CharacterAgent (class)
- AgentConfig (interface)

主要方法:
- generateResponse()
- buildPrompt()
- processAction()

依赖:
- @star-rail/types
- @star-rail/infrastructure/llm

测试: ✅ 18 tests
```

### 场景 2: 查找未测试代码

```
用户: 检查哪些代码没有测试

输出:
⚠️ 未测试的代码

Infrastructure 包:
- llm/llm-provider.factory.ts
- llm/providers/deepseek.provider.ts
- llm/providers/claude.provider.ts
- logging/logger.ts
- error/app-error.ts

建议优先级:
P0: llm-provider.factory.ts (核心功能)
P1: deepseek.provider.ts, claude.provider.ts
P2: logger.ts, app-error.ts
```

### 场景 3: 分析依赖关系

```
用户: story-orchestrator 依赖哪些模块

输出:
📊 story-orchestrator 依赖关系

直接依赖:
- vision-manager (视野管理)
- character-agent (角色 Agent)
- input-parser (输入解析)
- character-state (状态管理)

间接依赖:
- types (数据类型)
- infrastructure (基础服务)

被依赖:
- cli (CLI 入口)
```

## 分析报告模板

### 完整代码分析报告

```
📊 代码结构分析报告
生成时间: {当前时间}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 包统计

总包数: 5 个
- @star-rail/types (数据类型)
- @star-rail/infrastructure (基础设施)
- @star-rail/core (核心逻辑)
- @star-rail/cli (命令行)
- @star-rail/web (Web UI, 未实现)

总代码行数: 4,500 行
总测试行数: 2,800 行
代码/测试比: 1.6:1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 模块统计

Core 包模块: 7 个
- vision-manager (410 行, 中等)
- character-state (380 行, 中等)
- input-parser (250 行, 简单)
- character-agent (320 行, 中等)
- story-orchestrator (450 行, 复杂)
- export-import (280 行, 简单)
- anchor-evaluation (360 行, 中等)

Infrastructure 包模块: 5 个
- config (220 行, 简单)
- storage (180 行, 简单)
- llm (450 行, 复杂)
- logging (120 行, 简单)
- error (80 行, 简单)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 复杂度分析

简单模块: 4 个
中等模块: 8 个
复杂模块: 2 个

最复杂模块:
1. story-orchestrator (450 行, 15 方法)
2. llm (450 行, 多个 Provider)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 测试覆盖

已测试: 9 个模块
未测试: 5 个模块

未测试模块:
- llm/llm-provider.factory.ts
- llm/providers/deepseek.provider.ts
- llm/providers/claude.provider.ts
- logging/logger.ts
- error/app-error.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 依赖关系

核心依赖:
- types → (被所有包依赖)
- infrastructure → core, cli
- core → cli

外部依赖:
- tsyringe (依赖注入)
- zod (Schema 校验)
- winston (日志)
- fs-extra (文件操作)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 注意事项

1. **扫描速度** - grep 和 find 命令很快，但大型项目可能需要几秒
2. **准确性** - 只能提取明显的导出，复杂的导出可能遗漏
3. **依赖分析** - 只分析 import 语句，不分析运行时依赖
4. **测试覆盖** - 只检查是否有测试文件，不检查覆盖率

## 更新日志

- v1.0.0 (2026-02-18) - 初始版本，支持代码结构快速分析
