# 星穹铁道剧情复现计划

基于 LLM 的剧情模拟系统，用于复现和探索《崩坏：星穹铁道》的剧情分支。

## Monorepo 工程介绍

本项目采用 **pnpm workspace** 管理的 Monorepo 架构，将代码按职责分层组织为多个独立包，便于模块化开发、测试和维护。

### 为什么选择 Monorepo

- **代码共享**：共享类型定义和工具函数，避免重复代码
- **统一版本管理**：所有包使用统一的依赖版本，减少兼容性问题
- **原子提交**：跨包修改可以在单次提交中完成
- **简化依赖**：workspace 协议 (`workspace:*`) 自动链接本地包

---

## 项目结构

```
StarRailReplicationPlan/
├── packages/                    # 源码包目录
│   ├── types/                   # 共享类型定义层
│   ├── infrastructure/          # 基础设施层
│   ├── core/                    # 核心领域层
│   └── cli/                     # CLI 表现层
│
├── config/                      # 配置文件目录
│   ├── characters/              # 人物配置（YAML）
│   ├── scenes/                  # 场景配置（YAML）
│   ├── triggers/                # 触发表配置（YAML）
│   └── llm.yaml                 # LLM Provider 配置
│
├── data/                        # 运行时数据目录
│   ├── sessions/                # 会话存档
│   └── anchors/                 # 锚点数据
│
├── exports/                     # 导出包存储目录
├── logs/                        # 日志文件目录
├── docs/                        # 项目文档
│
├── package.json                 # 根配置文件
├── pnpm-workspace.yaml          # pnpm workspace 配置
├── tsconfig.json                # TypeScript 根配置
├── .eslintrc.cjs                # ESLint 配置
├── .prettierrc                  # Prettier 配置
├── commitlint.config.cjs        # Commit 规范配置
├── .husky/                      # Git Hooks
├── .env.example                 # 环境变量模板
└── .gitignore                   # Git 忽略规则
```

---

## 包结构详解

### packages/types - 共享类型定义层

定义所有核心数据结构的 Zod Schema 和 TypeScript 类型。

```
packages/types/
├── src/
│   ├── character.ts       # 人物相关 Schema（Character/Relationship/BigFiveTraits）
│   ├── world-state.ts     # 世界状态 Schema（WorldState/Environment/EventRecord）
│   ├── information.ts     # 信息 Schema（Information/InformationStore）
│   ├── session.ts         # 会话 Schema（SessionState/Snapshot）
│   ├── anchor.ts          # 锚点 Schema（Anchor/ComparisonResult）
│   ├── config.ts          # 配置 Schema（LLMConfig/TriggerRule/CharacterConfig）
│   └── index.ts           # 统一导出
├── package.json
└── tsconfig.json
```

**核心类型说明**：

| 类型            | 说明                                               |
| --------------- | -------------------------------------------------- |
| `Character`     | 人物实体，包含基础信息、状态、人格模型             |
| `Relationship`  | 多维度关系（信任/敌对/亲密/尊重）                  |
| `BigFiveTraits` | 五大人格特质（开放性/尽责性/外向性/宜人性/神经质） |
| `WorldState`    | 世界状态，包含场景、时间线、环境、事件链           |
| `Information`   | 信息实体，支持视野隔离                             |
| `SessionState`  | 会话完整状态，单文件存储                           |
| `Anchor`        | 剧情锚点，用于对比评估                             |

---

### packages/infrastructure - 基础设施层

提供存储、配置加载、LLM 调用、日志等基础能力。

```
packages/infrastructure/
├── src/
│   ├── storage/
│   │   ├── storage.interface.ts    # 存储接口定义
│   │   └── json-file-storage.ts    # JSON 文件存储实现
│   ├── config/
│   │   ├── config-loader.ts        # YAML/JSON 配置加载器
│   │   └── env-loader.ts           # 环境变量加载器
│   ├── llm/
│   │   ├── llm-provider.interface.ts  # LLM Provider 接口
│   │   ├── llm-provider.factory.ts    # Provider 工厂
│   │   └── providers/
│   │       ├── deepseek.provider.ts   # Deepseek 实现
│   │       └── claude.provider.ts     # Claude 实现
│   ├── error/
│   │   └── app-error.ts            # 统一错误类
│   ├── logging/
│   │   └── logger.ts               # Winston 日志封装
│   └── index.ts
├── package.json
└── tsconfig.json
```

