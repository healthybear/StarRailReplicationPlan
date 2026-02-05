# DEV-P1-03 人物状态演化（CS）

## 一、模块概述

### 模块目标

实现人物状态的管理和演化功能，包括关系维度、能力值、行为倾向的管理，以及基于触发表的状态自动更新。

### 对应 WBS 任务 ID

- P1-CS-01: 人物状态维度结构（关系/能力/修养/性格/视野）与量化表示
- P1-CS-02: 触发表配置格式与加载
- P1-CS-03: 至少 1 个关系维度的触发表执行与状态更新

### 依赖模块

- DEV-P1-01 基础设施与数据模型（INF）

### 被依赖模块

- DEV-P1-06 角色 Agent（CA）
- DEV-P1-07 剧情编排（SO）
- DEV-P1-09 锚点与对比（AE）

---

## 二、功能清单

| 功能名称             | 功能描述               | 类/方法                                          | 文件位置                                                       |
| -------------------- | ---------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| 行为倾向推导         | 从五大人格推导行为倾向 | `BehaviorEngine.deriveBehaviorTendencies()`      | `packages/core/src/character-state/behavior-engine.ts`         |
| 确保行为倾向         | 获取或推导人物行为倾向 | `BehaviorEngine.ensureBehaviorTendencies()`      | 同上                                                           |
| 触发规则执行         | 执行触发规则更新状态   | `TriggerEngine.executeRules()`                   | 同上                                                           |
| 加载触发表           | 加载触发表配置         | `CharacterStateService.loadTriggerTable()`       | `packages/core/src/character-state/character-state.service.ts` |
| 追加触发规则         | 追加新的触发规则       | `CharacterStateService.appendTriggerRules()`     | 同上                                                           |
| 获取触发规则         | 获取已加载的触发规则   | `CharacterStateService.getTriggerRules()`        | 同上                                                           |
| 按事件类型获取规则   | 按事件类型筛选规则     | `CharacterStateService.getRulesByEventType()`    | 同上                                                           |
| 获取关系             | 获取人物间关系         | `CharacterStateService.getRelationship()`        | 同上                                                           |
| 更新关系             | 更新人物间关系         | `CharacterStateService.updateRelationship()`     | 同上                                                           |
| 获取能力值           | 获取人物能力值         | `CharacterStateService.getAbility()`             | 同上                                                           |
| 更新能力值           | 更新人物能力值         | `CharacterStateService.updateAbility()`          | 同上                                                           |
| 处理事件             | 处理事件触发的状态变化 | `CharacterStateService.processEvent()`           | 同上                                                           |
| 处理事件（指定规则） | 使用指定规则处理事件   | `CharacterStateService.processEventWithRules()`  | 同上                                                           |
| 获取状态变更历史     | 获取人物状态变更记录   | `CharacterStateService.getStateChangeHistory()`  | 同上                                                           |
| 添加状态变更监听器   | 监听状态变更事件       | `CharacterStateService.addStateChangeListener()` | 同上                                                           |
| 获取状态摘要         | 获取人物状态摘要       | `CharacterStateService.getStateSummary()`        | 同上                                                           |

---

## 三、API 接口

### 3.1 BehaviorEngine.deriveBehaviorTendencies

```typescript
deriveBehaviorTendencies(traits: BigFiveTraits): BehaviorTendencies
```

**参数**：

- `traits`: 五大人格特质

**返回值**：行为倾向对象

**推导公式**：

- 探索倾向 = 0.7 × 开放性 + 0.3 × 外向性
- 合作倾向 = 0.7 × 宜人性 + 0.3 × 外向性
- 谨慎倾向 = 0.6 × 尽责性 + 0.4 × 神经质
- 冲动倾向 = 0.6 × (1 - 尽责性) + 0.4 × 外向性
- 自信倾向 = 0.7 × 外向性 + 0.3 × (1 - 神经质)

### 3.2 CharacterStateService.loadTriggerTable

```typescript
loadTriggerTable(config: TriggerTableConfig): void
```

**参数**：

- `config`: 触发表配置对象

**使用示例**：

```typescript
const config = await configLoader.loadYaml(
  'triggers/relationship_triggers.yaml',
  TriggerTableConfigSchema
);
characterStateService.loadTriggerTable(config);
```

### 3.3 CharacterStateService.processEvent

```typescript
processEvent(
  character: Character,
  eventType: string,
  context?: Record<string, unknown>
): StateChangeRecord[]
```

**参数**：

- `character`: 人物对象
- `eventType`: 事件类型
- `context`: 事件上下文（可选）

**返回值**：状态变更记录数组

**使用示例**：

```typescript
const changes = characterStateService.processEvent(march7, 'help', {
  targetCharacterId: 'stelle',
});
// changes 包含所有状态变更记录
```

### 3.4 StateChangeRecord

```typescript
interface StateChangeRecord {
  timestamp: number; // 变更时间戳
  eventType: string; // 事件类型
  target: string; // 变更目标（如 relationship.trust）
  oldValue: number; // 变更前的值
  newValue: number; // 变更后的值
  ruleId?: string; // 触发规则 ID
  relatedCharacterId?: string; // 相关人物 ID
}
```

---

## 四、配置文件

### 4.1 触发表配置

**文件路径**：`config/triggers/relationship_triggers.yaml`

**配置项说明**：

