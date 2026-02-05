# DEV-P1-08 锚点与对比（AE）

## 一、模块概述

### 模块目标

实现锚点数据模型与存储管理，支持当前分支与原剧情锚点的「人物状态+视野」对比，生成差异说明和评估报告。

### 对应 WBS 任务 ID

- P1-AE-01: 锚点数据模型与必填字段落地
- P1-AE-02: 当前分支与锚点的「人物状态+视野」对比与差异说明

### 依赖模块

- DEV-P1-01 基础设施与数据模型（INF）
- DEV-P1-06 剧情编排（SO）- StateSnapshot

### 被依赖模块

- DEV-P1-10 表现层（UI）

---

## 二、功能清单

| 功能名称       | 功能描述               | 类/方法                                      | 文件位置                                                  |
| -------------- | ---------------------- | -------------------------------------------- | --------------------------------------------------------- |
| 从快照创建锚点 | 从状态快照创建锚点     | `AnchorEvaluator.createAnchorFromSnapshot()` | `packages/core/src/anchor-evaluation/anchor-evaluator.ts` |
| 从会话创建锚点 | 从会话状态创建锚点     | `AnchorEvaluator.createAnchorFromSession()`  | 同上                                                      |
| 添加锚点       | 添加锚点到存储         | `AnchorEvaluator.addAnchor()`                | 同上                                                      |
| 获取锚点       | 获取指定锚点           | `AnchorEvaluator.getAnchor()`                | 同上                                                      |
| 获取剧情线锚点 | 获取剧情线的所有锚点   | `AnchorEvaluator.getAnchorsByStoryline()`    | 同上                                                      |
| 获取所有锚点   | 获取所有锚点           | `AnchorEvaluator.getAllAnchors()`            | 同上                                                      |
| 删除锚点       | 删除指定锚点           | `AnchorEvaluator.removeAnchor()`             | 同上                                                      |
| 清空锚点       | 清空所有锚点           | `AnchorEvaluator.clearAnchors()`             | 同上                                                      |
| 对比锚点       | 对比当前状态与锚点     | `AnchorEvaluator.compare()`                  | 同上                                                      |
| 对比快照       | 对比当前状态与快照     | `AnchorEvaluator.compareWithSnapshot()`      | 同上                                                      |
| 批量对比       | 批量对比多个锚点       | `AnchorEvaluator.compareMultiple()`          | 同上                                                      |
| 对比剧情线     | 对比剧情线上的所有锚点 | `AnchorEvaluator.compareStoryline()`         | 同上                                                      |

---

## 三、API 接口

### 3.1 CreateAnchorOptions 接口

```typescript
interface CreateAnchorOptions {
  /** 锚点名称 */
  name: string;
  /** 节点 ID */
  nodeId: string;
  /** 剧情线 ID */
  storylineId: string;
  /** 顺序标识 */
  sequence: number;
  /** 锚点描述 */
  description?: string;
  /** 情节描述 */
  plotDescription: string;
  /** 主题标签 */
  themes?: string[];
}
```

### 3.2 CompareOptions 接口

```typescript
interface CompareOptions {
  /** 是否包含视野对比 */
  includeVision?: boolean;
  /** 是否包含关系对比 */
  includeRelationships?: boolean;
  /** 关系差异阈值（低于此值不报告） */
  relationshipThreshold?: number;
}
```

### 3.3 AnchorEvaluator.createAnchorFromSnapshot

```typescript
createAnchorFromSnapshot(
  snapshot: StateSnapshot,
  options: CreateAnchorOptions
): Anchor
```

**参数**：

- `snapshot`: 状态快照（来自 StoryOrchestrator）
- `options`: 创建选项

**返回值**：创建的锚点

**使用示例**：

```typescript
const snapshot = orchestrator.getCurrentSnapshot(session, scene);
const anchor = evaluator.createAnchorFromSnapshot(snapshot, {
  name: '第一章结束',
  nodeId: 'chapter1_end',
  storylineId: 'main',
  sequence: 10,
  plotDescription: '三月七与星完成了空间站的调查',
});
```

### 3.4 AnchorEvaluator.createAnchorFromSession

```typescript
createAnchorFromSession(
  session: SessionState,
  options: CreateAnchorOptions
): Anchor
```

