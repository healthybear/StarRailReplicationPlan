# DEV-P2 Phase 2 功能扩展

## 一、模块概述

- 模块目标：在 Phase 1 MVP 基础上扩展多角色、多场景、冲突裁决、信息规则等能力
- 对应 WBS 任务：P2-CS-01、P2-WE-01、P2-SO-01、P2-CA-01、P2-EI-01、P2-AE-01、P2-UI-01、P2-VM-01
- 依赖模块：所有 Phase 1 模块
- 被依赖模块：无

## 二、功能清单

### P2-CS-01 多角色状态与势力/关系扩展

| 功能         | 描述                           | 类/方法                                     | 文件                                                           |
| ------------ | ------------------------------ | ------------------------------------------- | -------------------------------------------------------------- |
| 势力管理     | 注册/查询势力，管理势力间关系  | `FactionService`                            | `packages/core/src/world-engine/faction.service.ts`            |
| 多角色关系网 | 批量更新角色关系，查询关系网络 | `CharacterStateService.updateRelationships` | `packages/core/src/character-state/character-state.service.ts` |
| 触发表扩展   | 支持势力事件触发规则           | `TriggerEngine`                             | `packages/core/src/character-state/trigger-engine.ts`          |

### P2-WE-01 道具与剧情节点/分支

| 功能       | 描述                                 | 类/方法       | 文件                                             |
| ---------- | ------------------------------------ | ------------- | ------------------------------------------------ |
| 道具管理   | 注册道具定义，给予/移除/转移道具实例 | `ItemService` | `packages/core/src/world-engine/item.service.ts` |
| 剧情图管理 | 加载剧情图，推进分支，终止节点检测   | `PlotService` | `packages/core/src/world-engine/plot.service.ts` |

### P2-SO-01 快照保存与加载

| 功能     | 描述                 | 类/方法                            | 文件                                                         |
| -------- | -------------------- | ---------------------------------- | ------------------------------------------------------------ |
| 快照创建 | 保存当前会话完整状态 | `StoryOrchestrator.createSnapshot` | `packages/core/src/story-orchestrator/story-orchestrator.ts` |
| 快照加载 | 从快照恢复会话状态   | `StoryOrchestrator.loadSnapshot`   | `packages/core/src/story-orchestrator/story-orchestrator.ts` |

### P2-CA-01 多 Agent 冲突裁决

| 功能     | 描述                                            | 类/方法                              | 文件                                                       |
| -------- | ----------------------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| 冲突检测 | 检测多角色行动冲突（关键词匹配）                | `ConflictArbitrator.detectConflicts` | `packages/core/src/character-agent/conflict-arbitrator.ts` |
| 冲突裁决 | 四种策略：priority/compromise/first_wins/random | `ConflictArbitrator.arbitrate`       | 同上                                                       |
| 批量裁决 | 一次处理所有冲突，保证无死锁                    | `ConflictArbitrator.resolveAll`      | 同上                                                       |

### P2-EI-01 导入冲突策略可配置

| 功能          | 描述                                         | 类/方法                                       | 文件                                                       |
| ------------- | -------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| merge 策略    | 能力取最大值、关系取平均值、已知信息取并集   | `ExportImportService.mergeCharacterState`     | `packages/core/src/export-import/export-import.service.ts` |
| 快照导入      | 将快照中的角色导入当前会话，支持四种冲突策略 | `ExportImportService.importSnapshotToSession` | 同上                                                       |
| 快照导出/导入 | 快照文件的序列化与反序列化                   | `exportSnapshot` / `importSnapshot`           | 同上                                                       |

### P2-AE-01 判断维度对比报告

| 功能         | 描述                                       | 类/方法                           | 文件                                                      |
| ------------ | ------------------------------------------ | --------------------------------- | --------------------------------------------------------- |
| 判断维度对比 | 对比角色判断与原剧情锚点的差异             | `AnchorEvaluator.compareJudgment` | `packages/core/src/anchor-evaluation/anchor-evaluator.ts` |
| 可选开关     | `includeJudgment` 选项控制是否包含判断维度 | `CompareOptions.includeJudgment`  | 同上                                                      |

### P2-UI-01 多角色/快照/读档 UI

| 功能       | 描述                                           | 组件                     | 文件                                            |
| ---------- | ---------------------------------------------- | ------------------------ | ----------------------------------------------- |
| 快照列表   | 列出会话快照，支持加载（含冲突策略选择）和删除 | `SnapshotList.vue`       | `packages/web/src/views/SnapshotList.vue`       |
| 多角色视图 | 展示多角色响应面板，冲突高亮，裁决策略选择     | `MultiCharacterView.vue` | `packages/web/src/views/MultiCharacterView.vue` |
| 对比报告   | 角色偏差概览 + 视野/关系/判断维度详情          | `ComparisonReport.vue`   | `packages/web/src/views/ComparisonReport.vue`   |
| 路由扩展   | 新增三条子路由                                 | `router/index.ts`        | `packages/web/src/router/index.ts`              |

### P2-VM-01 信息推理/遗忘/模糊规则

