# DEV-P1-05 角色 Agent（CA）

## 一、模块概述

### 模块目标

实现角色 Agent 功能，基于 LLM 生成角色的对话和行动，确保输入仅包含人物状态与过滤后视野，不接收全局状态，不泄露未知信息。

### 对应 WBS 任务 ID

- P1-CA-01: Agent 输入输出约定（人物状态+过滤后视野，不接收全局状态）
- P1-CA-02: 基于「人物状态+过滤后视野」的对话/行动生成（单角色）
- P1-CA-03: 双角色场景下的分别调用与结果汇总

### 依赖模块

- DEV-P1-01 基础设施与数据模型（INF）
- DEV-P1-02 视野与信息（VM）
- DEV-P1-03 人物状态演化（CS）

### 被依赖模块

- DEV-P1-07 剧情编排（SO）

---

## 二、功能清单

| 功能名称            | 功能描述                        | 类/方法                                           | 文件位置                                               |
| ------------------- | ------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| 构建角色响应 Prompt | 构建包含角色状态和视野的 Prompt | `PromptBuilder.buildCharacterResponsePrompt()`    | `packages/core/src/character-agent/prompt-builder.ts`  |
| 构建系统 Prompt     | 构建角色扮演系统 Prompt         | `PromptBuilder.buildSystemPrompt()`               | 同上                                                   |
| 构建简洁 Prompt     | 构建简洁的快速响应 Prompt       | `PromptBuilder.buildSimpleResponsePrompt()`       | 同上                                                   |
| 描述人格特质        | 将五大人格转换为文字描述        | `PromptBuilder.describePersonality()`             | 同上                                                   |
| 生成角色响应        | 调用 LLM 生成角色响应           | `CharacterAgent.generateResponse()`               | `packages/core/src/character-agent/character-agent.ts` |
| 生成指定类型响应    | 生成指定类型（对话/行动）的响应 | `CharacterAgent.generateTypedResponse()`          | 同上                                                   |
| 双角色响应生成      | 为两个角色分别生成响应          | `CharacterAgent.generateDualCharacterResponses()` | 同上                                                   |
| 带在场角色响应      | 生成包含在场角色信息的响应      | `CharacterAgent.generateResponseWithPresence()`   | 同上                                                   |
| 批量响应生成        | 为多个角色批量生成响应          | `CharacterAgent.generateMultipleResponses()`      | 同上                                                   |
| 响应内容解析        | 解析 LLM 响应为结构化数据       | `CharacterAgent.parseResponseContent()`           | 同上                                                   |
| 信息泄露验证        | 验证响应是否泄露未知信息        | `CharacterAgent.validateNoInfoLeakage()`          | 同上                                                   |

---

## 三、API 接口

### 3.1 PromptContext 接口

```typescript
interface PromptContext {
  /** 角色（包含状态） */
  character: Character;
  /** 当前场景 */
  scene: SceneConfig;
  /** 角色已知信息（过滤后视野） */
  knownInfo: Information[];
  /** 最近事件 */
  recentEvents: EventRecord[];
  /** 用户输入（可选） */
  userInput?: string;
  /** 期望的响应类型（可选） */
  expectedResponseType?: ResponseType;
  /** 在场的其他角色（可选） */
  presentCharacters?: Array<{ id: string; name: string }>;
}
```

### 3.2 ResponseType 枚举

```typescript
enum ResponseType {
  /** 对话 */
  Dialogue = 'dialogue',
  /** 行动 */
  Action = 'action',
  /** 混合（对话+行动） */
  Mixed = 'mixed',
}
```

### 3.3 AgentResponse 接口

