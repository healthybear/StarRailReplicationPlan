# Phase 2 开发落地方案

**文档版本**: v1.0
**创建日期**: 2026-03-09
**状态**: 规划中
**目的**: Phase 2 能力扩展的详细开发计划与技术方案

---

## 一、Phase 2 目标与范围

### 1.1 核心目标

Phase 2 在 Phase 1 MVP 基础上，扩展以下能力：

1. **多角色与势力系统** - 支持复杂的多角色关系网与势力体系
2. **多 Agent 协调** - 解决多角色同时行动的冲突裁决问题
3. **快照与读档** - 支持状态保存与恢复，便于剧情分支探索
4. **导入冲突处理** - 完善跨剧情复用的冲突策略
5. **对比报告增强** - 增加人物视野与判断维度的对比
6. **道具与多场景** - 支持道具系统与多场景切换
7. **信息推理与遗忘** - 实现信息的推理规则与遗忘机制

### 1.2 验收标准（对应概要设计 §6 Phase 2）

- ① 多 Agent 冲突有明确裁决结果且无死锁
- ② 导入时 ID 冲突、依赖缺失至少一种策略可用且文档化
- ③ 人物状态快照导出后导入到另一剧情，该角色以快照状态参与
- ④ 对比报告含「人物视野与判断」维度及差异说明

---

## 二、任务分解与依赖关系

### 2.1 任务依赖图

```
第一批（并行开发）:
├─ P2-CS-01: 多角色状态与势力/关系扩展
├─ P2-WE-01: 道具与剧情节点/分支、多场景支持
├─ P2-CA-01: 多 Agent 冲突裁决
├─ P2-EI-01: 导入冲突与适配策略
├─ P2-AE-01: 人物视野与判断对比报告
└─ P2-VM-01: 信息推理规则与遗忘/模糊规则（P1）

第二批（依赖第一批）:
└─ P2-SO-01: 状态/环境快照保存与加载
   └─ 依赖: P2-CS-01, P2-WE-01

第三批（依赖第二批）:
└─ P2-UI-01: 多角色/多场景表现层与快照/读档 UI
   └─ 依赖: P2-SO-01, P2-EI-01
```

### 2.2 开发时间线（建议）

**Week 7-8: 基础能力扩展**

- P2-CS-01 + P2-WE-01（并行）
- P2-CA-01 + LLM 并发调用优化
- LLM 错误处理和重试机制

**Week 8-9: 快照与冲突处理**

- P2-SO-01（快照保存与加载）
- P2-EI-01（导入冲突策略）
- P2-AE-01（对比报告增强）

**Week 9-10: 信息管理与表现层**

- P2-VM-01（信息推理与遗忘）
- P2-UI-01（表现层增强）
- Phase 2 集成测试与验收

---

## 三、技术方案详解

### 3.1 P2-CS-01: 多角色状态与势力/关系扩展

#### 3.1.1 势力系统设计

**数据模型**:

```typescript
export interface Faction {
  id: string;
  name: string;
  description: string;

  // 势力属性
  ideology: string; // 意识形态/理念
  resources: number; // 资源/实力（0-100）
  influence: number; // 影响力（0-100）

  // 势力关系
  relationships: Map<string, FactionRelationship>; // 与其他势力的关系

  // 成员
  members: string[]; // 成员角色 ID 列表
  leader?: string; // 领袖角色 ID
}

export interface FactionRelationship {
  targetFactionId: string;
  stance: number; // 立场（-100 敌对 ~ 100 友好）
  alliance: boolean; // 是否结盟
  conflict: boolean; // 是否处于冲突状态
}
```

**配置文件示例**:

```yaml
# config/factions/stellaron_hunters.yaml
id: faction_stellaron_hunters
name: 星核猎手
description: 追寻星核的神秘组织
ideology: 追寻命运的终结
resources: 85
influence: 70

relationships:
  faction_astral_express:
    stance: -20
    alliance: false
    conflict: false

  faction_ipc:
    stance: -60
    alliance: false
    conflict: true

members:
  - character_kafka
  - character_blade
  - character_silverwolf

leader: character_kafka
```

#### 3.1.2 多角色关系网扩展

**增强关系维度**:

```typescript
export interface CharacterRelationship {
  targetCharacterId: string;

  // Phase 1 已有
  trust: number; // 信任度（0-100）

  // Phase 2 新增
  affection: number; // 好感度（0-100）
  respect: number; // 尊重度（0-100）
  fear: number; // 恐惧度（0-100）

  // 关系标签
  tags: string[]; // 如 "mentor", "rival", "family"

  // 关系历史
  history: RelationshipEvent[];
}

export interface RelationshipEvent {
  timestamp: number;
  eventId: string;
  eventType: string;
  impact: {
    trust?: number;
    affection?: number;
    respect?: number;
    fear?: number;
  };
  description: string;
}
```