**参数**：

- `session`: 会话状态
- `options`: 创建选项

**返回值**：创建的锚点

**使用示例**：

```typescript
const anchor = evaluator.createAnchorFromSession(session, {
  name: '关键决策点',
  nodeId: 'decision_1',
  storylineId: 'main',
  sequence: 5,
  plotDescription: '玩家需要做出重要选择',
});
```

### 3.5 AnchorEvaluator.compare

```typescript
compare(
  session: SessionState,
  anchor: Anchor,
  options?: CompareOptions
): ComparisonResult
```

**参数**：

- `session`: 当前会话状态
- `anchor`: 锚点数据
- `options`: 对比选项

**返回值**：ComparisonResult

**使用示例**：

```typescript
const result = evaluator.compare(session, anchor, {
  includeVision: true,
  includeRelationships: true,
  relationshipThreshold: 0.1,
});

console.log('总体评价:', result.overallAssessment);
console.log('差异度:', result.overallDivergence);
console.log('差异列表:', result.differences);
```

### 3.6 AnchorEvaluator.compareStoryline

```typescript
compareStoryline(
  session: SessionState,
  storylineId: string,
  options?: CompareOptions
): ComparisonResult[]
```

**参数**：

- `session`: 当前会话状态
- `storylineId`: 剧情线 ID
- `options`: 对比选项

**返回值**：ComparisonResult 数组（按顺序）

**使用示例**：

```typescript
const results = evaluator.compareStoryline(session, 'main');

for (const result of results) {
  console.log(`锚点 ${result.anchorId}: 差异度 ${result.overallDivergence}`);
}
```

---

## 四、数据模型

### 4.1 Anchor（锚点）

```typescript
interface Anchor {
  /** 锚点 ID */
  id: string;
  /** 节点 ID */
  nodeId: string;
  /** 剧情线 ID */
  storylineId: string;
  /** 顺序标识 */
  sequence: number;
  /** 锚点名称 */
  name: string;
  /** 锚点描述 */
  description?: string;
  /** 人物状态列表 */
  characters: AnchorCharacterState[];
  /** 环境状态描述 */
  environmentDescription?: string;
  /** 情节描述 */
  plotDescription: string;
  /** 主题标签 */
  themes?: string[];
  /** 创建时间戳 */
  createdAt: number;
}
```

### 4.2 AnchorCharacterState（锚点人物状态）

```typescript
interface AnchorCharacterState {
  /** 人物 ID */
  characterId: string;
  /** 人物名称 */
  characterName: string;
  /** 对话内容 */
  dialogue?: string;
  /** 已知信息 ID 列表 */
  knownInformationIds: string[];
  /** 判断/决策描述 */
  judgment?: string;
  /** 关系状态快照（信任度） */
  relationships?: Record<string, number>;
}
```

### 4.3 ComparisonResult（对比结果）

```typescript
interface ComparisonResult {
  /** 锚点 ID */
  anchorId: string;
  /** 对比时间戳 */
  comparedAt: number;
  /** 总体评价 */
  overallAssessment: string;
  /** 总体差异度 (0-1) */
  overallDivergence: number;
  /** 分维度对比 */
  dimensions: ComparisonDimension[];
  /** 差异列表 */
  differences: string[];
}
```

### 4.4 ComparisonDimension（对比维度）

```typescript
interface ComparisonDimension {
  /** 维度名称 */
  name: string;
  /** 原剧情值 */
  originalValue: string | number;
  /** 当前分支值 */
  currentValue: string | number;
  /** 差异描述 */
  difference: string;
  /** 差异程度 (0-1) */
  divergence: number;
}
```

---

## 五、验收标准

对应 WBS 中的验收标准：

- [x] **P1-AE-01**: 锚点存储格式（节点 ID、剧情线 ID、人物反应与已知信息、环境与情节等）
  - Anchor Schema 包含所有必填字段
  - 支持从 StateSnapshot 和 SessionState 创建锚点
  - 按剧情线索引，支持顺序排序

- [x] **P1-AE-02**: 对比结果结构（总评/分维度/差异列表）；可为 Phase 2 报告 UI 留接口
  - 支持视野（已知信息）对比
  - 支持关系状态对比
  - 生成总体评价和差异度
  - 支持批量对比和剧情线对比