| 功能         | 描述                                       | 类/方法                              | 文件                                                 |
| ------------ | ------------------------------------------ | ------------------------------------ | ---------------------------------------------------- |
| 推理规则     | 前提标签满足时自动推理新信息，防重复       | `VisionManager.applyInference`       | `packages/core/src/vision-manager/vision-manager.ts` |
| 遗忘规则     | 按时间或标签移除角色已知信息，关键记忆保留 | `VisionManager.applyForgetting`      | 同上                                                 |
| 模糊规则     | 按来源/标签/年龄降低信息置信度             | `VisionManager.applyFuzzy`           | 同上                                                 |
| 规则配置加载 | 统一加载三种规则配置                       | `VisionManager.loadInformationRules` | 同上                                                 |

## 三、API 接口

### ConflictArbitrator

```typescript
detectConflicts(responses: AgentResponse[], characters: Record<string, Character>): ConflictDescription[]
arbitrate(conflict, responses, characters, scene, strategy?: ArbitrationStrategy): ArbitrationResult
resolveAll(responses, characters, scene, strategy?): { finalResponses, arbitrations, hasDeadlock }
```

### VisionManager（新增）

```typescript
loadInformationRules(config: InformationRulesConfig): void
applyInference(store, characterId, sceneId, now?): Information[]
applyForgetting(store, characterId, now?): string[]
applyFuzzy(store, characterId, currentRefs, now?): KnownInformationRef[]
```

### ExportImportService（新增）

```typescript
mergeCharacterState(base: Character, incoming: Character): Character
importSnapshotToSession(snapshot, targetSession, strategy?): { success, importedCharacterIds, skippedCharacterIds }
exportSnapshot(snapshot, options?): Promise<string>
importSnapshot(filePath): Promise<ImportResult<Snapshot>>
```

## 四、配置文件

### InformationRulesConfig（新增）

```json
{
  "version": "1.0",
  "inferenceRules": [
    {
      "id": "r1",
      "name": "推理规则示例",
      "premiseTags": ["secret", "location"],
      "conclusionTemplate": "推理：目标在秘密地点",
      "confidence": 0.7,
      "priority": 10
    }
  ],
  "forgetRules": [
    {
      "id": "f1",
      "name": "时间遗忘",
      "maxAgeMs": 3600000,
      "preserveKeyMemory": true
    }
  ],
  "fuzzyRules": [
    {
      "id": "fz1",
      "name": "听闻模糊",
      "sourceTypes": ["heard"],
      "decayFactor": 0.8,
      "afterAgeMs": 600000
    }
  ]
}
```

## 五、验收标准

- [x] P2-CS-01：势力、多角色关系网维护；触发表扩展
- [x] P2-WE-01：道具状态、分支定义、多场景切换
- [x] P2-SO-01：快照保存与读档；当前分支状态可恢复
- [x] P2-CA-01：多人在场时冲突裁决逻辑；无死锁
- [x] P2-EI-01：至少一种冲突策略可用且文档化（merge/overwrite/rename/reject 四种）
- [x] P2-AE-01：报告含「人物视野与判断」维度及差异说明
- [x] P2-UI-01：支持多角色剧情展示、快照列表与读档、对比报告展示
- [x] P2-VM-01：推理规则配置；遗忘/模糊触发条件与执行

## 六、测试用例

| 测试用例                    | 测试目的                 | 预期结果                 | 测试文件                        |
| --------------------------- | ------------------------ | ------------------------ | ------------------------------- |
| 无冲突时返回空数组          | detectConflicts 基础行为 | length=0                 | `conflict-arbitrator.test.ts`   |
| 检测到行动冲突              | 关键词匹配冲突检测       | type=action_conflict     | 同上                            |
| priority 策略能力值高者获胜 | 裁决逻辑                 | winnerId=高能力角色      | 同上                            |
| compromise 策略行动降级     | 折中裁决                 | action 含「尝试」        | 同上                            |
| 推理前提满足时新增信息      | applyInference           | added.length=1           | `vision-manager.test.ts`        |
| 超时信息被遗忘              | applyForgetting          | forgotten 含旧信息 ID    | 同上                            |
| 关键记忆不被遗忘            | preserveKeyMemory        | forgotten 不含关键记忆   | 同上                            |
| 听闻信息置信度降低          | applyFuzzy               | confidence×decayFactor   | 同上                            |
| merge 策略合并角色状态      | mergeCharacterState      | 能力取最大值             | `export-import.service.test.ts` |
| 判断维度差异说明            | compareJudgment          | differences 含差异字符串 | `anchor-evaluator.test.ts`      |

## 七、已知限制

- 冲突检测基于关键词匹配，对话冲突检测需 LLM 语义分析（Phase 3）
- 推理规则使用标签匹配，不支持复杂逻辑表达式
- Web UI 仍为 mock 数据，尚未对接后端 API
- 快照加载后的状态一致性验证需端到端测试

## 八、变更记录

| 日期       | 版本      | 变更内容                  | 变更人            |
| ---------- | --------- | ------------------------- | ----------------- |
| 2026-02-21 | 2.0.0-dev | Phase 2 全部 8 个任务完成 | Claude Sonnet 4.6 |
