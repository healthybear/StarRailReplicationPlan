# DEV-P1-06 剧情编排（SO）

## 一、模块概述

### 模块目标

实现剧情编排器功能，串联各模块实现完整的剧情推进流程，包括用户输入解析、世界/信息/状态更新、Agent 调用、结果写回，以及为锚点对比提供状态快照。

### 对应 WBS 任务 ID

- P1-SO-01: 串联流程：用户输入→解析→世界/信息/状态更新→Agent 调用→结果写回
- P1-SO-02: 单节点原剧情对比所需数据就绪（当前分支状态可被锚点模块读取）

### 依赖模块

- DEV-P1-01 基础设施与数据模型（INF）
- DEV-P1-02 视野与信息（VM）
- DEV-P1-03 人物状态演化（CS）
- DEV-P1-04 输入解析（IP）
- DEV-P1-05 角色 Agent（CA）

### 被依赖模块

- DEV-P1-08 导出/导入（EI）
- DEV-P1-09 锚点与对比（AE）
- DEV-P1-10 表现层（UI）

---

## 二、功能清单

| 功能名称       | 功能描述                         | 类/方法                                         | 文件位置                                                     |
| -------------- | -------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| 初始化会话     | 注册人物到输入解析器             | `StoryOrchestrator.initializeSession()`         | `packages/core/src/story-orchestrator/story-orchestrator.ts` |
| 单角色推进     | 解析输入并生成单角色响应         | `StoryOrchestrator.advance()`                   | 同上                                                         |
| 多角色推进     | 为多个在场角色生成响应           | `StoryOrchestrator.advanceMultiCharacter()`     | 同上                                                         |
| 双角色推进     | 为两个角色分别注入视野并生成响应 | `StoryOrchestrator.advanceDualCharacter()`      | 同上                                                         |
| 创建状态快照   | 创建当前状态的快照               | `StoryOrchestrator.createSnapshot()`            | 同上                                                         |
| 获取当前快照   | 获取当前状态快照                 | `StoryOrchestrator.getCurrentSnapshot()`        | 同上                                                         |
| 获取快照历史   | 获取所有快照历史                 | `StoryOrchestrator.getSnapshotHistory()`        | 同上                                                         |
| 按回合获取快照 | 获取指定回合的快照               | `StoryOrchestrator.getSnapshotByTurn()`         | 同上                                                         |
| 清除快照历史   | 清除所有快照                     | `StoryOrchestrator.clearSnapshotHistory()`      | 同上                                                         |
| 添加信息到角色 | 添加信息到角色视野               | `StoryOrchestrator.addInformationToCharacter()` | 同上                                                         |
| 保存会话       | 保存会话到存储                   | `StoryOrchestrator.saveSession()`               | 同上                                                         |
| 加载会话       | 从存储加载会话                   | `StoryOrchestrator.loadSession()`               | 同上                                                         |
| 获取会话列表   | 获取所有会话 ID                  | `StoryOrchestrator.listSessions()`              | 同上                                                         |
| 删除会话       | 删除指定会话                     | `StoryOrchestrator.deleteSession()`             | 同上                                                         |

---

## 三、API 接口

### 3.1 AdvanceResult 接口

```typescript
interface AdvanceResult {
  /** 是否成功 */
  success: boolean;
  /** 角色响应列表 */
  responses: AgentResponse[];
  /** 错误信息 */
  error?: string;
  /** 本轮事件 ID */
  eventId?: string;
  /** 状态变更记录 */
  stateChanges?: Array<{
    characterId: string;
    target: string;
    oldValue: number;
    newValue: number;
  }>;
}
```

### 3.2 StateSnapshot 接口

```typescript
interface StateSnapshot {
  /** 快照 ID */
  snapshotId: string;
  /** 创建时间戳 */
  timestamp: number;
  /** 当前回合 */
  turn: number;
  /** 当前场景 ID */
  sceneId: string;
  /** 当前情节节点 ID */
  plotNodeId?: string;
  /** 角色状态快照 */
  characters: AnchorCharacterState[];
  /** 环境描述 */
  environmentDescription?: string;
}
```

