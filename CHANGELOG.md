# Changelog

本文件记录项目的所有重要变更，遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范。

---

## [3.0.0-dev] - 2026-02-21

### Phase 3 功能扩展

#### 新增

**P3-AE-02 贴合度权重评分可配置**

- 新增类型：`DimensionWeights`、`ScoringConfig`、`WeightedComparisonResult`（`packages/types`）
- `AnchorEvaluator.loadScoringConfig`：从配置对象加载权重和阈值
- `AnchorEvaluator.compareWeighted`：返回 `fitScore`（0-1）和 `dimensionScores` 明细
- `AnchorEvaluator.compareStorylineWeighted`：批量加权对比剧情线所有锚点

**P3-EI-01 势力/剧情图导出复用**

- `ExportImportService.exportFaction` / `importFaction`：势力数据导出导入，支持冲突检测
- `ExportImportService.exportPlotGraph` / `importPlotGraph`：剧情图导出导入，保留主题标签
- `ExportType` 扩展：新增 `'faction'` 和 `'plot'` 类型

**P3-AE-01 主题定义与一致性评估**

- `AnchorEvaluator.defineTheme`：注册主题 ID 与关键词列表
- `AnchorEvaluator.evaluateThemeConsistency`：返回覆盖率、已覆盖/缺失主题及匹配锚点
- `AnchorEvaluator.getStorylineThemes`：汇总剧情线所有锚点主题标签

**P3-CS-01 演化约束与合理性规则**

- 新增接口：`EvolutionConstraint`、`ConstraintViolation`
- `CharacterStateService.loadEvolutionConstraints`：批量注册 min/max/maxDelta 约束
- `CharacterStateService.applyConstraint`：对单次变更执行 clamp 和 delta 限制
- `CharacterStateService.updateAbilityConstrained`：更新能力值并返回违规信息

**P3-INF-01 性能与存储限制**

- `StoryOrchestrator.configurePerformance`：设置最大快照数和响应时间阈值
- `createSnapshot` 超出上限时自动裁剪最旧快照
- `AdvanceResult` 新增 `durationMs` 字段，超阈值时打印警告日志

**P3-SO-01 死局处理与异常逻辑**

- `StoryOrchestrator.configureDeadEndFallback`：配置死局兜底提示文本
- `StoryOrchestrator.detectDeadEnd`：检测最近 N 条响应是否内容完全相同
- `StoryOrchestrator.rollbackToLastValidSnapshot`：回滚到最近一个有角色数据的快照
- `AdvanceResult` 新增 `deadEndFallback` 字段

**P3-UI-01 状态可视化与对比分维度视图**

- 新增组件：`AbilityRadarChart.vue`（SVG 雷达图，支持原剧情叠加对比）
- 新增组件：`CharacterRelationshipGraph.vue`（SVG 关系网络图，信任度颜色/粗细编码）
- 新增组件：`VisionTimeline.vue`（视野变化时间线）
- 新增组件：`DimensionComparisonView.vue`（加权分维度对比卡片）
- 新增视图：`StateVisualization.vue`（4 标签页集成视图，路由 `/session/:id/visualization`）
- `StoryAdvance.vue` 工具栏新增「状态可视化」导航入口

#### 测试

- `@star-rail/core`：419 个测试，100% 通过（+34 个）
- 总计：419 个测试，0 失败

#### 文档

- 新增模块文档：`docs/modules/DEV-P3-Phase3功能扩展.md`

---

## [2.0.0-dev] - 2026-02-21

### Phase 2 功能扩展

#### 新增

**P2-CS-01 多角色状态与势力/关系扩展**

- `FactionService`：势力注册/查询，势力间关系管理
- `CharacterStateService` 扩展：批量角色关系更新，关系网络查询
- 触发表支持势力事件规则

**P2-WE-01 道具与剧情节点/分支**

- `ItemService`：道具定义注册，给予/移除/转移道具实例
- `PlotService`：剧情图加载，分支推进，终止节点检测

**P2-SO-01 快照保存与加载**

- `StoryOrchestrator` 扩展：`createSnapshot` / `loadSnapshot`
- 快照包含完整会话状态（角色、世界状态、信息库）

**P2-CA-01 多 Agent 冲突裁决**

- 新增 `ConflictArbitrator`，支持四种裁决策略：priority / compromise / first_wins / random
- `resolveAll` 保证无死锁

**P2-EI-01 导入冲突策略可配置**

- `ConflictStrategy` 新增 `merge` 选项（能力取最大值、关系取平均值、已知信息取并集）
- 新增 `importSnapshotToSession`、`exportSnapshot`、`importSnapshot` 方法