**模块说明**：

| 模块                 | 功能                                  |
| -------------------- | ------------------------------------- |
| `JsonFileStorage`    | 会话状态和快照的 JSON 文件存储        |
| `ConfigLoader`       | 加载 YAML/JSON 配置并通过 Zod 校验    |
| `EnvLoader`          | 从 .env 文件加载敏感配置（API Key）   |
| `LLMProviderFactory` | 管理多个 LLM Provider，支持按角色分配 |
| `DeepseekProvider`   | Deepseek API 调用实现                 |
| `ClaudeProvider`     | Anthropic Claude API 调用实现         |
| `Logger`             | 基于 Winston 的日志管理               |

---

### packages/core - 核心领域层

实现 8 大核心业务模块。

```
packages/core/
├── src/
│   ├── character-agent/           # 角色 Agent 模块
│   │   ├── character-agent.ts     # LLM 驱动的角色响应生成
│   │   ├── prompt-builder.ts      # Prompt 构建器
│   │   └── index.ts
│   ├── character-state/           # 人物状态模块
│   │   ├── behavior-engine.ts     # 行为引擎（人格→行为倾向推导）
│   │   ├── character-state.service.ts  # 状态管理服务
│   │   └── index.ts
│   ├── vision-manager/            # 视野管理模块
│   │   ├── vision-manager.ts      # 信息视野过滤
│   │   └── index.ts
│   ├── world-engine/              # 世界引擎模块
│   │   ├── world-engine.ts        # 世界状态管理
│   │   └── index.ts
│   ├── input-parser/              # 输入解析模块
│   │   ├── input-parser.ts        # 用户输入分类解析
│   │   └── index.ts
│   ├── story-orchestrator/        # 剧情编排模块
│   │   ├── story-orchestrator.ts  # 串联各模块的主流程
│   │   └── index.ts
│   ├── anchor-evaluation/         # 锚点评估模块
│   │   ├── anchor-evaluator.ts    # 分支对比评估
│   │   └── index.ts
│   ├── export-import/             # 导出导入模块
│   │   ├── export-import.service.ts  # 人物/场景导出导入
│   │   └── index.ts
│   ├── container.ts               # DI 容器配置
│   └── index.ts
├── package.json
└── tsconfig.json
```

**模块说明**：

| 模块                  | 功能                              |
| --------------------- | --------------------------------- |
| `CharacterAgent`      | 调用 LLM 生成角色对话和行动       |
| `PromptBuilder`       | 构建角色响应的 System/User Prompt |
| `BehaviorEngine`      | 从五大人格推导行为倾向            |
| `TriggerEngine`       | 执行触发表规则，更新人物状态      |
| `VisionManager`       | 管理信息视野，实现视野隔离        |
| `WorldEngine`         | 管理世界状态、场景切换、事件链    |
| `InputParser`         | 解析用户输入为指令型/对话型       |
| `StoryOrchestrator`   | 剧情推进主流程编排                |
| `AnchorEvaluator`     | 对比当前分支与原剧情锚点          |
| `ExportImportService` | 人物/场景配置的导出导入           |

---

### packages/cli - CLI 表现层

命令行交互界面，提供用户与系统交互的入口。

```
packages/cli/
├── src/
│   ├── commands/                  # 命令定义
│   │   ├── start.ts               # 启动会话命令
│   │   ├── session.ts             # 会话管理命令
│   │   ├── export.ts              # 导出命令
│   │   ├── import.ts              # 导入命令
│   │   └── config.ts              # 配置管理命令
│   ├── ui/                        # 交互组件
│   │   ├── main-menu.ts           # 主菜单
│   │   └── session-workspace.ts   # 会话工作区
│   ├── services/                  # 服务封装
│   │   ├── session-manager.ts     # 会话管理服务
│   │   └── export-service.ts      # 导出服务
│   └── index.ts                   # CLI 入口
├── package.json
└── tsconfig.json
```

**CLI 命令说明**：