#### 3.1.3 触发表扩展

**支持势力相关触发**:

```yaml
# config/triggers/faction_events.yaml
triggers:
  - event_type: faction_conflict
    conditions:
      - character_faction: faction_stellaron_hunters
      - target_faction: faction_ipc
    effects:
      - target: all_members
        changes:
          relationships:
            - target_faction_members: true
              trust: -10
              respect: +5
```

#### 3.1.4 实现文件

- `packages/core/src/character-state/FactionManager.ts` - 势力管理器
- `packages/core/src/character-state/RelationshipManager.ts` - 关系管理器（增强）
- `packages/core/src/character-state/schemas/faction.schema.ts` - 势力 Schema
- `packages/core/src/character-state/__tests__/FactionManager.test.ts` - 单元测试

---

### 3.2 P2-WE-01: 道具与剧情节点/分支、多场景支持

#### 3.2.1 道具系统设计

**数据模型**:

```typescript
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;

  // 道具属性
  properties: Record<string, any>;

  // 所有权
  owner?: string; // 角色 ID 或 null（场景中）
  location?: string; // 场景 ID（如果在场景中）

  // 状态
  condition: number; // 状态/耐久度（0-100）
  usable: boolean;
  consumable: boolean;

  // 效果
  effects?: ItemEffect[];
}

export enum ItemType {
  WEAPON = 'weapon',
  TOOL = 'tool',
  KEY_ITEM = 'key_item',
  CONSUMABLE = 'consumable',
  DOCUMENT = 'document',
}

export interface ItemEffect {
  type: string; // 如 "heal", "unlock", "trigger_event"
  parameters: Record<string, any>;
}
```

#### 3.2.2 剧情分支系统

**分支定义**:

```typescript
export interface PlotBranch {
  id: string;
  name: string;
  parentNodeId?: string; // 父节点 ID

  // 分支条件
  conditions: BranchCondition[];

  // 分支节点
  nodes: PlotNode[];

  // 分支结果
  outcomes: BranchOutcome[];
}

export interface BranchCondition {
  type:
    | 'character_state'
    | 'item_possession'
    | 'faction_relationship'
    | 'custom';
  parameters: Record<string, any>;
}

export interface PlotNode {
  id: string;
  type: 'dialogue' | 'event' | 'choice' | 'branch_point';
  content: any;
  nextNodes: string[]; // 可能的下一个节点
}
```

#### 3.2.3 多场景支持

**场景切换机制**:

```typescript
export interface SceneTransition {
  fromSceneId: string;
  toSceneId: string;

  // 切换条件
  conditions: TransitionCondition[];

  // 切换效果
  effects: TransitionEffect[];

  // 角色迁移规则
  characterMigration: 'all' | 'selected' | 'none';
  selectedCharacters?: string[];
}
```

#### 3.2.4 实现文件

- `packages/core/src/world-engine/ItemManager.ts` - 道具管理器
- `packages/core/src/world-engine/PlotBranchManager.ts` - 分支管理器
- `packages/core/src/world-engine/SceneManager.ts` - 场景管理器（增强）
- `packages/core/src/world-engine/schemas/item.schema.ts` - 道具 Schema

---

### 3.3 P2-CA-01: 多 Agent 冲突裁决

#### 3.3.1 冲突类型定义

```typescript
export enum ConflictType {
  ACTION_CONFLICT = 'action_conflict', // 行动冲突（如同时离开/留下）
  RESOURCE_CONFLICT = 'resource_conflict', // 资源冲突（如争夺道具）
  DIALOGUE_CONFLICT = 'dialogue_conflict', // 对话冲突（如同时说话）
  PRIORITY_CONFLICT = 'priority_conflict', // 优先级冲突
}

export interface AgentConflict {
  type: ConflictType;
  agents: string[]; // 冲突的角色 ID
  actions: AgentAction[]; // 冲突的行动
  context: ConflictContext;
}
```

#### 3.3.2 裁决策略

**策略 1: 优先级裁决**

```typescript
export interface PriorityResolver {
  resolve(conflict: AgentConflict): AgentAction[];

  // 优先级规则
  priorityRules: PriorityRule[];
}

export interface PriorityRule {
  condition: (agent: string, context: ConflictContext) => boolean;
  priority: number; // 数值越大优先级越高
}

// 默认优先级规则
const DEFAULT_PRIORITY_RULES: PriorityRule[] = [
  {
    condition: (agent, ctx) => ctx.userDrivenAgent === agent,
    priority: 100, // 用户驱动的行为最高优先级
  },
  {
    condition: (agent, ctx) => ctx.plotKeyCharacters.includes(agent),
    priority: 80, // 关键剧情角色次之
  },
  {
    condition: (agent, ctx) => true,
    priority: 50, // 其他角色默认优先级
  },
];
```

