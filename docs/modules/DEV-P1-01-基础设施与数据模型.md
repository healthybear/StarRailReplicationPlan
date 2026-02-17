# DEV-P1-01 基础设施与数据模型

## 一、模块概述

### 1.1 模块目标

建立项目的基础设施层和核心数据模型，为上层业务逻辑提供稳定的数据结构和基础服务支持。

### 1.2 对应 WBS 任务 ID

- **P1-INF-01**: 定义核心数据模型（Character/WorldState/Information）
- **P1-INF-02**: 定义存储形态与读写接口（状态、信息库）
- **P1-INF-03**: 配置加载（JSON/YAML）与配置样例

### 1.3 依赖模块

无（基础模块）

### 1.4 被依赖模块

- DEV-P1-02 视野与信息
- DEV-P1-03 人物状态演化
- DEV-P1-04 输入解析
- DEV-P1-05 角色Agent
- DEV-P1-06 剧情编排
- DEV-P1-07 导出导入
- DEV-P1-08 锚点与对比
- DEV-P1-09 表现层UI

---

## 二、功能清单

### 2.1 数据模型（packages/types）

| 功能名称     | 功能描述                               | 核心类型/Schema                               | 文件位置                                                                     |
| ------------ | -------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| 人物数据模型 | 定义人物的基础信息、状态、人格、关系等 | `CharacterSchema`                             | [packages/types/src/character.ts](../../packages/types/src/character.ts)     |
| 世界状态模型 | 定义世界的场景、环境、时间线、事件链等 | `WorldStateSchema`                            | [packages/types/src/world-state.ts](../../packages/types/src/world-state.ts) |
| 信息模型     | 定义信息的来源、内容、时间戳等         | `InformationSchema`                           | [packages/types/src/information.ts](../../packages/types/src/information.ts) |
| 会话状态模型 | 定义会话的完整状态（世界+人物+信息）   | `SessionStateSchema`                          | [packages/types/src/session.ts](../../packages/types/src/session.ts)         |
| 锚点模型     | 定义锚点数据结构和对比结果             | `AnchorSchema`                                | [packages/types/src/anchor.ts](../../packages/types/src/anchor.ts)           |
| 配置模型     | 定义LLM配置、触发表配置等              | `LLMConfigSchema`, `TriggerTableConfigSchema` | [packages/types/src/config.ts](../../packages/types/src/config.ts)           |

### 2.2 基础设施服务（packages/infrastructure）

| 功能名称          | 功能描述                                 | 核心类/接口          | 文件位置                                                                                                                               |
| ----------------- | ---------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 配置加载器        | 加载和保存YAML/JSON配置文件，支持Zod校验 | `ConfigLoader`       | [packages/infrastructure/src/config/config-loader.ts](../../packages/infrastructure/src/config/config-loader.ts)                       |
| 环境变量加载      | 加载.env文件，提供环境变量访问           | `EnvLoader`          | [packages/infrastructure/src/config/env-loader.ts](../../packages/infrastructure/src/config/env-loader.ts)                             |
| 存储接口          | 定义会话状态和快照的存储操作             | `StorageAdapter`     | [packages/infrastructure/src/storage/storage.interface.ts](../../packages/infrastructure/src/storage/storage.interface.ts)             |
| JSON文件存储      | 基于文件系统的存储实现                   | `JsonFileStorage`    | [packages/infrastructure/src/storage/json-file-storage.ts](../../packages/infrastructure/src/storage/json-file-storage.ts)             |
| LLM Provider接口  | 定义LLM服务的统一调用接口                | `LLMProvider`        | [packages/infrastructure/src/llm/llm-provider.interface.ts](../../packages/infrastructure/src/llm/llm-provider.interface.ts)           |
| LLM Provider工厂  | 管理和创建LLM Provider实例               | `LLMProviderFactory` | [packages/infrastructure/src/llm/llm-provider.factory.ts](../../packages/infrastructure/src/llm/llm-provider.factory.ts)               |
| Deepseek Provider | Deepseek API的实现                       | `DeepseekProvider`   | [packages/infrastructure/src/llm/providers/deepseek.provider.ts](../../packages/infrastructure/src/llm/providers/deepseek.provider.ts) |
| Claude Provider   | Claude API的实现                         | `ClaudeProvider`     | [packages/infrastructure/src/llm/providers/claude.provider.ts](../../packages/infrastructure/src/llm/providers/claude.provider.ts)     |
| 日志服务          | 基于Winston的日志管理                    | `Logger`             | [packages/infrastructure/src/logging/logger.ts](../../packages/infrastructure/src/logging/logger.ts)                                   |
| 错误处理          | 统一的错误类型和处理                     | `AppError`           | [packages/infrastructure/src/error/app-error.ts](../../packages/infrastructure/src/error/app-error.ts)                                 |

