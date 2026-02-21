# DEV-P3 Phase 3 功能扩展

## 一、模块概述

- 模块目标：在 Phase 2 基础上增加可配置评分权重、主题一致性评估、演化约束、性能限制、死局处理及状态可视化能力
- 对应 WBS 任务：P3-AE-02、P3-EI-01、P3-AE-01、P3-CS-01、P3-INF-01、P3-SO-01、P3-UI-01
- 依赖模块：所有 Phase 1/2 模块
- 被依赖模块：无

---

## 二、功能清单

### P3-AE-02 贴合度权重评分可配置

| 功能           | 描述                                                 | 类/方法                                    | 文件                                                      |
| -------------- | ---------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| 加载评分配置   | 从 JSON 文件或对象加载权重/阈值配置                  | `AnchorEvaluator.loadScoringConfig`        | `packages/core/src/anchor-evaluation/anchor-evaluator.ts` |
| 加权对比       | 单锚点加权对比，返回 `fitScore` 和 `dimensionScores` | `AnchorEvaluator.compareWeighted`          | 同上                                                      |
| 剧情线加权对比 | 批量对比剧情线所有锚点                               | `AnchorEvaluator.compareStorylineWeighted` | 同上                                                      |

### P3-EI-01 势力/剧情图导出复用

| 功能       | 描述                                  | 类/方法                               | 文件                                                       |
| ---------- | ------------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| 势力导出   | 将 `Faction` 序列化为 JSON 导出包     | `ExportImportService.exportFaction`   | `packages/core/src/export-import/export-import.service.ts` |
| 势力导入   | 从导出包还原 `Faction`，支持冲突检测  | `ExportImportService.importFaction`   | 同上                                                       |
| 剧情图导出 | 将 `PlotGraphConfig` 及主题标签导出   | `ExportImportService.exportPlotGraph` | 同上                                                       |
| 剧情图导入 | 从导出包还原 `PlotGraphConfig` 及主题 | `ExportImportService.importPlotGraph` | 同上                                                       |

### P3-AE-01 主题定义与一致性评估

| 功能           | 描述                                   | 类/方法                                    | 文件                                                      |
| -------------- | -------------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| 定义主题       | 注册主题 ID 与关键词列表               | `AnchorEvaluator.defineTheme`              | `packages/core/src/anchor-evaluation/anchor-evaluator.ts` |
| 评估主题一致性 | 对比锚点主题标签与期望主题，返回覆盖率 | `AnchorEvaluator.evaluateThemeConsistency` | 同上                                                      |
| 获取剧情线主题 | 汇总剧情线所有锚点的主题标签           | `AnchorEvaluator.getStorylineThemes`       | 同上                                                      |

### P3-CS-01 演化约束与合理性规则

| 功能         | 描述                                     | 类/方法                                          | 文件                                                           |
| ------------ | ---------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| 加载约束配置 | 批量注册能力演化约束（min/max/maxDelta） | `CharacterStateService.loadEvolutionConstraints` | `packages/core/src/character-state/character-state.service.ts` |
| 应用约束     | 对单次能力变更执行 clamp 和 delta 限制   | `CharacterStateService.applyConstraint`          | 同上                                                           |
| 受约束更新   | 更新能力值并返回违规信息                 | `CharacterStateService.updateAbilityConstrained` | 同上                                                           |

### P3-INF-01 性能与存储限制

| 功能         | 描述                                          | 类/方法                                    | 文件                                                         |
| ------------ | --------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| 配置性能参数 | 设置最大快照数和响应时间阈值                  | `StoryOrchestrator.configurePerformance`   | `packages/core/src/story-orchestrator/story-orchestrator.ts` |
| 快照数量限制 | 超出上限时自动裁剪最旧快照                    | `StoryOrchestrator.createSnapshot`（内部） | 同上                                                         |
| 响应时间监控 | `advance` 返回 `durationMs`，超阈值时打印警告 | `AdvanceResult.durationMs`                 | 同上                                                         |

### P3-SO-01 死局处理与异常逻辑