```typescript
interface AgentResponse {
  /** 角色 ID */
  characterId: string;
  /** 原始响应内容 */
  content: string;
  /** 解析后的响应内容 */
  parsed?: ParsedResponseContent;
  /** Token 使用统计 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### 3.4 ParsedResponseContent 接口

```typescript
interface ParsedResponseContent {
  /** 响应类型 */
  type: ResponseType;
  /** 对话内容 */
  dialogue?: string;
  /** 行动描述 */
  action?: string;
  /** 内心想法 */
  innerThought?: string;
  /** 情绪状态 */
  emotion?: string;
}
```

### 3.5 DualCharacterResponse 接口

```typescript
interface DualCharacterResponse {
  /** 角色 A 的响应 */
  responseA: AgentResponse;
  /** 角色 B 的响应 */
  responseB: AgentResponse;
  /** 场景 ID */
  sceneId: string;
  /** 生成时间戳 */
  timestamp: number;
}
```

### 3.6 CharacterAgent.generateResponse

```typescript
async generateResponse(
  character: Character,
  scene: SceneConfig,
  knownInfo: Information[],
  recentEvents: EventRecord[],
  userInput?: string,
  options?: LLMGenerateOptions
): Promise<AgentResponse>
```

**参数**：

- `character`: 角色（包含状态）
- `scene`: 当前场景
- `knownInfo`: 角色已知信息（过滤后视野）
- `recentEvents`: 最近事件
- `userInput`: 用户输入（可选）
- `options`: LLM 生成选项（可选）

**返回值**：AgentResponse

**使用示例**：

```typescript
const response = await characterAgent.generateResponse(
  march7,
  currentScene,
  visionManager.getFilteredVision('march7', informationStore),
  worldEngine.getRecentEvents(worldState),
  '你好，三月七'
);
```

### 3.7 CharacterAgent.generateDualCharacterResponses

```typescript
async generateDualCharacterResponses(
  characterA: Character,
  characterB: Character,
  scene: SceneConfig,
  knownInfoA: Information[],
  knownInfoB: Information[],
  recentEvents: EventRecord[],
  userInput?: string
): Promise<DualCharacterResponse>
```

**参数**：

- `characterA`: 角色 A
- `characterB`: 角色 B
- `scene`: 当前场景
- `knownInfoA`: 角色 A 已知信息
- `knownInfoB`: 角色 B 已知信息
- `recentEvents`: 最近事件
- `userInput`: 用户输入（可选）

**返回值**：DualCharacterResponse

**使用示例**：

```typescript
const result = await characterAgent.generateDualCharacterResponses(
  march7,
  stelle,
  currentScene,
  visionManager.getFilteredVision('march7', informationStore),
  visionManager.getFilteredVision('stelle', informationStore),
  worldEngine.getRecentEvents(worldState)
);
// result.responseA 是三月七的响应
// result.responseB 是星的响应
```

---

## 四、配置文件

### 4.1 响应格式指令

**位置**：`packages/core/src/character-agent/prompt-builder.ts`

**响应格式**：

```json
{
  "type": "dialogue" | "action" | "mixed",
  "dialogue": "你说的话（如果有）",
  "action": "你的行动描述（如果有）",
  "innerThought": "你的内心想法（可选）",
  "emotion": "当前情绪状态"
}
```

---

## 五、验收标准

对应 WBS 中的验收标准：

- [x] **P1-CA-01**: 接口文档或类型定义：输入仅含该人物状态与视野、当前场景描述
- [x] **P1-CA-02**: 单角色调用下生成对话或行动；不泄露未在视野中的信息
- [x] **P1-CA-03**: 在场 2 人分别注入各自视野后调用；返回 2 份输出供编排使用

---

## 六、测试用例

**测试文件位置**：`packages/core/src/character-agent/__tests__/character-agent.test.ts`

### PromptBuilder 测试

| 测试用例                                             | 测试目的                     | 预期结果                 |
| ---------------------------------------------------- | ---------------------------- | ------------------------ |
| should describe high openness correctly              | 验证高开放性描述             | 包含"富有好奇心和想象力" |
| should describe low openness correctly               | 验证低开放性描述             | 包含"务实保守"           |
| should describe high extraversion correctly          | 验证高外向性描述             | 包含"外向活泼"           |
| should describe low extraversion correctly           | 验证低外向性描述             | 包含"内敛沉稳"           |
| should return default description for neutral traits | 验证中性特质描述             | 返回"性格平和"           |
| should build prompt with character info              | 验证 Prompt 包含角色信息     | 包含角色名和场景名       |
| should include known information in prompt           | 验证 Prompt 包含已知信息     | 包含已知信息内容         |
| should include recent events in prompt               | 验证 Prompt 包含最近事件     | 包含事件描述             |
| should include user input when provided              | 验证 Prompt 包含用户输入     | 包含用户输入内容         |
| should include response type hint for dialogue       | 验证对话类型提示             | 包含"请以对话形式回应"   |
| should include response type hint for action         | 验证行动类型提示             | 包含"请以行动形式回应"   |
| should include abilities in prompt                   | 验证 Prompt 包含能力         | 包含能力描述             |
| should include relationships with present characters | 验证 Prompt 包含关系         | 包含与在场角色的关系     |
| should include vision isolation rules                | 验证 Prompt 包含视野隔离规则 | 包含"严格遵守视野限制"   |

### CharacterAgent 测试

| 测试用例                                                    | 测试目的               | 预期结果                          |
| ----------------------------------------------------------- | ---------------------- | --------------------------------- |
| should parse JSON dialogue response                         | 验证对话 JSON 解析     | 正确解析 type 和 dialogue         |
| should parse JSON action response                           | 验证行动 JSON 解析     | 正确解析 type 和 action           |
| should parse JSON mixed response                            | 验证混合 JSON 解析     | 正确解析 type、dialogue 和 action |
| should infer type from content when type is missing         | 验证类型推断           | 根据内容推断类型                  |
| should handle plain text as dialogue                        | 验证纯文本处理         | 作为对话处理                      |
| should extract JSON from mixed content                      | 验证混合内容 JSON 提取 | 正确提取 JSON                     |
| should handle malformed JSON gracefully                     | 验证错误 JSON 处理     | 优雅降级为对话                    |
| should call LLM provider with correct prompts               | 验证 LLM 调用          | 正确调用 provider                 |
| should include usage statistics in response                 | 验证 Token 统计        | 包含 usage 信息                   |
| should generate responses for both characters               | 验证双角色响应         | 返回两个角色的响应                |
| should inject different known info for each character       | 验证视野隔离           | 各角色使用不同信息                |
| should generate responses for multiple characters           | 验证多角色响应         | 返回所有角色的响应                |
| should detect no leakage when response uses only known info | 验证无泄露检测         | isValid 为 true                   |
| should detect leakage when response contains unknown info   | 验证泄露检测           | isValid 为 false                  |

### 运行测试

```bash
cd packages/core && pnpm test
```

**测试结果**：103 passed, 0 failed（包含 VisionManager 15 个 + CharacterState 24 个 + InputParser 31 个 + CharacterAgent 33 个）

---

## 七、已知限制

1. **信息泄露检测简单**：当前使用简单的关键词匹配检测信息泄露，对于中文支持有限，后续可考虑使用更复杂的语义匹配
2. **响应格式依赖 LLM**：响应格式解析依赖 LLM 按指定格式输出，不同 LLM 可能有不同的遵循程度
3. **并行调用无冲突处理**：多角色并行调用时未实现冲突裁决，Phase 2 将实现（P2-CA-01）
4. **Prompt 模板固定**：当前 Prompt 模板为硬编码，后续可考虑支持配置化

---

## 八、变更记录

| 日期       | 版本  | 变更内容                                           | 变更人          |
| ---------- | ----- | -------------------------------------------------- | --------------- |
| 2026-02-05 | 0.1.0 | 初始实现：基础 Prompt 构建和响应生成               | Claude Opus 4.5 |
| 2026-02-05 | 0.1.1 | 增强：响应类型、双角色支持、响应解析、信息泄露验证 | Claude Opus 4.5 |