**策略 2: 先提交先执行**

```typescript
export class FirstComeFirstServeResolver implements ConflictResolver {
  resolve(conflict: AgentConflict): AgentAction[] {
    // 按提交时间排序
    const sorted = conflict.actions.sort((a, b) => a.timestamp - b.timestamp);

    // 第一个行动执行，后续行动基于第一个的结果重新生成
    return [sorted[0]];
  }
}
```

**策略 3: 协商裁决**

```typescript
export class NegotiationResolver implements ConflictResolver {
  async resolve(conflict: AgentConflict): Promise<AgentAction[]> {
    // 让冲突的 Agent 重新生成行动，但注入其他 Agent 的意图
    const negotiatedActions: AgentAction[] = [];

    for (const agent of conflict.agents) {
      const otherIntents = conflict.actions
        .filter((a) => a.agentId !== agent)
        .map((a) => a.intent);

      // 重新生成行动，考虑其他 Agent 的意图
      const newAction = await this.regenerateAction(
        agent,
        conflict.context,
        otherIntents
      );

      negotiatedActions.push(newAction);
    }

    return negotiatedActions;
  }
}
```

#### 3.3.3 死锁检测与处理

```typescript
export class DeadlockDetector {
  detectDeadlock(actions: AgentAction[]): boolean {
    // 检测循环依赖
    const graph = this.buildDependencyGraph(actions);
    return this.hasCycle(graph);
  }

  resolveDeadlock(actions: AgentAction[]): AgentAction[] {
    // 打破循环：随机选择一个行动延迟执行
    const delayed = actions[Math.floor(Math.random() * actions.length)];
    return actions.filter((a) => a !== delayed);
  }
}
```

#### 3.3.4 实现文件

- `packages/core/src/character-agent/ConflictResolver.ts` - 冲突裁决器
- `packages/core/src/character-agent/resolvers/PriorityResolver.ts` - 优先级裁决
- `packages/core/src/character-agent/resolvers/FirstComeFirstServeResolver.ts` - 先到先得
- `packages/core/src/character-agent/resolvers/NegotiationResolver.ts` - 协商裁决
- `packages/core/src/character-agent/DeadlockDetector.ts` - 死锁检测器

---

### 3.4 P2-SO-01: 状态/环境快照保存与加载

#### 3.4.1 快照数据模型

```typescript
export interface Snapshot {
  id: string;
  sessionId: string;
  timestamp: number;

  // 快照元数据
  metadata: SnapshotMetadata;

  // 完整状态
  worldState: WorldState;
  characters: Map<string, Character>;
  factions: Map<string, Faction>;
  items: Map<string, Item>;

  // 剧情状态
  plotState: PlotState;
  eventChain: Event[];

  // 用户自定义标签
  tags: string[];
  description?: string;
}

export interface SnapshotMetadata {
  version: string;
  createdBy: 'user' | 'auto';
  plotNodeId: string;
  branchId?: string;
}
```

#### 3.4.2 快照管理器

```typescript
export class SnapshotManager {
  // 创建快照
  async createSnapshot(
    sessionId: string,
    description?: string,
    tags?: string[]
  ): Promise<Snapshot> {
    const snapshot: Snapshot = {
      id: generateSnapshotId(),
      sessionId,
      timestamp: Date.now(),
      metadata: {
        version: '2.0',
        createdBy: 'user',
        plotNodeId: this.getCurrentPlotNodeId(),
        branchId: this.getCurrentBranchId(),
      },
      worldState: this.captureWorldState(),
      characters: this.captureCharacters(),
      factions: this.captureFactions(),
      items: this.captureItems(),
      plotState: this.capturePlotState(),
      eventChain: this.captureEventChain(),
      tags: tags || [],
      description,
    };

    await this.storage.saveSnapshot(snapshot);
    return snapshot;
  }

  // 加载快照
  async loadSnapshot(snapshotId: string): Promise<void> {
    const snapshot = await this.storage.loadSnapshot(snapshotId);

    // 恢复状态
    this.restoreWorldState(snapshot.worldState);
    this.restoreCharacters(snapshot.characters);
    this.restoreFactions(snapshot.factions);
    this.restoreItems(snapshot.items);
    this.restorePlotState(snapshot.plotState);
    this.restoreEventChain(snapshot.eventChain);
  }

  // 列出快照
  async listSnapshots(sessionId: string): Promise<SnapshotInfo[]> {
    return this.storage.listSnapshots(sessionId);
  }

  // 删除快照
  async deleteSnapshot(snapshotId: string): Promise<void> {
    await this.storage.deleteSnapshot(snapshotId);
  }
}
```