| 功能             | 描述                                 | 类/方法                                         | 文件                                                         |
| ---------------- | ------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------ |
| 配置死局回退消息 | 设置死局时的兜底提示文本             | `StoryOrchestrator.configureDeadEndFallback`    | `packages/core/src/story-orchestrator/story-orchestrator.ts` |
| 检测死局         | 判断最近 N 条响应是否内容完全相同    | `StoryOrchestrator.detectDeadEnd`               | 同上                                                         |
| 回滚到有效快照   | 从历史中找到最近一个有角色数据的快照 | `StoryOrchestrator.rollbackToLastValidSnapshot` | 同上                                                         |

### P3-UI-01 状态可视化与对比分维度视图

| 功能               | 描述                                      | 组件                             | 文件                                                         |
| ------------------ | ----------------------------------------- | -------------------------------- | ------------------------------------------------------------ |
| 能力雷达图         | SVG 雷达图，支持与原剧情叠加对比          | `AbilityRadarChart.vue`          | `packages/web/src/components/AbilityRadarChart.vue`          |
| 人物关系图         | SVG 圆形布局关系网络，信任度颜色/粗细编码 | `CharacterRelationshipGraph.vue` | `packages/web/src/components/CharacterRelationshipGraph.vue` |
| 视野时间线         | 信息获取/失去/更新事件时间线              | `VisionTimeline.vue`             | `packages/web/src/components/VisionTimeline.vue`             |
| 分维度对比卡片     | 加权 fitScore + 各维度进度条              | `DimensionComparisonView.vue`    | `packages/web/src/components/DimensionComparisonView.vue`    |
| 状态可视化集成视图 | 4 标签页集成以上组件                      | `StateVisualization.vue`         | `packages/web/src/views/StateVisualization.vue`              |

---

## 三、API 接口

### AnchorEvaluator 新增接口

```typescript
// P3-AE-02
loadScoringConfig(config: ScoringConfig): void
getScoringConfig(): ScoringConfig | null
compareWeighted(session: GameSession, anchor: Anchor, options?: CompareOptions): WeightedComparisonResult
compareStorylineWeighted(session: GameSession, storylineId: string, options?: CompareOptions): WeightedComparisonResult[]

// P3-AE-01
defineTheme(themeId: string, keywords: string[]): void
evaluateThemeConsistency(storylineId: string, expectedThemes: string[]): {
  score: number;
  coveredThemes: string[];
  missingThemes: string[];
  details: Array<{ themeId: string; covered: boolean; matchedAnchors: string[] }>;
}
getStorylineThemes(storylineId: string): string[]
```

### ExportImportService 新增接口

```typescript
// P3-EI-01
exportFaction(faction: Faction, options?: ExportOptions): Promise<string>
importFaction(filePath: string, options?: ImportOptions & { existingFactionIds?: string[] }): Promise<ImportResult<Faction>>
exportPlotGraph(plotGraph: PlotGraphConfig, options?: { themes?: string[] }): Promise<string>
importPlotGraph(filePath: string): Promise<ImportResult<PlotGraphConfig> & { themes?: string[] }>
```

### CharacterStateService 新增接口

```typescript
// P3-CS-01
loadEvolutionConstraints(constraints: EvolutionConstraint[]): void
getEvolutionConstraints(): EvolutionConstraint[]
applyConstraint(target: string, currentValue: number, newValue: number): { value: number; violation?: ConstraintViolation }
updateAbilityConstrained(character: CharacterState, abilityName: string, value: number): ConstraintViolation | undefined
```

### StoryOrchestrator 新增接口

```typescript
// P3-INF-01
configurePerformance(maxSnapshots: number, responseTimeThresholdMs?: number): void
getSnapshotCount(): number
getPerformanceConfig(): { maxSnapshots: number; responseTimeThresholdMs: number }

// P3-SO-01
configureDeadEndFallback(message: string): void
detectDeadEnd(recentResponses: AgentResponse[], threshold?: number): boolean
rollbackToLastValidSnapshot(): StateSnapshot | null
```