| 命令                              | 说明                     |
| --------------------------------- | ------------------------ |
| `star-rail`                       | 显示交互式主菜单         |
| `star-rail start`                 | 启动新会话或继续现有会话 |
| `star-rail start -n`              | 直接创建新会话           |
| `star-rail start -c <id>`         | 继续指定会话             |
| `star-rail session list`          | 列出所有会话             |
| `star-rail session info <id>`     | 查看会话详情             |
| `star-rail session delete <id>`   | 删除会话                 |
| `star-rail session snapshot <id>` | 创建快照                 |
| `star-rail export [type] [id]`    | 导出人物/场景配置        |
| `star-rail import [file]`         | 导入配置文件             |
| `star-rail config show`           | 显示当前配置             |
| `star-rail config check`          | 验证配置是否正确         |
| `star-rail config init`           | 初始化配置目录           |

**会话工作区命令**：

进入会话后，可使用以下命令：

| 命令               | 说明         |
| ------------------ | ------------ |
| `/help`            | 显示帮助信息 |
| `/status`          | 显示当前状态 |
| `/characters`      | 显示人物列表 |
| `/events`          | 显示最近事件 |
| `/save`            | 保存会话     |
| `/snapshot [描述]` | 创建快照     |
| `/quit`            | 退出会话     |

**剧情输入格式**：

| 格式   | 示例               |
| ------ | ------------------ |
| 对话型 | `对三月七说：你好` |
| 指令型 | `让三月七去调查`   |

---

## 依赖配置说明

### 根目录 devDependencies

| 依赖                               | 版本     | 功能                       |
| ---------------------------------- | -------- | -------------------------- |
| `typescript`                       | ^5.3.3   | TypeScript 编译器          |
| `@types/node`                      | ^20.10.6 | Node.js 类型定义           |
| `tsup`                             | ^8.0.1   | 快速 TypeScript 打包工具   |
| `eslint`                           | ^8.56.0  | 代码静态检查               |
| `@typescript-eslint/parser`        | ^6.17.0  | ESLint TypeScript 解析器   |
| `@typescript-eslint/eslint-plugin` | ^6.17.0  | ESLint TypeScript 规则     |
| `eslint-config-prettier`           | ^9.1.0   | ESLint + Prettier 兼容配置 |
| `prettier`                         | ^3.1.1   | 代码格式化                 |
| `husky`                            | ^8.0.3   | Git Hooks 管理             |
| `lint-staged`                      | ^15.2.0  | 暂存文件 lint              |
| `@commitlint/cli`                  | ^18.4.4  | Commit 消息检查            |
| `@commitlint/config-conventional`  | ^18.4.4  | Conventional Commits 规范  |

### packages/types dependencies

| 依赖  | 版本    | 功能                      |
| ----- | ------- | ------------------------- |
| `zod` | ^3.22.4 | 运行时数据校验 + 类型推导 |

### packages/infrastructure dependencies

| 依赖                | 版本    | 功能                        |
| ------------------- | ------- | --------------------------- |
| `zod`               | ^3.22.4 | 配置校验                    |
| `tsyringe`          | ^4.8.0  | 依赖注入容器                |
| `reflect-metadata`  | ^0.2.1  | 装饰器元数据支持            |
| `dotenv`            | ^16.3.1 | 环境变量加载                |
| `js-yaml`           | ^4.1.0  | YAML 解析                   |
| `winston`           | ^3.11.0 | 日志管理                    |
| `fs-extra`          | ^11.2.0 | 增强的文件系统操作          |
| `@anthropic-ai/sdk` | ^0.17.1 | Claude API SDK              |
| `openai`            | ^4.24.1 | OpenAI 兼容 API（Deepseek） |

### packages/core dependencies

| 依赖                        | 版本         | 功能         |
| --------------------------- | ------------ | ------------ |
| `@star-rail/types`          | workspace:\* | 共享类型定义 |
| `@star-rail/infrastructure` | workspace:\* | 基础设施层   |
| `tsyringe`                  | ^4.8.0       | 依赖注入     |
| `reflect-metadata`          | ^0.2.1       | 装饰器支持   |
| `fs-extra`                  | ^11.2.0      | 文件操作     |

### packages/cli dependencies