---

## 三、API 接口

### 3.1 数据模型核心Schema

#### Character（人物）

```typescript
import { CharacterSchema, type Character } from '@star-rail/types';

// 人物包含：
// - id, name, faction（基础信息）
// - profileConfigPath（人设配置引用）
// - state（关系、能力、已知信息）
// - personality（五大人格、价值观、行为倾向）
// - metadata（创建/更新时间）

// 使用示例
const character: Character = {
  id: 'march7',
  name: '三月七',
  faction: '星穹列车',
  state: {
    relationships: {},
    abilities: {},
    knownInformation: [],
  },
  personality: {
    traits: {
      openness: 0.8,
      conscientiousness: 0.6,
      extraversion: 0.9,
      agreeableness: 0.8,
      neuroticism: 0.3,
    },
    values: {
      selfDirection: 0.7,
      benevolence: 0.8,
      security: 0.6,
    },
  },
};

// 校验
CharacterSchema.parse(character);
```

#### WorldState（世界状态）

```typescript
import { WorldStateSchema, type WorldState } from '@star-rail/types';

// 世界状态包含：
// - currentSceneId（当前场景）
// - timeline（时间线和回合数）
// - environment（物理环境、社会环境、氛围）
// - eventChain（事件链）
// - currentPlotNodeId（当前剧情节点）

const worldState: WorldState = {
  currentSceneId: 'belobog_plaza',
  timeline: {
    currentTurn: 1,
    timestamp: Date.now(),
  },
  environment: {
    physical: {
      weather: 'snowy',
      temperature: -10,
      lighting: 'dim',
    },
    social: {
      factions: {},
    },
    atmosphere: {
      tension: 0.3,
    },
  },
  eventChain: [],
};
```

#### SessionState（会话状态）

```typescript
import { SessionStateSchema, type SessionState } from '@star-rail/types';

// 会话状态是单文件存储的完整状态
// 包含：worldState, characters, information, metadata

const sessionState: SessionState = {
  worldState: worldState,
  characters: {
    march7: character,
  },
  information: {
    global: [],
    byCharacter: {},
  },
  metadata: {
    sessionId: 'session_001',
    sessionName: '贝洛伯格初遇',
    createdAt: Date.now(),
    lastSaved: Date.now(),
    version: '1.0.0',
  },
};
```

### 3.2 配置加载器

```typescript
import { ConfigLoader } from '@star-rail/infrastructure';
import { LLMConfigSchema } from '@star-rail/types';

const configLoader = new ConfigLoader('./config');

// 加载YAML配置
const llmConfig = await configLoader.loadYaml('llm.yaml', LLMConfigSchema);

// 加载JSON配置
const evalConfig = await configLoader.loadJson(
  'evaluation.json',
  EvaluationSchema
);

// 批量加载目录
const characters = await configLoader.loadDirectory(
  'characters',
  CharacterConfigSchema
);

// 保存配置
await configLoader.saveYaml('llm.yaml', llmConfig);
```

### 3.3 存储接口

```typescript
import { JsonFileStorage } from '@star-rail/infrastructure';
import type { SessionState } from '@star-rail/types';

const storage = new JsonFileStorage('./data');

// 保存会话
await storage.saveSession('session_001', sessionState);

// 加载会话
const loadedState = await storage.loadSession('session_001');

// 列出所有会话
const sessions = await storage.listSessions();

// 保存快照
await storage.saveSnapshot('session_001', snapshot);

// 加载快照
const loadedSnapshot = await storage.loadSnapshot(
  'session_001',
  'snapshot_001'
);
```

### 3.4 LLM Provider