---

## 六、测试用例

**测试文件位置**：`packages/core/src/anchor-evaluation/__tests__/anchor-evaluator.test.ts`

### Anchor Management 测试 (P1-AE-01)

| 测试用例                                              | 测试目的           | 预期结果         |
| ----------------------------------------------------- | ------------------ | ---------------- |
| should create anchor from snapshot                    | 验证从快照创建锚点 | 锚点包含正确数据 |
| should create anchor from session                     | 验证从会话创建锚点 | 锚点包含角色状态 |
| should add and get anchor                             | 验证添加和获取锚点 | 正确存储和检索   |
| should get anchors by storyline                       | 验证按剧情线获取   | 返回正确锚点列表 |
| should get all anchors                                | 验证获取所有锚点   | 返回完整列表     |
| should remove anchor                                  | 验证删除锚点       | 锚点被移除       |
| should return false when removing non-existent anchor | 验证删除不存在锚点 | 返回 false       |
| should clear all anchors                              | 验证清空锚点       | 所有锚点被清空   |

### Comparison - Vision 测试 (P1-AE-02)

| 测试用例                                         | 测试目的         | 预期结果       |
| ------------------------------------------------ | ---------------- | -------------- |
| should detect no differences when vision matches | 验证视野匹配     | 差异度为 0     |
| should detect missing information                | 验证检测缺失信息 | 报告缺失       |
| should detect extra information                  | 验证检测多余信息 | 报告多余       |
| should detect missing character                  | 验证检测缺失角色 | 报告角色不存在 |

### Comparison - Relationships 测试 (P1-AE-02)

| 测试用例                                         | 测试目的         | 预期结果       |
| ------------------------------------------------ | ---------------- | -------------- |
| should detect relationship differences           | 验证检测关系差异 | 报告信任度差异 |
| should not report small relationship differences | 验证阈值过滤     | 小差异不报告   |
| should detect missing relationship               | 验证检测缺失关系 | 报告关系缺失   |

### Comparison Options 测试

| 测试用例                                          | 测试目的         | 预期结果       |
| ------------------------------------------------- | ---------------- | -------------- |
| should skip vision comparison when disabled       | 验证禁用视野对比 | 不包含视野维度 |
| should skip relationship comparison when disabled | 验证禁用关系对比 | 不包含关系维度 |

### Batch Comparison 测试

| 测试用例                                             | 测试目的           | 预期结果       |
| ---------------------------------------------------- | ------------------ | -------------- |
| should compare multiple anchors                      | 验证批量对比       | 返回多个结果   |
| should skip non-existent anchors in batch comparison | 验证跳过不存在锚点 | 只返回有效结果 |
| should compare storyline anchors                     | 验证剧情线对比     | 按顺序返回结果 |

### Assessment Generation 测试

| 测试用例                                          | 测试目的         | 预期结果       |
| ------------------------------------------------- | ---------------- | -------------- |
| should generate high consistency assessment       | 验证高一致性评价 | 包含"高度一致" |
| should generate minor difference assessment       | 验证小差异评价   | 包含"基本一致" |
| should generate significant difference assessment | 验证大差异评价   | 包含"差异"     |

### 运行测试

```bash
cd packages/core && pnpm test
```

**测试结果**：193 passed, 0 failed（包含 AnchorEvaluator 24 个测试）

---

## 七、已知限制

1. **内存存储**：锚点存储在内存中，重启后丢失，Phase 2 可考虑持久化
2. **简化关系对比**：当前只对比信任度（trust），Phase 2 可扩展到其他维度
3. **无权重配置**：对比维度权重固定，Phase 3 可配置权重
4. **无主题对比**：主题一致性评估留待 Phase 3 实现

---

## 八、变更记录

| 日期       | 版本  | 变更内容                                              | 变更人          |
| ---------- | ----- | ----------------------------------------------------- | --------------- |
| 2026-02-05 | 0.1.0 | 初始实现：基础对比功能                                | Claude Opus 4.5 |
| 2026-02-05 | 0.1.1 | 增强：锚点管理、从快照/会话创建、批量对比、剧情线对比 | Claude Opus 4.5 |