### 3.3 MultiCharacterAdvanceOptions 接口

```typescript
interface MultiCharacterAdvanceOptions {
  /** 在场角色 ID 列表 */
  characterIds: string[];
  /** 用户输入 */
  userInput?: string;
  /** 触发规则 */
  triggerRules?: TriggerRule[];
}
```

### 3.4 StoryOrchestrator.advance

```typescript
async advance(
  session: SessionState,
  userInput: string,
  scene: SceneConfig,
  triggerRules?: TriggerRule[]
): Promise<AdvanceResult>
```

**参数**：

- `session`: 会话状态
- `userInput`: 用户输入
- `scene`: 当前场景配置
- `triggerRules`: 触发规则（可选）

**返回值**：AdvanceResult

**流程**：

1. 解析用户输入
2. 获取目标角色
3. 获取角色的过滤后视野
4. 获取最近事件
5. 生成角色响应
6. 添加事件到事件链
7. 处理触发规则
8. 推进回合
9. 更新保存时间
10. 创建状态快照

**使用示例**：

```typescript
const result = await orchestrator.advance(
  session,
  '对三月七说：你好',
  currentScene,
  triggerRules
);

if (result.success) {
  console.log(result.responses[0].content);
}
```

### 3.5 StoryOrchestrator.advanceDualCharacter

```typescript
async advanceDualCharacter(
  session: SessionState,
  scene: SceneConfig,
  characterAId: string,
  characterBId: string,
  userInput?: string
): Promise<{ success: boolean; result?: DualCharacterResponse; error?: string }>
```

**参数**：

- `session`: 会话状态
- `scene`: 当前场景配置
- `characterAId`: 角色 A ID
- `characterBId`: 角色 B ID
- `userInput`: 用户输入（可选）

**返回值**：包含双角色响应的结果

**使用示例**：

```typescript
const result = await orchestrator.advanceDualCharacter(
  session,
  currentScene,
  'march7',
  'stelle'
);

if (result.success) {
  console.log('三月七:', result.result.responseA.content);
  console.log('星:', result.result.responseB.content);
}
```

### 3.6 StoryOrchestrator.createSnapshot

```typescript
createSnapshot(session: SessionState, scene: SceneConfig): StateSnapshot
```

**参数**：

- `session`: 会话状态
- `scene`: 当前场景

**返回值**：StateSnapshot

**使用示例**：

```typescript
const snapshot = orchestrator.createSnapshot(session, currentScene);
// snapshot 可用于锚点对比
```

---

## 四、配置文件

本模块不需要额外配置文件，依赖其他模块的配置。

---

## 五、验收标准

对应 WBS 中的验收标准：

- [x] **P1-SO-01**: 单轮推进流程打通；与概要设计 5.1 一致
  - 用户输入→解析→世界/信息/状态更新→Agent 调用→结果写回
- [x] **P1-SO-02**: 编排器在每轮结束后写入当前状态；锚点模块可读取当前分支状态
  - `createSnapshot()` 在每轮结束后自动调用
  - `getCurrentSnapshot()` 和 `getSnapshotByTurn()` 供锚点模块读取

---

## 六、测试用例

**测试文件位置**：`packages/core/src/story-orchestrator/__tests__/story-orchestrator.test.ts`

### initializeSession 测试

| 测试用例                                   | 测试目的     | 预期结果               |
| ------------------------------------------ | ------------ | ---------------------- |
| should register characters to input parser | 验证角色注册 | 角色被注册到输入解析器 |
| should clear snapshot history              | 验证快照清空 | 快照历史被清空         |

### advance 测试 (P1-SO-01)