| 配置项       | 类型   | 说明             |
| ------------ | ------ | ---------------- |
| `id`         | string | 规则唯一标识     |
| `name`       | string | 规则名称         |
| `eventType`  | string | 事件类型         |
| `conditions` | array  | 触发条件（可选） |
| `effects`    | array  | 效果列表         |
| `priority`   | number | 优先级（可选）   |

**效果配置**：

| 配置项       | 类型   | 说明                                                   |
| ------------ | ------ | ------------------------------------------------------ |
| `target`     | string | 目标字段（如 relationship.trust, ability.combat）      |
| `changeType` | enum   | 变化类型：delta（增量）、multiply（乘法）、set（设置） |
| `value`      | number | 变化值                                                 |
| `min`        | number | 最小值限制（可选）                                     |
| `max`        | number | 最大值限制（可选）                                     |

**配置示例**：

```yaml
rules:
  - id: help_increases_trust
    name: 帮助行为增加信任
    eventType: help
    effects:
      - target: relationship.trust
        changeType: delta
        value: 0.05
        min: 0
        max: 1
    priority: 10
```

---

## 五、验收标准

对应 WBS 中的验收标准：

- [x] **P1-CS-01**: 状态维度定义与存储结构；至少关系维度可量化（0-1）
- [x] **P1-CS-02**: 触发表 JSON/YAML 格式；加载后能按事件类型查找变化规则
- [x] **P1-CS-03**: 给定事件，更新受影响人物关系；状态更新与读取接口

---

## 六、测试用例

**测试文件位置**：`packages/core/src/character-state/__tests__/character-state.test.ts`

### BehaviorEngine 测试

| 测试用例                                              | 测试目的             | 预期结果          |
| ----------------------------------------------------- | -------------------- | ----------------- |
| should derive exploration tendency correctly          | 验证探索倾向推导公式 | 0.7×O + 0.3×E     |
| should derive cooperation tendency correctly          | 验证合作倾向推导公式 | 0.7×A + 0.3×E     |
| should derive caution tendency correctly              | 验证谨慎倾向推导公式 | 0.6×C + 0.4×N     |
| should derive impulsivity tendency correctly          | 验证冲动倾向推导公式 | 0.6×(1-C) + 0.4×E |
| should derive assertiveness tendency correctly        | 验证自信倾向推导公式 | 0.7×E + 0.3×(1-N) |
| should return existing behavior tendencies if present | 验证已有倾向直接返回 | 返回已有值        |
| should derive behavior tendencies if not present      | 验证无倾向时自动推导 | 推导新值          |

### TriggerEngine 测试

| 测试用例                                     | 测试目的         | 预期结果       |
| -------------------------------------------- | ---------------- | -------------- |
| should apply delta change to relationship    | 验证增量变化     | 值增加指定量   |
| should apply set change to relationship      | 验证设置变化     | 值设为指定值   |
| should apply multiply change to relationship | 验证乘法变化     | 值乘以指定倍数 |
| should apply change to ability               | 验证能力值变化   | 能力值正确更新 |
| should respect min/max boundaries            | 验证边界限制     | 值不超出边界   |
| should filter rules by event type            | 验证事件类型过滤 | 只执行匹配规则 |
| should execute rules in priority order       | 验证优先级排序   | 高优先级先执行 |

### CharacterStateService 测试

| 测试用例                                                    | 测试目的           | 预期结果           |
| ----------------------------------------------------------- | ------------------ | ------------------ |
| should load and sort trigger rules by priority              | 验证规则加载和排序 | 按优先级降序       |
| should filter rules by event type                           | 验证按事件类型筛选 | 返回匹配规则       |
| should return existing relationship                         | 验证获取已有关系   | 返回正确关系       |
| should create default relationship if not exists            | 验证创建默认关系   | 创建默认值         |
| should update relationship and record change                | 验证更新并记录变更 | 更新成功且有记录   |
| should process event and return state changes               | 验证事件处理       | 返回变更记录       |
| should notify listeners on state change                     | 验证监听器通知     | 监听器被调用       |
| should remove listener correctly                            | 验证移除监听器     | 监听器不再被调用   |
| should return correct state summary                         | 验证状态摘要       | 摘要数据正确       |
| **should correctly apply relationship trigger from config** | **验证触发表生效** | **关系值正确更新** |

### 运行测试

```bash
cd packages/core && pnpm test
```

**测试结果**：39 passed, 0 failed（包含 VisionManager 的 15 个测试）

---

## 七、已知限制

1. **条件评估简化**：当前条件评估仅支持简单的字段比较，复杂条件（如逻辑组合）需要后续扩展
2. **状态变更历史内存存储**：当前变更历史存储在内存中，重启后丢失，Phase 2 可考虑持久化
3. **触发规则冲突处理**：多个规则同时触发时按优先级顺序执行，未实现冲突检测
4. **能力值演化约束**：Phase 3 将实现能力/性格变化的上下限与合理性校验（P3-CS-01）

---

## 八、变更记录

| 日期       | 版本  | 变更内容                                   | 变更人          |
| ---------- | ----- | ------------------------------------------ | --------------- |
| 2026-02-05 | 0.1.0 | 初始实现：行为引擎、触发引擎、状态服务     | Claude Opus 4.5 |
| 2026-02-05 | 0.1.1 | 增强：触发表加载、状态变更历史、监听器机制 | Claude Opus 4.5 |