#### 3.4.3 自动快照策略

```typescript
export interface AutoSnapshotConfig {
  enabled: boolean;
  interval: number; // 每 N 个剧情节点自动快照
  maxSnapshots: number; // 最大快照数量
  retentionPolicy: 'keep_all' | 'keep_recent' | 'keep_tagged';
}

export class AutoSnapshotService {
  private config: AutoSnapshotConfig;
  private nodeCounter: number = 0;

  async onPlotNodeAdvance(): Promise<void> {
    if (!this.config.enabled) return;

    this.nodeCounter++;

    if (this.nodeCounter >= this.config.interval) {
      await this.snapshotManager.createSnapshot(
        this.sessionId,
        `Auto snapshot at node ${this.getCurrentPlotNodeId()}`,
        ['auto']
      );

      this.nodeCounter = 0;
      await this.cleanupOldSnapshots();
    }
  }

  private async cleanupOldSnapshots(): Promise<void> {
    const snapshots = await this.snapshotManager.listSnapshots(this.sessionId);

    if (snapshots.length > this.config.maxSnapshots) {
      // 根据保留策略删除旧快照
      const toDelete = this.selectSnapshotsToDelete(snapshots);
      for (const snapshot of toDelete) {
        await this.snapshotManager.deleteSnapshot(snapshot.id);
      }
    }
  }
}
```

#### 3.4.4 实现文件

- `packages/core/src/story-orchestrator/SnapshotManager.ts` - 快照管理器
- `packages/core/src/story-orchestrator/AutoSnapshotService.ts` - 自动快照服务
- `packages/core/src/story-orchestrator/schemas/snapshot.schema.ts` - 快照 Schema
- `packages/infrastructure/src/storage/SnapshotStorage.ts` - 快照存储

---

## 四、优化计划中的 Phase 2 必须项

### 4.1 LLM 错误处理和重试机制

参考 `docs/优化计划.md` §2.3，实现：

- 自动重试（最多 3 次）
- 指数退避策略
- 超时处理（30s）
- 可重试错误判断（网络错误、429、5xx）

**实现文件**:

- `packages/infrastructure/src/llm/LLMProviderWithRetry.ts`

### 4.2 LLM 并发调用

参考 `docs/优化计划.md` §5.1，实现：

- 多 Agent 场景下并发调用 LLM
- Promise.allSettled 处理结果
- 错误隔离（单个 Agent 失败不影响其他）

**实现位置**:

- `packages/core/src/story-orchestrator/StoryOrchestrator.ts` 中的 `processMultipleAgents` 方法

### 4.3 单元测试

- 每个模块完成后编写单元测试
- 目标覆盖率：分支 ≥ 60%，函数 ≥ 60%，行 ≥ 60%
- 使用 Vitest 框架

---

## 五、开发检查清单

### 5.1 每个任务完成后

- [ ] 功能实现完成
- [ ] 类型定义完整
- [ ] 单元测试编写并通过
- [ ] 代码构建成功
- [ ] 模块完成文档编写（`docs/modules/P2-XX-XX.md`）
- [ ] 相关配置文件创建
- [ ] 导出接口更新

### 5.2 Phase 2 验收前

- [ ] 所有 P0 任务完成
- [ ] 四项验收标准全部通过
- [ ] 集成测试通过
- [ ] 性能测试通过（响应时间 < 5s）
- [ ] 文档更新（项目进度表、CHANGELOG）

---

## 六、风险与缓冲

### 6.1 技术风险

| 风险                      | 影响                     | 缓解措施                                        |
| ------------------------- | ------------------------ | ----------------------------------------------- |
| 多 Agent 冲突裁决复杂度高 | 可能导致死锁或不合理结果 | 先实现简单的优先级策略，逐步迭代                |
| 快照数据量大              | 存储和加载性能问题       | 实现增量快照（Phase 3），Phase 2 先限制快照数量 |
| LLM 并发调用成本高        | API 费用增加             | 实现缓存机制，避免重复调用                      |

### 6.2 时间缓冲

- 每个 Week 预留 1 天缓冲时间
- Week 10 整周作为集成测试与验收缓冲

---

## 七、下一步行动

1. **立即启动**: P2-CS-01 + P2-WE-01（并行开发）
2. **准备工作**:
   - 创建 Phase 2 分支
   - 更新项目进度表
   - 准备配置文件模板
3. **团队对齐**:
   - 技术方案评审
   - 任务分配
   - 开发环境准备

---

## 八、变更记录

| 版本 | 日期       | 变更内容                       | 变更人            |
| ---- | ---------- | ------------------------------ | ----------------- |
| v1.0 | 2026-03-09 | 初始版本，Phase 2 开发落地方案 | Claude Sonnet 4.6 |
