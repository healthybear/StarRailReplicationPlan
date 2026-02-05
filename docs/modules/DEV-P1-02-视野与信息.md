# DEV-P1-02 视野与信息（VM）

## 一、模块概述

### 模块目标

实现信息与视野管理功能，确保每个角色只能访问其已知的信息，实现视野隔离。

### 对应 WBS 任务 ID

- P1-VM-01: 全局信息库与每人已知信息库的存储与读写
- P1-VM-02: 事件驱动下的信息归属规则（目睹/听闻/被告知）
- P1-VM-03: Agent 调用前的「过滤后视野」接口

### 依赖模块

- DEV-P1-01 基础设施与数据模型（INF）

### 被依赖模块

- DEV-P1-06 角色 Agent（CA）
- DEV-P1-07 剧情编排（SO）
- DEV-P1-09 锚点与对比（AE）

---

## 二、功能清单

| 功能名称         | 功能描述                               | 类/方法                                         | 文件位置                                             |
| ---------------- | -------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| 获取过滤后视野   | 返回人物已知的信息子集                 | `VisionManager.getFilteredVision()`             | `packages/core/src/vision-manager/vision-manager.ts` |
| 获取已知信息引用 | 返回人物已知信息的引用列表（含置信度） | `VisionManager.getKnownInformationRefs()`       | 同上                                                 |
| 添加全局信息     | 向全局信息库添加新信息                 | `VisionManager.addGlobalInformation()`          | 同上                                                 |
| 归属信息给人物   | 将信息分配给指定人物                   | `VisionManager.assignInformationToCharacter()`  | 同上                                                 |
| 批量归属信息     | 将信息分配给多个人物                   | `VisionManager.assignInformationToCharacters()` | 同上                                                 |
| 检查信息知晓状态 | 检查人物是否知道某信息                 | `VisionManager.characterKnowsInformation()`     | 同上                                                 |
| 目睹事件         | 在场人物获得信息（witnessed）          | `VisionManager.witnessEvent()`                  | 同上                                                 |
| 听闻事件         | 指定人物通过听觉获得信息（heard）      | `VisionManager.hearEvent()`                     | 同上                                                 |
| 被告知           | 告知者和接收者获得信息（told）         | `VisionManager.tellInformation()`               | 同上                                                 |
| 事件归属处理     | 基于规则的事件信息归属                 | `VisionManager.processEventAttribution()`       | 同上                                                 |
| 加载归属规则     | 加载信息归属规则配置                   | `VisionManager.loadAttributionRules()`          | 同上                                                 |
| 获取信息差异     | 获取两人物间的信息差异                 | `VisionManager.getInformationDifference()`      | 同上                                                 |

---

## 三、API 接口

### 3.1 getFilteredVision

```typescript
getFilteredVision(
  characterId: string,
  informationStore: InformationStore
): Information[]
```

**参数**：

- `characterId`: 人物 ID
- `informationStore`: 信息库

**返回值**：该人物已知的信息数组

**使用示例**：

```typescript
const visionManager = new VisionManager(storage);
const knownInfo = visionManager.getFilteredVision('march7', informationStore);
// knownInfo 只包含 march7 已知的信息
```

### 3.2 witnessEvent

```typescript
witnessEvent(
  informationStore: InformationStore,
  context: EventContext,
  informationContent: string
): AttributionResult
```

**参数**：

- `informationStore`: 信息库
- `context`: 事件上下文（包含事件、参与者、在场人物等）
- `informationContent`: 信息内容

**返回值**：归属结果（包含信息 ID、被归属人物列表、来源类型、置信度）

### 3.3 tellInformation

```typescript
tellInformation(
  informationStore: InformationStore,
  context: EventContext,
  informationContent: string,
  teller: string,
  recipients: string[]
): AttributionResult
```

**参数**：

- `informationStore`: 信息库
- `context`: 事件上下文
- `informationContent`: 信息内容
- `teller`: 告知者 ID
- `recipients`: 被告知者 ID 列表

**返回值**：归属结果

### 3.4 getInformationDifference

```typescript
getInformationDifference(
  informationStore: InformationStore,
  characterA: string,
  characterB: string
): {
  onlyA: Information[];
  onlyB: Information[];
  shared: Information[];
}
```

**参数**：

- `informationStore`: 信息库
- `characterA`: 人物 A ID
- `characterB`: 人物 B ID