**P2-AE-01 判断维度对比报告**

- `AnchorEvaluator.compare` 新增 `judgment` 维度，`CompareOptions.includeJudgment` 可选开关

**P2-UI-01 多角色/快照/读档 UI**

- 新增 `SnapshotList.vue`、`MultiCharacterView.vue`、`ComparisonReport.vue`
- `StoryAdvance.vue` 工具栏新增「多角色」「对比报告」「加载快照」导航

**P2-VM-01 信息推理/遗忘/模糊规则**

- 新增类型：`InferenceRule`、`ForgetRule`、`FuzzyRule`、`InformationRulesConfig`
- `VisionManager` 新增：`loadInformationRules`、`applyInference`、`applyForgetting`、`applyFuzzy`

#### 测试

- `@star-rail/core`：285 个测试，100% 通过（+58 个）
- `@star-rail/infrastructure`：92 个测试，100% 通过
- `@star-rail/api`：3 个测试，100% 通过（修复 NestJS DI 配置）
- 总计：380 个测试，0 失败

#### 文档

- 新增 `docs/modules/DEV-P2-Phase2功能扩展.md`

---

## [1.0.0-rc.1] - 2026-02-21

### Phase 1 MVP 发布候选版本

#### 新增

**核心功能（9 个模块）**

- **DEV-P1-01 基础设施与数据模型**：JSON 文件存储、YAML/JSON 配置加载（Zod 校验）、统一错误类、Winston 日志、多 LLM Provider 工厂（Deepseek + Claude）
- **DEV-P1-02 视野与信息**：信息视野过滤，实现角色间信息隔离，防止信息泄露
- **DEV-P1-03 人物状态演化**：五大人格特质驱动的行为引擎，触发表规则可配置
- **DEV-P1-04 输入解析**：用户输入分类（指令型/对话型），越权请求明确拒绝
- **DEV-P1-05 角色 Agent**：LLM 驱动的角色响应生成，Prompt 构建器，视野隔离注入
- **DEV-P1-06 剧情编排**：串联各模块的主流程，单轮推进端到端打通
- **DEV-P1-07 导出导入**：人物/场景配置 JSON 导出包，支持导入新会话，冲突处理策略
- **DEV-P1-08 锚点与对比**：剧情节点锚点标记，单节点人物状态 + 视野对比，差异说明输出
- **DEV-P1-09 表现层**：CLI 命令行界面（会话管理/导出导入/配置检查），Vue 3 + Vuetify Web UI（13 个页面）

**Web UI 页面**

- 首页仪表板、会话列表、新建会话、会话推进（对话界面）
- 场景列表/详情、人物列表/详情、势力列表/详情
- 配置包管理（类型筛选/导入导出）
- 锚点管理（会话筛选/对比分析入口）
- 分析报告（角色参与度/视野隔离验证/对比差异统计）

**测试**

- `@star-rail/core`：227 个测试用例，100% 通过，分支覆盖率 82.75%
- `@star-rail/infrastructure`：92 个测试用例，100% 通过，分支覆盖率 90%
- 5 项验收标准全部通过：视野隔离验证、剧情推进可控、导出/导入可用、对比结果可见、状态演化可配置

**文档**

- 9 份模块完成文档（`docs/modules/`）
- 需求文档、概要设计、技术选型与架构设计、Phase 1 开发落地方案、WBS 任务分解表、项目进度表

#### 技术栈

- 语言：TypeScript 5.x
- 包管理：pnpm workspace（Monorepo）
- 构建：tsup
- 测试：Jest + ts-jest
- LLM：Deepseek（默认）+ Claude（可选）
- 存储：JSON 文件
- Web UI：Vue 3 + Vuetify 3 + Vue Router

#### 已知限制

- Web UI 当前为静态 mock 数据，尚未对接后端 API
- 仅支持单/双角色场景，多角色冲突裁决在 Phase 2 实现
- 锚点仅支持单节点对比，批量对比在 Phase 2 实现
- Infrastructure 包 LLM Provider 测试使用 mock，不覆盖真实 API 调用

---

## [0.x.x] - 2026-01-xx 至 2026-02-18

### 开发阶段（内部迭代）

- 需求文档与评审
- 概要设计与技术选型（4 轮技术讨论）
- UI/UX 体验目标与信息架构
- Phase 1 开发落地方案
- WBS 任务分解（30 个任务）
- 9 个核心模块逐步实现
- 代码重构与优化