| 测试用例                                              | 测试目的         | 预期结果     |
| ----------------------------------------------------- | ---------------- | ------------ |
| should return error for invalid input                 | 验证无效输入处理 | 返回错误     |
| should return error for unauthorized input            | 验证越权输入处理 | 返回错误     |
| should return error for unknown character             | 验证未知角色处理 | 返回错误     |
| should successfully advance with dialogue input       | 验证对话推进     | 成功返回响应 |
| should successfully advance with command input        | 验证指令推进     | 成功返回响应 |
| should advance turn after successful advance          | 验证回合推进     | 回合数增加   |
| should add event to event chain                       | 验证事件添加     | 事件链增加   |
| should process trigger rules and return state changes | 验证触发规则处理 | 流程正常执行 |
| should create snapshot after advance (P1-SO-02)       | 验证快照创建     | 快照被创建   |

### advanceMultiCharacter 测试

| 测试用例                                          | 测试目的           | 预期结果     |
| ------------------------------------------------- | ------------------ | ------------ |
| should return error for empty character list      | 验证空角色列表处理 | 返回错误     |
| should generate responses for multiple characters | 验证多角色响应     | 返回多个响应 |

### advanceDualCharacter 测试

| 测试用例                                      | 测试目的         | 预期结果     |
| --------------------------------------------- | ---------------- | ------------ |
| should return error for missing character     | 验证缺失角色处理 | 返回错误     |
| should generate responses for both characters | 验证双角色响应   | 返回两个响应 |

### State Snapshot 测试 (P1-SO-02)

| 测试用例                                     | 测试目的             | 预期结果         |
| -------------------------------------------- | -------------------- | ---------------- |
| should create snapshot with character states | 验证快照包含角色状态 | 快照包含角色信息 |
| should include relationships in snapshot     | 验证快照包含关系     | 快照包含关系数据 |
| should get snapshot by turn                  | 验证按回合获取快照   | 返回正确快照     |
| should get current snapshot                  | 验证获取当前快照     | 返回当前快照     |
| should clear snapshot history                | 验证清除快照历史     | 历史被清空       |

### addInformationToCharacter 测试

| 测试用例                                       | 测试目的           | 预期结果         |
| ---------------------------------------------- | ------------------ | ---------------- |
| should add information to global store         | 验证添加到全局库   | 信息被添加       |
| should add information to character known list | 验证添加到角色已知 | 角色已知信息增加 |
| should not duplicate information               | 验证不重复添加     | 信息不重复       |

### Session Management 测试

| 测试用例                                    | 测试目的       | 预期结果           |
| ------------------------------------------- | -------------- | ------------------ |
| should save session                         | 验证保存会话   | 调用存储保存       |
| should load session and initialize          | 验证加载会话   | 会话被加载并初始化 |
| should return null for non-existent session | 验证不存在会话 | 返回 null          |
| should list sessions                        | 验证列出会话   | 返回会话列表       |
| should delete session                       | 验证删除会话   | 调用存储删除       |

### 运行测试

```bash
cd packages/core && pnpm test
```

**测试结果**：131 passed, 0 failed（包含 VisionManager 15 个 + CharacterState 24 个 + InputParser 31 个 + CharacterAgent 33 个 + StoryOrchestrator 28 个）

---

## 七、已知限制

1. **快照存储在内存**：当前快照历史存储在内存中，重启后丢失，Phase 2 可考虑持久化
2. **单线程执行**：多角色响应生成是并行的，但没有冲突裁决机制（Phase 2 P2-CA-01）
3. **状态变更追踪有限**：只追踪触发规则产生的变更，不追踪其他状态变化
4. **无回滚机制**：当前不支持回滚到之前的快照状态（Phase 2 P2-SO-01）

---

## 八、变更记录

| 日期       | 版本  | 变更内容                                         | 变更人          |
| ---------- | ----- | ------------------------------------------------ | --------------- |
| 2026-02-05 | 0.1.0 | 初始实现：基础推进流程、会话管理                 | Claude Opus 4.5 |
| 2026-02-05 | 0.1.1 | 增强：状态快照、多角色推进、双角色推进、信息添加 | Claude Opus 4.5 |