---

## 四、新增类型（packages/types/src/anchor.ts）

| 类型                       | 描述                                                             |
| -------------------------- | ---------------------------------------------------------------- |
| `DimensionWeights`         | 视野/关系/判断维度权重配置                                       |
| `ScoringConfig`            | 评分规则配置（版本、权重、阈值）                                 |
| `WeightedComparisonResult` | 在 `ComparisonResult` 基础上增加 `fitScore` 和 `dimensionScores` |

---

## 五、验收标准

- [x] P3-AE-02：`compareWeighted` 返回 `fitScore`，权重配置生效
- [x] P3-EI-01：势力/剧情图可导出为 JSON 包并成功导入
- [x] P3-AE-01：`evaluateThemeConsistency` 返回覆盖率和缺失主题列表
- [x] P3-CS-01：`updateAbilityConstrained` 在违反约束时返回 `ConstraintViolation`
- [x] P3-INF-01：超出 `maxSnapshots` 时自动裁剪，`advance` 返回 `durationMs`
- [x] P3-SO-01：`detectDeadEnd` 识别重复响应，`rollbackToLastValidSnapshot` 返回有效快照
- [x] P3-UI-01：状态可视化页面包含雷达图、关系图、时间线、分维度对比 4 个标签页

---

## 六、测试用例

| 测试用例              | 测试目的              | 预期结果                                               | 测试文件位置                                                                |
| --------------------- | --------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| 加权对比返回 fitScore | P3-AE-02 核心功能     | fitScore ∈ [0,1]，dimensionScores 长度与维度数一致     | `packages/core/src/anchor-evaluation/__tests__/anchor-evaluator.test.ts`    |
| 权重配置影响 fitScore | P3-AE-02 权重生效     | 高权重维度对 fitScore 影响更大                         | 同上                                                                        |
| 主题一致性评估        | P3-AE-01 覆盖率计算   | coveredThemes + missingThemes = expectedThemes         | 同上                                                                        |
| 势力导出导入往返      | P3-EI-01 数据完整性   | 导入后 faction.id 与原始一致                           | `packages/core/src/export-import/__tests__/export-import.service.test.ts`   |
| 剧情图主题保留        | P3-EI-01 主题字段     | importPlotGraph 返回 themes 数组                       | 同上                                                                        |
| 演化约束 clamp        | P3-CS-01 min/max 限制 | 超出范围时返回 ConstraintViolation                     | `packages/core/src/character-state/__tests__/character-state.test.ts`       |
| maxDelta 限制         | P3-CS-01 单次变化量   | 超出 maxDelta 时 clamp 到允许范围                      | 同上                                                                        |
| 快照数量限制          | P3-INF-01 自动裁剪    | 超出 maxSnapshots 后 getSnapshotCount() ≤ maxSnapshots | `packages/core/src/story-orchestrator/__tests__/story-orchestrator.test.ts` |
| 响应时间记录          | P3-INF-01 durationMs  | advance 返回结果包含 durationMs 字段                   | 同上                                                                        |
| 死局检测              | P3-SO-01 重复响应     | 3 条相同内容响应时 detectDeadEnd 返回 true             | 同上                                                                        |
| 回滚到有效快照        | P3-SO-01 状态恢复     | rollbackToLastValidSnapshot 返回有角色数据的快照       | 同上                                                                        |

---

## 七、已知限制

- P3-UI-01 使用模拟数据，尚未接入真实后端 API
- `CharacterRelationshipGraph` 使用简单圆形布局，不支持力导向算法
- `detectDeadEnd` 仅比较响应内容字符串，不做语义相似度判断（语义检测留待 Phase 4）
- `evaluateThemeConsistency` 基于关键词匹配，不使用 LLM 语义理解

---

## 八、变更记录

| 日期       | 版本      | 变更内容                                           | 变更人 |
| ---------- | --------- | -------------------------------------------------- | ------ |
| 2026-02-21 | 3.0.0-dev | Phase 3 全部 7 个任务完成（419 个测试，100% 通过） | Claude |
