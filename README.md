# 星穹铁道剧情复现计划

基于 LLM 的剧情模拟系统，用于复现和探索《崩坏：星穹铁道》的剧情分支。

## 🎯 项目状态

- **当前版本**: v4.0.0-rc.1
- **开发阶段**: Phase 4 完成，MVP 可用
- **测试覆盖**: 61 个测试（44 个单元测试 + 17 个 E2E 测试）
- **API 端点**: 26 个 REST API
- **前端页面**: 6 个核心页面

## ✨ 核心功能

### 已实现功能（Phase 1-4）

- ✅ **视野隔离系统** - 每个角色只能看到自己知道的信息
- ✅ **人物状态演化** - 基于五大人格模型和触发表的状态变化
- ✅ **LLM 驱动对话** - 支持 Deepseek 和 Claude API
- ✅ **剧情推进编排** - 单角色/双角色/多角色剧情推进
- ✅ **快照与读档** - 保存和恢复任意时间点的游戏状态
- ✅ **锚点对比评估** - 对比当前分支与原剧情的差异
- ✅ **导出导入系统** - 人物/场景配置的导出和复用
- ✅ **REST API** - 完整的后端 API 支持
- ✅ **Web 管理界面** - 基于 Vue 3 的可视化管理
- ✅ **CLI 交互界面** - 命令行交互式游戏体验
- ✅ **Swagger 文档** - 完整的 API 文档

### 核心特性

1. **视野隔离验证** - 角色 A 知道的信息不会泄露给角色 B
2. **多维度状态管理** - 关系/能力/修养/性格/视野五个维度
3. **触发表驱动** - 事件触发自动更新人物状态
4. **分支对比评估** - 量化评估当前分支与原剧情的贴合度
5. **主题一致性检查** - 评估剧情是否符合预设主题
6. **性能监控** - 响应时间和存储限制监控
7. **异常兜底** - 死局检测和回滚机制

## 🚀 快速开始

### 环境要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- DeepSeek API Key（或 Claude API Key）

### 一键启动（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd StarRailReplicationPlan

# 2. 安装依赖
pnpm install

# 3. 配置 API Key
cp .env.example .env
# 编辑 .env 文件，设置 DEEPSEEK_API_KEY 或 ANTHROPIC_API_KEY

# 4. 构建项目
pnpm build

# 5. 启动后端 API（终端 1）
cd packages/api
pnpm start:dev

# 6. 启动前端界面（终端 2）
cd packages/web
pnpm dev

# 7. 访问应用
# - Web UI: http://localhost:5173
# - API 文档: http://localhost:3000/api/docs
```

### 使用 CLI 模式

```bash
# 启动 CLI 交互界面
pnpm start

# 或使用快速启动脚本
./scripts/quick-start.sh
```

## 📖 详细文档

- [快速开始指南](docs/快速开始指南.md) - 新手入门教程
- [API 使用指南](docs/API使用指南.md) - REST API 详细说明
- [部署指南](docs/部署指南.md) - 生产环境部署
- [开发指南](docs/开发指南.md) - 开发者文档

## 🏗️ 项目架构

### Monorepo 结构

```
StarRailReplicationPlan/
├── packages/                    # 源码包目录
│   ├── types/                   # 共享类型定义层
│   ├── infrastructure/          # 基础设施层
│   ├── core/                    # 核心领域层
│   ├── api/                     # REST API 服务（NestJS）
│   ├── web/                     # Web 前端（Vue 3 + Vuetify）
│   ├── cli/                     # CLI 交互界面
│   └── e2e-tests/               # 端到端测试
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
├── docs/                        # 项目文档
└── scripts/                     # 工具脚本
```

### 技术栈

**后端**:

- NestJS - REST API 框架
- TypeScript - 类型安全
- tsyringe - 依赖注入
- Zod - 数据校验
- Winston - 日志管理

**前端**:

- Vue 3 - 渐进式框架
- Vuetify - Material Design 组件库
- Axios - HTTP 客户端
- Vite - 构建工具

**LLM**:

- Deepseek API - 主要 LLM 提供商
- Claude API - 备选 LLM 提供商
- OpenAI SDK - 兼容接口

**测试**:

- Jest - 单元测试框架
- Supertest - API 测试
- ts-jest - TypeScript 支持

## 📦 核心包说明

### packages/api - REST API 服务

**6 个核心模块**:

- Session 模块 - 会话管理（4 个端点）
- Story 模块 - 剧情推进（3 个端点）
- Snapshot 模块 - 快照管理（4 个端点）
- Character 模块 - 人物管理（5 个端点）
- Scene 模块 - 场景管理（5 个端点）
- Anchor 模块 - 锚点管理（5 个端点）

**启动方式**:

```bash
cd packages/api
pnpm start:dev  # 开发模式
pnpm start:prod # 生产模式
```

**API 文档**: http://localhost:3000/api/docs

### packages/web - Web 前端

**6 个核心页面**:

- SessionList - 会话列表
- CreateSession - 创建会话
- StoryAdvance - 剧情推进
- CharacterList - 人物管理
- SceneList - 场景管理
- SnapshotList - 快照管理

**启动方式**:

```bash
cd packages/web
pnpm dev   # 开发模式
pnpm build # 生产构建
```

### packages/core - 核心业务逻辑

**8 大核心模块**:

- CharacterAgent - LLM 驱动的角色响应
- CharacterState - 人物状态管理
- VisionManager - 视野隔离
- WorldEngine - 世界状态管理
- InputParser - 输入解析
- StoryOrchestrator - 剧情编排
- AnchorEvaluator - 锚点评估
- ExportImport - 导出导入

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm --filter @star-rail/core test
pnpm --filter @star-rail/infrastructure test

# 运行 E2E 测试
pnpm --filter @star-rail/api test:e2e

# 查看覆盖率
pnpm --filter @star-rail/core test --coverage
```

### 测试状态

| 包                          | 测试用例 | 通过率 | 覆盖率    |
| --------------------------- | -------- | ------ | --------- |
| `@star-rail/core`           | 319      | 100%   | 82.75% ✅ |
| `@star-rail/infrastructure` | 92       | 100%   | 90% ✅    |
| `@star-rail/api`            | 44       | 100%   | 100% ✅   |
| `@star-rail/api` (E2E)      | 17       | 70.6%  | -         |

## 🔧 开发指南

### 开发命令

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

# 清理构建产物
pnpm clean
```

### Git 工作流

**分支策略**:

- `main` - 主分支，始终可部署
- `feature/*` - 功能分支
- `bugfix/*` - 修复分支

**Commit 规范** (Conventional Commits):

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

## 📚 文档索引

### 用户文档

- [快速开始指南](docs/快速开始指南.md)
- [API 使用指南](docs/API使用指南.md)
- [部署指南](docs/部署指南.md)

### 开发文档

- [需求文档](docs/需求文档-星穹铁道剧情复现计划.md)
- [概要设计](docs/概要设计.md)
- [技术选型与架构设计](docs/技术选型与架构设计.md)
- [WBS 任务分解表](docs/WBS任务分解表.md)
- [项目进度表](docs/项目进度表.md)

### Phase 完成总结

- [Phase 1 完成总结](docs/Phase1-测试完成总结.md)
- [Phase 2 完成总结](docs/Phase2-完成总结.md)
- [Phase 3 完成总结](docs/Phase3-完成总结.md)
- [Phase 4 完成总结](docs/Phase4-完成总结.md)

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request