**返回值**：信息差异对象

- `onlyA`: 仅 A 知道的信息
- `onlyB`: 仅 B 知道的信息
- `shared`: 双方都知道的信息

---

## 四、配置文件

### 4.1 信息归属规则配置

**文件路径**：`config/triggers/information_attribution.yaml`

**配置项说明**：

| 配置项              | 类型   | 说明                                                  |
| ------------------- | ------ | ----------------------------------------------------- |
| `id`                | string | 规则唯一标识                                          |
| `name`              | string | 规则名称                                              |
| `eventType`         | string | 事件类型                                              |
| `sourceType`        | enum   | 信息来源类型：witnessed/heard/told/inferred           |
| `attributionTarget` | enum   | 归属目标：participants/witnesses/specific/all_present |
| `conditions`        | array  | 触发条件（可选）                                      |
| `confidence`        | number | 信息置信度（0-1，可选，默认 1.0）                     |
| `priority`          | number | 优先级（可选）                                        |

**配置示例**：

```yaml
rules:
  - id: dialogue_told
    name: 对话信息归属
    eventType: dialogue
    sourceType: told
    attributionTarget: participants
    confidence: 0.95
    priority: 10
```

---

## 五、验收标准

对应 WBS 中的验收标准：

- [x] **P1-VM-01**: 全局信息库、按人物 ID 的已知信息库读写 API 可用
- [x] **P1-VM-02**: 事件→信息归属规则配置或实现；目睹/听闻/被告知至少一种
- [x] **P1-VM-03**: 输入人物 ID，输出该人物已知信息子集（供 Agent 注入）
- [x] **视野隔离验收**: 1 场景 + 2 角色下，某信息仅 A 知时，B 的回复不包含该信息

---

## 六、测试用例

**测试文件位置**：`packages/core/src/vision-manager/__tests__/vision-manager.test.ts`

| 测试用例                                                                       | 测试目的                   | 预期结果                      |
| ------------------------------------------------------------------------------ | -------------------------- | ----------------------------- |
| should return empty array for character with no known information              | 验证无已知信息时返回空数组 | 返回 `[]`                     |
| should return only information known to the character                          | 验证视野过滤正确性         | 只返回该人物已知的信息        |
| should add information with generated ID                                       | 验证信息添加功能           | 信息被添加且有唯一 ID         |
| should assign information to character                                         | 验证信息归属功能           | 信息被正确归属                |
| should not duplicate information assignment                                    | 验证去重逻辑               | 不会重复归属                  |
| should return true if character knows information                              | 验证知晓检查（正例）       | 返回 `true`                   |
| should return false if character does not know information                     | 验证知晓检查（反例）       | 返回 `false`                  |
| should create information and assign to all present characters                 | 验证目睹事件               | 所有在场人物获得信息          |
| should create information with heard source type                               | 验证听闻事件               | 信息来源为 `heard`            |
| should assign to specific hearers if provided                                  | 验证指定听闻者             | 只有指定人物获得信息          |
| should assign information to teller and recipients                             | 验证被告知功能             | 告知者和接收者都获得信息      |
| should correctly identify information differences between characters           | 验证信息差异计算           | 正确区分 onlyA/onlyB/shared   |
| should load and sort rules by priority                                         | 验证规则加载和排序         | 按优先级降序排列              |
| **should ensure character B cannot see information only known to character A** | **视野隔离核心验证**       | **B 无法看到仅 A 知道的信息** |
| should correctly handle information sharing when A tells B                     | 验证信息共享流程           | 告知后双方都知道              |

### 运行测试

```bash
cd packages/core && pnpm test
```

**测试结果**：15 passed, 0 failed

---

## 七、已知限制

1. **推理规则未实现**：P1-VM-02 中的「推理」来源类型（inferred）在 Phase 1 未实现，计划在 Phase 2 实现
2. **遗忘/模糊规则未实现**：信息的遗忘和模糊化机制计划在 Phase 2 实现（P2-VM-01）
3. **条件评估简化**：当前条件评估仅支持简单的字段比较，复杂条件需要后续扩展

---

## 八、变更记录

| 日期       | 版本  | 变更内容                                       | 变更人          |
| ---------- | ----- | ---------------------------------------------- | --------------- |
| 2026-02-05 | 0.1.0 | 初始实现：视野过滤、信息归属、事件驱动归属规则 | Claude Opus 4.5 |