```typescript
import { LLMProviderFactory } from '@star-rail/infrastructure';
import type { LLMMessage } from '@star-rail/infrastructure';

const factory = new LLMProviderFactory(llmConfig);

// 获取默认Provider
const provider = factory.getProvider();

// 获取指定Provider
const claudeProvider = factory.getProvider('claude');

// 获取角色专用Provider
const characterProvider = factory.getProviderForCharacter('march7');

// 生成响应
const messages: LLMMessage[] = [
  { role: 'system', content: '你是三月七' },
  { role: 'user', content: '你好' },
];

const response = await provider.generate(messages, {
  temperature: 0.7,
  maxTokens: 2000,
});

console.log(response.content);
console.log(response.usage);
```

### 3.5 日志服务

```typescript
import { Logger } from '@star-rail/infrastructure';

const logger = new Logger('ModuleName');

logger.info('信息日志', { key: 'value' });
logger.warn('警告日志');
logger.error('错误日志', error, { context: 'additional info' });
logger.debug('调试日志');
```

---

## 四、配置文件

### 4.1 LLM配置

**文件路径**: [config/llm.yaml](../../config/llm.yaml)

```yaml
# 默认Provider
defaultProvider: deepseek

# Provider配置
providers:
  deepseek:
    enabled: true
    model: deepseek-chat
    baseUrl: https://api.deepseek.com/v1
    defaultParams:
      temperature: 0.7
      maxTokens: 2000
      topP: 0.95

  claude:
    enabled: true
    model: claude-sonnet-4-5-20250929
    defaultParams:
      temperature: 0.7
      maxTokens: 2000

# 角色专用Provider（可选）
characterProviders:
  # march7: deepseek
  # stelle: claude
```

### 4.2 环境变量

**文件路径**: [.env.example](../../.env.example)

```bash
# LLM API Keys
DEEPSEEK_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
DOUBAO_API_KEY=xxxxx

# Application
NODE_ENV=development
LOG_LEVEL=info
```

### 4.3 数据存储目录结构

```
data/
├── sessions/
│   ├── session_001/
│   │   ├── state.json          # 当前完整状态
│   │   ├── snapshots/
│   │   │   ├── snapshot_001.json
│   │   │   └── snapshot_002.json
│   │   └── metadata.json       # 会话元数据
│   └── session_002/
│       └── ...
└── anchors/
    ├── belobog_storyline/
    │   ├── node_first_meet.json
    │   └── node_boss_fight.json
    └── ...
```

---

## 五、验收标准

基于 WBS 任务 P1-INF-01~03 的验收标准：

### 5.1 P1-INF-01: 核心数据模型

- [x] Character Schema 定义完整（基础信息、状态、人格）
- [x] WorldState Schema 定义完整（场景、环境、时间线、事件链）
- [x] Information Schema 定义完整（来源、内容、时间戳）
- [x] SessionState Schema 定义完整（单文件存储结构）
- [x] Relationship Schema 定义完整（多维度关系）
- [x] BigFiveTraits Schema 定义完整（五大人格）
- [x] BehaviorTendencies Schema 定义完整（行为倾向）
- [x] 所有 Schema 使用 Zod 实现，支持运行时校验
- [x] 所有 Schema 支持类型推导（`z.infer<typeof Schema>`）

### 5.2 P1-INF-02: 存储形态与读写接口

- [x] StorageAdapter 接口定义完整
- [x] JsonFileStorage 实现完整（会话状态读写）
- [x] 支持快照保存与加载
- [x] 支持会话列表查询
- [x] 支持会话存在性检查
- [x] 文件存储采用单文件方式（state.json）
- [x] 快照存储在独立目录（snapshots/）

### 5.3 P1-INF-03: 配置加载

- [x] ConfigLoader 支持 YAML 配置加载
- [x] ConfigLoader 支持 JSON 配置加载
- [x] ConfigLoader 支持目录批量加载
- [x] ConfigLoader 支持 Zod Schema 校验
- [x] ConfigLoader 支持配置保存
- [x] EnvLoader 支持 .env 文件加载
- [x] LLM 配置文件（llm.yaml）存在且格式正确
- [x] 环境变量模板（.env.example）存在
- [x] LLM Provider Factory 可根据配置创建 Provider
- [x] 支持多个 Provider 同时存在
- [x] 支持角色专用 Provider 配置

---

## 六、测试用例

### 6.1 数据模型测试