| 依赖                        | 版本         | 功能           |
| --------------------------- | ------------ | -------------- |
| `@star-rail/types`          | workspace:\* | 共享类型定义   |
| `@star-rail/infrastructure` | workspace:\* | 基础设施层     |
| `@star-rail/core`           | workspace:\* | 核心领域层     |
| `commander`                 | ^11.1.0      | 命令行参数解析 |
| `inquirer`                  | ^9.2.12      | 交互式命令行   |
| `chalk`                     | ^5.3.0       | 终端颜色输出   |
| `ora`                       | ^7.0.1       | 终端加载动画   |
| `cli-table3`                | ^0.6.3       | 终端表格输出   |
| `boxen`                     | ^7.1.1       | 终端边框盒子   |
| `reflect-metadata`          | ^0.2.1       | 装饰器支持     |

---

## 配置文件说明

### config/llm.yaml - LLM 配置

```yaml
defaultProvider: deepseek # 默认使用的 Provider

providers:
  deepseek:
    enabled: true
    model: deepseek-chat
    baseUrl: https://api.deepseek.com/v1
    defaultParams:
      temperature: 0.7
      maxTokens: 2000

  claude:
    enabled: true
    model: claude-sonnet-4-5-20250929
    defaultParams:
      temperature: 0.7
      maxTokens: 2000

characterProviders: # 角色专用 Provider（可选）
  # march7: deepseek
  # stelle: claude
```

### config/characters/\*.yaml - 人物配置

定义人物的基础信息、人格特质、初始关系等。

### config/scenes/\*.yaml - 场景配置

定义场景的环境、连接关系等。

### config/triggers/\*.yaml - 触发表配置

定义事件触发的状态变化规则。

### .env - 环境变量

```bash
# LLM API Keys（敏感信息，不提交到 Git）
DEEPSEEK_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# 应用配置
NODE_ENV=development
LOG_LEVEL=info
```

---

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0

### 安装

```bash
# 安装依赖（推荐使用国内镜像）
pnpm install --registry https://registry.npmmirror.com

# 构建所有包
pnpm build
```

### 配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入 LLM API Key
```

### 运行

**重要：CLI 必须从项目根目录运行，以确保正确访问配置文件和数据目录。**

```bash
# 方式1：使用启动脚本（推荐）
./start-cli.sh                    # 启动交互式菜单
./start-cli.sh session list       # 列出所有会话
./start-cli.sh config check       # 检查配置

# 方式2：直接运行（从项目根目录）
node packages/cli/dist/index.js              # 启动交互式菜单
node packages/cli/dist/index.js start --new  # 创建新会话
node packages/cli/dist/index.js session list # 列出会话

# 方式3：使用 pnpm（从项目根目录）
pnpm --filter @star-rail/cli start
```

**注意事项：**

- 确保已经运行 `pnpm build` 构建所有包
- 确保 `.env` 文件已配置（从 `.env.example` 复制并填写 API Key）
- 所有数据文件（会话、锚点）都存储在项目根目录的 `data/` 目录下

---

## 开发命令

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 监听模式构建
pnpm dev

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 运行测试
pnpm test

# 清理构建产物
pnpm clean
```

---

## Git 工作流

### 分支策略（GitHub Flow）

- `main`：主分支，始终可部署
- `feature/*`：功能分支
- `bugfix/*`：修复分支
- `hotfix/*`：紧急修复分支

### Commit 规范（Conventional Commits）

```
<type>(<scope>): <subject>

类型：
- feat: 新功能
- fix: 修复 bug
- docs: 文档变更
- style: 代码格式
- refactor: 重构
- test: 测试相关
- chore: 构建/工具变更
```

---

## 架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│           CLI 表现层                 │  用户交互
├─────────────────────────────────────┤
│           Core 核心领域层            │  业务逻辑
├─────────────────────────────────────┤
│       Infrastructure 基础设施层      │  技术实现
├─────────────────────────────────────┤
│           Types 类型定义层           │  数据结构
└─────────────────────────────────────┘
```

### 模块依赖关系

```
InputParser → StoryOrchestrator → WorldEngine
                                → VisionManager
                                → CharacterStateService
                                → CharacterAgent → LLMProviderFactory
                                                 → BehaviorEngine
                                                 → PromptBuilder
```

---

## 文档

- [需求文档](docs/需求文档-星穹铁道剧情复现计划.md)
- [概要设计](docs/概要设计.md)
- [技术选型与架构设计](docs/技术选型与架构设计.md)
- [Phase1 开发落地方案](docs/Phase1-开发落地方案.md)
- [WBS 任务分解表](docs/WBS任务分解表.md)
- [项目进度表](docs/项目进度表.md)

---

## License

MIT