| 测试用例                 | 测试目的                       | 预期结果                       | 测试文件位置 |
| ------------------------ | ------------------------------ | ------------------------------ | ------------ |
| Character Schema 校验    | 验证人物数据结构的完整性和约束 | 合法数据通过，非法数据抛出错误 | 待补充       |
| WorldState Schema 校验   | 验证世界状态数据结构           | 合法数据通过，非法数据抛出错误 | 待补充       |
| SessionState Schema 校验 | 验证会话状态完整性             | 合法数据通过，非法数据抛出错误 | 待补充       |
| 关系维度范围校验         | 验证关系值在 0-1 范围内        | 超出范围的值抛出错误           | 待补充       |
| 五大人格范围校验         | 验证人格特质值在 0-1 范围内    | 超出范围的值抛出错误           | 待补充       |

### 6.2 配置加载测试

| 测试用例       | 测试目的                       | 预期结果              | 测试文件位置 |
| -------------- | ------------------------------ | --------------------- | ------------ |
| YAML 配置加载  | 验证 YAML 文件正确解析         | 配置对象正确生成      | 待补充       |
| JSON 配置加载  | 验证 JSON 文件正确解析         | 配置对象正确生成      | 待补充       |
| 配置校验失败   | 验证不符合 Schema 的配置被拒绝 | 抛出 Zod 校验错误     | 待补充       |
| 目录批量加载   | 验证批量加载多个配置文件       | 返回 Map 包含所有配置 | 待补充       |
| 配置文件不存在 | 验证文件不存在时的处理         | 抛出明确错误          | 待补充       |

### 6.3 存储接口测试

| 测试用例       | 测试目的                 | 预期结果             | 测试文件位置 |
| -------------- | ------------------------ | -------------------- | ------------ |
| 会话保存与加载 | 验证会话状态持久化       | 保存后能正确加载     | 待补充       |
| 快照保存与加载 | 验证快照功能             | 快照能正确保存和恢复 | 待补充       |
| 会话列表查询   | 验证列出所有会话         | 返回所有会话 ID      | 待补充       |
| 会话不存在处理 | 验证加载不存在的会话     | 返回 null            | 待补充       |
| 并发写入安全   | 验证并发保存的数据一致性 | 数据不丢失不损坏     | 待补充       |

### 6.4 LLM Provider 测试

| 测试用例           | 测试目的                       | 预期结果                  | 测试文件位置 |
| ------------------ | ------------------------------ | ------------------------- | ------------ |
| Provider 创建      | 验证 Factory 正确创建 Provider | 返回对应的 Provider 实例  | 待补充       |
| 默认 Provider 获取 | 验证获取默认 Provider          | 返回配置中的默认 Provider | 待补充       |
| 角色专用 Provider  | 验证角色专用 Provider 配置     | 返回角色指定的 Provider   | 待补充       |
| Provider 不存在    | 验证获取不存在的 Provider      | 抛出明确错误              | 待补充       |
| API 调用（Mock）   | 验证 LLM API 调用流程          | 返回正确的响应格式        | 待补充       |

---

## 七、已知限制

### 7.1 Phase 1 限制

1. **存储方式**: 当前使用 JSON 文件存储，Phase 2-3 可扩展为数据库存储（better-sqlite3 / MongoDB）
2. **快照策略**: 当前为完整快照，Phase 2-3 可优化为增量快照以节省空间
3. **LLM 功能**: 当前仅支持基础的文本生成，Phase 2-3 扩展流式输出和函数调用
4. **配置热更新**: 当前不支持配置热更新，需要重启应用
5. **并发控制**: 当前文件存储未实现锁机制，不适合高并发场景

### 7.2 后续优化方向（记录在优化计划）

- **数据库存储**: 迁移到 better-sqlite3 或 MongoDB
- **增量快照**: 实现增量快照以减少存储空间
- **流式输出**: 支持 LLM 流式响应
- **函数调用**: 支持 LLM Function Calling
- **配置热更新**: 支持配置文件变更自动重载
- **存储优化**: 实现文件锁和事务支持

---

## 八、变更记录

| 日期       | 版本 | 变更内容                               | 变更人            |
| ---------- | ---- | -------------------------------------- | ----------------- |
| 2026-02-17 | v1.0 | 初始版本，记录基础设施与数据模型的实现 | Claude Sonnet 4.5 |
