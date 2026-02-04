# Phase 1 MVP 开发落地方案

**文档版本**：v1.1
**创建日期**：2026-02-05
**状态**：已确认
**对应里程碑**：M2 → M3（Phase 1 MVP 开发完成）

---

## 一、文档目标

本文档记录 Phase 1 MVP 开发的所有技术决策和落地方案，基于多轮技术讨论的结果，为项目初始化和开发提供明确指导。

**讨论轮次**：
- 第一轮：项目结构与开发环境
- 第二轮：数据模型与配置格式
- 第三轮：LLM 接口抽象与模块依赖关系
- 第四轮：行为模型深入设计
- 第五轮：配置加载、Prompt 管理、CLI 交互、错误处理与日志
- 第六轮：测试策略、Git 工作流、开发标准

---

## 二、技术选型总览

### 2.1 第一轮讨论结果：项目结构与开发环境

| 项目 | 选择 | 说明 |
|------|------|------|
| 项目结构 | **Monorepo** | packages/core, infrastructure, cli, types |
| 包管理工具 | **pnpm** + workspace | 更快、更节省空间 |
| Node.js 版本 | **20.x LTS** | 长期支持版本 |
| 模块系统 | **ESM** | `"type": "module"` |
| TypeScript | **5.x** | 类型安全 |
| 构建工具 | **tsup** | 快速构建 |
| 代码规范 | **ESLint + Prettier** | 统一代码风格 |
| Git Hooks | **Husky + lint-staged** | 提交前检查 |
| 架构方案 | **CLI + tsyringe（DI）** | 轻量且易迁移到 NestJS |
| CLI 技术栈 | Commander.js + Inquirer.js + Chalk + Ora | 交互式命令行 |

### 2.2 项目目录结构

```
StarRailReplicationPlan/
├── packages/
│   ├── core/              # 核心领域层（8大模块）
│   │   ├── src/
│   │   │   ├── character-agent/
│   │   │   ├── character-state/
│   │   │   ├── vision-manager/
│   │   │   ├── world-engine/
│   │   │   ├── input-parser/
│   │   │   ├── story-orchestrator/
│   │   │   ├── anchor-evaluation/
│   │   │   ├── export-import/
│   │   │   └── container.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── infrastructure/    # 基础设施层
│   │   ├── src/
│   │   │   ├── llm/
│   │   │   │   ├── llm-provider.interface.ts
│   │   │   │   ├── llm-provider.factory.ts
│   │   │   │   └── providers/
│   │   │   │       ├── deepseek.provider.ts
│   │   │   │       ├── claude.provider.ts
│   │   │   │       └── doubao.provider.ts
│   │   │   ├── storage/
│   │   │   │   ├── storage.interface.ts
│   │   │   │   └── json-file-storage.ts
│   │   │   └── config/
│   │   │       └── config-loader.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/              # CLI 表现层
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   ├── ui/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── types/            # 共享类型定义
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── config/               # 配置文件
│   ├── characters/       # 人物配置
│   │   ├── march7.yaml
│   │   └── stelle.yaml
│   ├── scenes/          # 场景配置
│   ├── triggers/        # 触发表配置
│   │   ├── relationship_triggers.yaml
│   │   └── ability_triggers.yaml
│   ├── llm.yaml         # LLM 配置
│   └── evaluation.json  # 评估权重配置
│
├── data/                # 运行时数据
│   ├── sessions/        # 会话数据
│   └── anchors/         # 锚点数据
│
├── exports/             # 导出包存储
│
├── .env                 # 敏感配置（不提交）
├── .env.example         # 配置模板
├── pnpm-workspace.yaml  # pnpm workspace 配置
├── package.json         # 根 package.json
├── tsconfig.json        # 根 TypeScript 配置
├── .eslintrc.js         # ESLint 配置
├── .prettierrc          # Prettier 配置
└── README.md
```

---

## 三、数据模型设计

### 3.1 第二轮讨论结果：数据模型实现方式

**选择**：**Zod**（运行时校验 + 类型推导）

**理由**：
- ✅ 运行时校验（导入/导出时校验数据）
- ✅ 自动类型推导（`type Character = z.infer<typeof CharacterSchema>`）
- ✅ 与 JSON 配置文件天然契合
- ✅ 错误信息友好

### 3.2 核心实体 Schema

#### Character（人物）

```typescript
import { z } from 'zod';

// 关系 Schema（多维度）
export const RelationshipSchema = z.object({
  trust: z.number().min(0).max(1),      // 信任度
  hostility: z.number().min(0).max(1),  // 敌对度
  intimacy: z.number().min(0).max(1),   // 亲密度
  respect: z.number().min(0).max(1),    // 尊重度
  // 扩展字段（可选）
  custom: z.record(z.number().min(0).max(1)).optional()
});

// 五大人格 Schema
export const BigFiveTraitsSchema = z.object({
  openness: z.number().min(0).max(1),           // 开放性
  conscientiousness: z.number().min(0).max(1),  // 尽责性
  extraversion: z.number().min(0).max(1),       // 外向性
  agreeableness: z.number().min(0).max(1),      // 宜人性
  neuroticism: z.number().min(0).max(1)         // 神经质
});

// 行为倾向 Schema
export const BehaviorTendenciesSchema = z.object({
  exploration: z.number().min(0).max(1),    // 探索倾向
  cooperation: z.number().min(0).max(1),    // 合作倾向
  caution: z.number().min(0).max(1),        // 谨慎倾向
  impulsivity: z.number().min(0).max(1),    // 冲动倾向
  assertiveness: z.number().min(0).max(1)   // 自信倾向
});

// 人物 Schema
export const CharacterSchema = z.object({
  // 基础信息
  id: z.string(),
  name: z.string(),
  faction: z.string().optional(),

  // 人设配置引用
  profileConfigPath: z.string().optional(),

  // 当前状态
  state: z.object({
    // 关系（与其他人物）
    relationships: z.record(RelationshipSchema),

    // 能力
    abilities: z.record(z.number().min(0).max(100)),

    // 已知信息（视野）
    knownInformation: z.array(z.object({
      informationId: z.string(),
      acquiredAt: z.number(),
      confidence: z.number().min(0).max(1).optional()
    }))
  }),

  // 人格模型
  personality: z.object({
    traits: BigFiveTraitsSchema,
    values: z.object({
      self_direction: z.number().min(0).max(1),
      benevolence: z.number().min(0).max(1),
      security: z.number().min(0).max(1)
    }),
    behavior_tendencies: BehaviorTendenciesSchema.optional()
  }),

  // 元数据
  metadata: z.object({
    createdAt: z.number(),
    updatedAt: z.number()
  }).optional()
});

export type Character = z.infer<typeof CharacterSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type BigFiveTraits = z.infer<typeof BigFiveTraitsSchema>;
export type BehaviorTendencies = z.infer<typeof BehaviorTendenciesSchema>;
```

#### WorldState（世界状态）

```typescript
// 物理环境 Schema（固定结构 + 渐进式扩展）
export const PhysicalEnvironmentSchema = z.object({
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'snowy', 'foggy']).optional(),
  temperature: z.number().min(-50).max(50).optional(),
  lighting: z.enum(['bright', 'dim', 'dark']).optional(),
  timeOfDay: z.enum(['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night']).optional(),
  sceneCondition: z.object({
    damaged: z.boolean().optional(),
    accessible: z.boolean().optional(),
    crowded: z.boolean().optional()
  }).optional(),
  // 扩展字段（Phase 2-3）
  custom: z.record(z.union([z.string(), z.number(), z.boolean()])).optional()
});

// 世界状态 Schema
export const WorldStateSchema = z.object({
  currentSceneId: z.string(),
  timeline: z.object({
    currentTurn: z.number(),
    timestamp: z.number()
  }),
  environment: z.object({
    physical: PhysicalEnvironmentSchema,
    social: z.object({
      factions: z.record(z.object({
        attitude: z.number(),
        control: z.number()
      }))
    }),
    atmosphere: z.object({
      tension: z.number().min(0).max(1),
      mood: z.string().optional()
    })
  }),
  eventChain: z.array(z.object({
    eventId: z.string(),
    timestamp: z.number(),
    sceneId: z.string(),
    participants: z.array(z.string())
  })),
  currentPlotNodeId: z.string().optional()
});

export type WorldState = z.infer<typeof WorldStateSchema>;
```

#### Information（信息）

```typescript
export const InformationSchema = z.object({
  id: z.string(),
  content: z.string(),
  source: z.enum(['witnessed', 'heard', 'told', 'inferred']),
  timestamp: z.number(),
  sceneId: z.string(),
  relatedEventId: z.string().optional(),
  isKeyMemory: z.boolean().optional()
});

export type Information = z.infer<typeof InformationSchema>;
```

#### SessionState（会话状态 - 单文件存储）

```typescript
export const SessionStateSchema = z.object({
  worldState: WorldStateSchema,
  characters: z.record(CharacterSchema),
  information: z.object({
    global: z.array(InformationSchema),
    byCharacter: z.record(z.array(z.string()))
  }),
  metadata: z.object({
    sessionId: z.string(),
    sessionName: z.string(),
    createdAt: z.number(),
    lastSaved: z.number(),
    version: z.string()
  })
});

export type SessionState = z.infer<typeof SessionStateSchema>;
```

### 3.3 配置文件格式

#### 配置文件组织方式

**选择**：按类型分目录（方案 A）

```
config/
├── characters/           # 人物配置
│   ├── march7.yaml
│   ├── stelle.yaml
│   └── schema.json       # JSON Schema（可选）
├── scenes/              # 场景配置
│   ├── belobog_plaza.yaml
│   └── schema.json
├── triggers/            # 触发表配置
│   ├── relationship_triggers.yaml
│   └── ability_triggers.yaml
├── llm.yaml             # LLM 配置
└── evaluation.json      # 评估权重配置
```

### 3.4 存储层文件结构

**选择**：单文件存储（Phase 1）

```
data/
├── sessions/
│   ├── session_001/
│   │   ├── state.json          # 当前完整状态
│   │   ├── snapshots/
│   │   │   ├── snapshot_001.json
│   │   │   ├── snapshot_002.json
│   │   │   └── ...
│   │   └── metadata.json       # 会话元数据
│   └── ...
├── anchors/
│   ├── belobog_storyline/
│   │   ├── node_first_meet.json
│   │   ├── node_boss_fight.json
│   │   └── ...
│   └── ...
└── .gitkeep
```

**优点**：
- ✅ 单次读写，性能更好
- ✅ 原子性操作
- ✅ 便于备份和恢复
- ✅ 结构简单

**后续扩展**（Phase 3）：
- 数据库存储（better-sqlite3 / MongoDB）
- 增量快照（节省空间）

---

## 四、LLM 接口抽象

### 4.1 第三轮讨论结果：LLM Provider 设计

**需求**：
- 支持多家 LLM API（Deepseek、豆包、Claude）
- 支持多个 Provider 同时存在
- 配置管理（API Key 独立文件）
- Phase 2-3 扩展（流式输出、函数调用）

### 4.2 LLM Provider 接口

```typescript
// packages/infrastructure/src/llm/llm-provider.interface.ts

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface LLMGenerateResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'content_filter';
}

export interface LLMProvider {
  generate(
    messages: LLMMessage[],
    options?: LLMGenerateOptions
  ): Promise<LLMGenerateResponse>;

  getName(): string;

  // Phase 2-3 扩展（可选方法）
  generateStream?(
    messages: LLMMessage[],
    options?: LLMGenerateOptions
  ): AsyncIterable<LLMStreamChunk>;

  generateWithFunctions?(
    messages: LLMMessage[],
    functions: LLMFunction[],
    options?: LLMGenerateOptions
  ): Promise<LLMFunctionCallResponse>;
}
```

### 4.3 LLM 配置管理

#### config/llm.yaml

```yaml
# 默认 Provider
default_provider: deepseek

# Provider 配置
providers:
  deepseek:
    enabled: true
    model: deepseek-chat
    base_url: https://api.deepseek.com/v1
    default_params:
      temperature: 0.7
      max_tokens: 2000
      top_p: 0.95
  
  claude:
    enabled: true
    model: claude-sonnet-4-5-20250929
    default_params:
      temperature: 0.7
      max_tokens: 2000
  
  doubao:
    enabled: false
    model: doubao-pro-32k
    base_url: https://ark.cn-beijing.volces.com/api/v3
    default_params:
      temperature: 0.7
      max_tokens: 2000

# 角色专用 Provider（可选）
character_providers:
  character_march7: deepseek
  character_stelle: claude
```

#### .env（敏感配置）

```bash
# Deepseek
DEEPSEEK_API_KEY=sk-xxxxx

# Claude
ANTHROPIC_API_KEY=sk-ant-xxxxx

# 豆包
DOUBAO_API_KEY=xxxxx
```

### 4.4 LLM Provider Factory

```typescript
// packages/infrastructure/src/llm/llm-provider.factory.ts

@injectable()
export class LLMProviderFactory {
  private providers: Map<string, LLMProvider> = new Map();
  private config: LLMConfig;

  constructor(@inject('LLMConfig') config: LLMConfig) {
    this.config = config;
    this.initializeProviders();
  }

  private initializeProviders() {
    for (const [name, providerConfig] of Object.entries(this.config.providers)) {
      if (!providerConfig.enabled) continue;

      let provider: LLMProvider;
      switch (name) {
        case 'deepseek':
          provider = new DeepseekProvider(providerConfig);
          break;
        case 'claude':
          provider = new ClaudeProvider(providerConfig);
          break;
        case 'doubao':
          provider = new DoubaoProvider(providerConfig);
          break;
        default:
          throw new Error(`Unknown LLM provider: ${name}`);
      }

      this.providers.set(name, provider);
    }
  }

  getProvider(name?: string): LLMProvider {
    const providerName = name || this.config.default_provider;
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`LLM provider not found: ${providerName}`);
    }
    
    return provider;
  }

  getProviderForCharacter(characterId: string): LLMProvider {
    const providerName = this.config.character_providers?.[characterId];
    return this.getProvider(providerName);
  }
}
```

---

## 五、行为模型设计

### 5.1 第四轮讨论结果：混合模型（方案 C）

**选择**：五大人格（稳定特质）+ 动态状态（Phase 2-3）+ 行为倾向

**Phase 1 实现范围**：
- 五大人格（Big Five）- 5 个维度
- 核心价值观 - 3 个维度（简化版）
- 基础行为倾向 - 5 个维度
- 简单的推导逻辑（硬编码公式）

**Phase 2-3 扩展**（记录到优化文档）：
- 动态情绪状态
- 动态动机强度
- 认知风格

### 5.2 行为推导公式

从五大人格推导行为倾向的公式（基于心理学研究）：

- **探索倾向** = 0.7 × 开放性 + 0.3 × 外向性
- **合作倾向** = 0.7 × 宜人性 + 0.3 × 外向性
- **谨慎倾向** = 0.6 × 尽责性 + 0.4 × 神经质
- **冲动倾向** = 0.6 × (1 - 尽责性) + 0.4 × 外向性
- **自信倾向** = 0.7 × 外向性 + 0.3 × (1 - 神经质)

### 5.3 触发表机制

触发表定义事件如何影响人物状态（关系、能力等）。

**触发表结构**：
- event_type：事件类型
- effects：效果列表（target, change_type, value, min, max）
- conditions：触发条件（可选）

**变化类型**：
- delta：增量变化
- multiply：乘法变化
- set：直接设置

---

## 六、配置管理与 Prompt 构建

### 6.1 第五轮讨论结果：配置加载与 Prompt 管理

#### 配置加载方案

**选择**：统一配置加载器（方案 A）

**实现方案**：
```typescript
// packages/infrastructure/src/config/config-loader.ts

import { z } from 'zod';
import yaml from 'js-yaml';
import fs from 'fs/promises';
import path from 'path';

export class ConfigLoader {
  private configDir: string;

  constructor(configDir: string = './config') {
    this.configDir = configDir;
  }

  // 加载 YAML 配置
  async loadYaml<T>(filePath: string, schema: z.ZodSchema<T>): Promise<T> {
    const fullPath = path.join(this.configDir, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const data = yaml.load(content);
    return schema.parse(data);
  }

  // 加载 JSON 配置
  async loadJson<T>(filePath: string, schema: z.ZodSchema<T>): Promise<T> {
    const fullPath = path.join(this.configDir, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const data = JSON.parse(content);
    return schema.parse(data);
  }

  // 批量加载目录下的配置
  async loadDirectory<T>(
    dirPath: string,
    schema: z.ZodSchema<T>
  ): Promise<Map<string, T>> {
    const fullPath = path.join(this.configDir, dirPath);
    const files = await fs.readdir(fullPath);
    const configs = new Map<string, T>();

    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const config = await this.loadYaml(path.join(dirPath, file), schema);
        configs.set(file.replace(/\.ya?ml$/, ''), config);
      } else if (file.endsWith('.json')) {
        const config = await this.loadJson(path.join(dirPath, file), schema);
        configs.set(file.replace('.json', ''), config);
      }
    }

    return configs;
  }
}
```

#### Prompt 管理方案

**Phase 1**：硬编码 Prompt（快速开发）

```typescript
// packages/core/src/character-agent/prompt-builder.ts

export class PromptBuilder {
  buildCharacterResponsePrompt(context: {
    character: Character;
    scene: Scene;
    knownInfo: Information[];
    recentEvents: Event[];
  }): string {
    const { character, scene, knownInfo, recentEvents } = context;

    return `你是 ${character.name}，性格特点：${this.describePersonality(character.personality)}。

当前场景：${scene.name}
在场人物：${scene.presentCharacters.join('、')}

你已知的信息：
${knownInfo.map(info => `- ${info.content}`).join('\n')}

最近发生的事件：
${recentEvents.map(event => `- ${event.description}`).join('\n')}

请根据以上信息，生成你的回应。`;
  }

  private describePersonality(personality: Personality): string {
    const { traits } = personality;
    const descriptions: string[] = [];

    if (traits.openness > 0.7) descriptions.push('富有好奇心和想象力');
    if (traits.conscientiousness > 0.7) descriptions.push('认真负责');
    if (traits.extraversion > 0.7) descriptions.push('外向活泼');
    if (traits.agreeableness > 0.7) descriptions.push('友善合作');
    if (traits.neuroticism > 0.7) descriptions.push('情绪敏感');

    return descriptions.join('、') || '性格平和';
  }
}
```

**Phase 2-3**：迁移到 Handlebars 模板（记录在优化文档）

#### 环境变量管理

**选择**：使用 dotenv 加载 .env 文件

```typescript
// packages/infrastructure/src/config/env-loader.ts

import dotenv from 'dotenv';
import path from 'path';

export class EnvLoader {
  static load(envPath?: string): void {
    const resolvedPath = envPath || path.join(process.cwd(), '.env');
    dotenv.config({ path: resolvedPath });
  }

  static get(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (!value && !defaultValue) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    return value || defaultValue!;
  }

  static getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }
}
```

**.env.example**：
```bash
# LLM API Keys
DEEPSEEK_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
DOUBAO_API_KEY=xxxxx

# Application
NODE_ENV=development
LOG_LEVEL=info
```

---

## 七、CLI 交互与错误处理

### 7.1 第五轮讨论结果：CLI 交互设计

#### CLI 功能需求

- ✅ 支持命令快捷键
- ✅ 支持历史命令（上下键）
- ✅ 支持多行输入

#### CLI 技术栈

```typescript
// packages/cli/src/index.ts

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program
  .name('star-rail-story')
  .description('星穹铁道剧情复现计划 CLI')
  .version('1.0.0');

program
  .command('start')
  .description('启动新会话或继续现有会话')
  .action(async () => {
    const spinner = ora('加载会话列表...').start();
    // 加载会话列表
    spinner.succeed('会话列表加载完成');

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '请选择操作：',
        choices: [
          { name: '创建新会话', value: 'new' },
          { name: '继续现有会话', value: 'continue' },
          { name: '退出', value: 'exit' }
        ]
      }
    ]);

    if (action === 'new') {
      await createNewSession();
    } else if (action === 'continue') {
      await continueSession();
    }
  });

program
  .command('export')
  .description('导出人物/场景配置')
  .option('-t, --type <type>', '导出类型（character/scene）')
  .option('-i, --id <id>', '实体 ID')
  .action(async (options) => {
    // 导出逻辑
  });

program.parse();
```

#### 多行输入支持

```typescript
// packages/cli/src/ui/input-handler.ts

import inquirer from 'inquirer';

export class InputHandler {
  async getMultilineInput(prompt: string): Promise<string> {
    const { input } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'input',
        message: prompt,
        default: ''
      }
    ]);
    return input;
  }

  async getSingleLineInput(prompt: string): Promise<string> {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: prompt
      }
    ]);
    return input;
  }
}
```

### 7.2 错误处理与日志

#### 统一错误处理器（方案 A）

```typescript
// packages/infrastructure/src/error/error-handler.ts

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ErrorHandler {
  static handle(error: Error): void {
    if (error instanceof AppError) {
      console.error(`[${error.code}] ${error.message}`);
      if (error.details) {
        console.error('Details:', error.details);
      }
    } else {
      console.error('Unexpected error:', error.message);
      console.error(error.stack);
    }
  }

  static async handleAsync<T>(
    fn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      if (errorMessage) {
        console.error(errorMessage);
      }
      this.handle(error as Error);
      return null;
    }
  }
}
```

#### 日志管理（Winston）

```typescript
// packages/infrastructure/src/logging/logger.ts

import winston from 'winston';

export class Logger {
  private logger: winston.Logger;

  constructor(module: string) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { module },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: any): void {
    this.logger.error(message, { error, ...meta });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }
}
```

---

## 八、测试策略与开发规范

### 8.1 第六轮讨论结果：测试策略

#### 测试框架

**选择**：Jest

**测试范围**（Phase 1）：
- BehaviorEngine（行为推导公式）
- TriggerEngine（触发表执行）
- VisionManager（视野过滤）
- PromptBuilder（Prompt 构建）

**测试配置**：
```json
// jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/*.interface.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  }
};
```

**测试示例**：
```typescript
// packages/core/src/character-agent/__tests__/behavior-engine.test.ts

import { BehaviorEngine } from '../behavior-engine';
import { BigFiveTraits } from '@star-rail/types';

describe('BehaviorEngine', () => {
  let engine: BehaviorEngine;

  beforeEach(() => {
    engine = new BehaviorEngine();
  });

  describe('deriveBehaviorTendencies', () => {
    it('should derive exploration tendency correctly', () => {
      const traits: BigFiveTraits = {
        openness: 0.8,
        conscientiousness: 0.5,
        extraversion: 0.6,
        agreeableness: 0.5,
        neuroticism: 0.3
      };

      const tendencies = engine.deriveBehaviorTendencies(traits);

      // exploration = 0.7 * openness + 0.3 * extraversion
      // = 0.7 * 0.8 + 0.3 * 0.6 = 0.56 + 0.18 = 0.74
      expect(tendencies.exploration).toBeCloseTo(0.74, 2);
    });

    it('should derive cooperation tendency correctly', () => {
      const traits: BigFiveTraits = {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.7,
        agreeableness: 0.8,
        neuroticism: 0.3
      };

      const tendencies = engine.deriveBehaviorTendencies(traits);

      // cooperation = 0.7 * agreeableness + 0.3 * extraversion
      // = 0.7 * 0.8 + 0.3 * 0.7 = 0.56 + 0.21 = 0.77
      expect(tendencies.cooperation).toBeCloseTo(0.77, 2);
    });
  });
});
```

### 8.2 Git 工作流

**选择**：GitHub Flow（方案 B）

**分支策略**：
- `main`：主分支，始终可部署
- `feature/*`：功能分支
- `bugfix/*`：修复分支
- `hotfix/*`：紧急修复分支

**工作流程**：
1. 从 `main` 创建功能分支
2. 在功能分支上开发
3. 提交 PR 到 `main`
4. Code Review
5. 合并到 `main`
6. 删除功能分支

### 8.3 Commit 规范

**选择**：Conventional Commits + commitlint

**Commit 类型**：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变更

**commitlint 配置**：
```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']
    ],
    'subject-case': [0]
  }
};
```

**Husky 配置**：
```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.{json,md,yaml,yml}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm commitlint --edit $1
```

### 8.4 代码规范

#### ESLint 配置

```javascript
// .eslintrc.js
export default {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es2022: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
};
```

#### Prettier 配置

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### 8.5 依赖管理

**选择**：固定版本（方案 A）

```json
// package.json
{
  "dependencies": {
    "zod": "3.22.4",
    "tsyringe": "4.8.0",
    "commander": "11.1.0",
    "inquirer": "9.2.12",
    "chalk": "5.3.0",
    "ora": "7.0.1",
    "winston": "3.11.0",
    "dotenv": "16.3.1",
    "js-yaml": "4.1.0"
  },
  "devDependencies": {
    "typescript": "5.3.3",
    "@types/node": "20.10.6",
    "tsup": "8.0.1",
    "jest": "29.7.0",
    "ts-jest": "29.1.1",
    "@typescript-eslint/parser": "6.17.0",
    "@typescript-eslint/eslint-plugin": "6.17.0",
    "eslint": "8.56.0",
    "prettier": "3.1.1",
    "husky": "8.0.3",
    "lint-staged": "15.2.0",
    "@commitlint/cli": "18.4.4",
    "@commitlint/config-conventional": "18.4.4"
  }
}
```

### 8.6 文档结构

**推荐结构**：
```
docs/
├── README.md                    # 项目介绍
├── QUICK_START.md              # 快速开始
├── development/                # 开发文档
│   ├── setup.md               # 环境搭建
│   ├── architecture.md        # 架构说明
│   ├── coding-standards.md    # 编码规范
│   └── testing.md             # 测试指南
├── api/                        # API 文档
│   ├── core.md
│   ├── infrastructure.md
│   └── cli.md
└── changelog/                  # 变更日志
    └── CHANGELOG.md
```

---

## 九、模块依赖关系与 DI 容器

### 9.1 模块依赖关系

```
InputParser → StoryOrchestrator → WorldEngine
                                → VisionManager
                                → CharacterStateService
                                → CharacterAgent → LLMProviderFactory
                                                 → BehaviorEngine
                                                 → PromptBuilder
```

### 9.2 DI 容器配置

使用 tsyringe 进行依赖注入，所有服务通过 @injectable() 装饰器标记，通过 @inject() 注入依赖。

---

## 十、Phase 1 实现清单

### 10.1 数据模型（packages/types）

- [ ] Character Schema
- [ ] WorldState Schema
- [ ] Information Schema
- [ ] SessionState Schema
- [ ] Relationship Schema
- [ ] BigFiveTraits Schema
- [ ] BehaviorTendencies Schema

### 10.2 基础设施层（packages/infrastructure）

- [ ] LLM Provider 接口
- [ ] LLM Provider Factory
- [ ] Deepseek Provider
- [ ] Claude Provider
- [ ] Storage 接口
- [ ] JSON File Storage
- [ ] Config Loader
- [ ] Env Loader
- [ ] Error Handler
- [ ] Logger（Winston）

### 10.3 核心领域层（packages/core）

- [ ] VisionManager（信息与视野管理）
- [ ] CharacterStateService（人物状态与演化）
- [ ] WorldEngine（世界引擎）
- [ ] BehaviorEngine（行为引擎）
- [ ] TriggerEngine（触发表引擎）
- [ ] PromptBuilder（Prompt 构建）
- [ ] CharacterAgent（角色 Agent）
- [ ] InputParser（用户输入解析）
- [ ] StoryOrchestrator（剧情推进编排）
- [ ] AnchorEvaluation（锚点与对比评估）
- [ ] ExportImport（导出/导入）

### 10.4 CLI 表现层（packages/cli）

- [ ] 主菜单（会话管理）
- [ ] 会话工作区（剧情推进）
- [ ] 对比结果页
- [ ] 导出/导入对话框

### 10.5 配置文件

- [ ] 人物配置（march7.yaml, stelle.yaml）
- [ ] 场景配置
- [ ] 触发表配置
- [ ] LLM 配置（llm.yaml）
- [ ] 环境变量模板（.env.example）

### 10.6 测试（packages/*/\_\_tests\_\_）

- [ ] BehaviorEngine 单元测试
- [ ] TriggerEngine 单元测试
- [ ] VisionManager 单元测试
- [ ] PromptBuilder 单元测试
- [ ] Jest 配置
- [ ] 测试覆盖率 > 60%

### 10.7 开发工具配置

- [ ] ESLint 配置（.eslintrc.js）
- [ ] Prettier 配置（.prettierrc）
- [ ] Husky 配置（.husky/）
- [ ] commitlint 配置（commitlint.config.js）
- [ ] TypeScript 配置（tsconfig.json）
- [ ] pnpm workspace 配置（pnpm-workspace.yaml）

### 10.8 文档

- [ ] README.md（项目介绍）
- [ ] QUICK_START.md（快速开始）
- [ ] development/setup.md（环境搭建）
- [ ] .env.example（环境变量模板）

---

## 十一、开发流程

### 11.1 项目初始化步骤

1. 初始化 Monorepo
2. 配置 pnpm workspace
3. 创建 packages 结构
4. 配置 TypeScript
5. 配置 ESLint + Prettier
6. 配置 Husky + lint-staged
7. 安装依赖

### 11.2 开发顺序建议

**第一阶段：基础设施**
1. 数据模型（Zod Schema）
2. Config Loader
3. Storage（JSON File）
4. LLM Provider 接口与实现

**第二阶段：核心模块**
1. BehaviorEngine（行为推导）
2. TriggerEngine（触发表）
3. VisionManager（视野管理）
4. CharacterStateService（状态管理）
5. WorldEngine（世界引擎）

**第三阶段：Agent 与编排**
1. PromptBuilder（Prompt 构建）
2. CharacterAgent（角色 Agent）
3. InputParser（输入解析）
4. StoryOrchestrator（剧情编排）

**第四阶段：表现层**
1. CLI 基础框架
2. 主菜单与会话管理
3. 会话工作区
4. 导出/导入功能
5. 对比功能

---

## 十二、验收标准（对应 WBS Phase 1）

### 12.1 核心验收标准

1. **视野隔离验证** ✓
   - 1 场景 + 2 角色下，某信息仅 A 知时，B 的回复不包含该信息

2. **剧情推进可控** ✓
   - 指令型/对话型输入能正确解析并驱动一轮剧情

3. **导出/导入可用** ✓
   - 人物/场景 JSON 导出包可成功导入并在新会话中加载

4. **对比结果可见** ✓
   - 单节点对比可输出差异说明（人物状态 + 视野）

5. **状态演化可配置** ✓
   - 至少 1 个关系维度可配置触发并生效

### 12.2 技术验收标准

- [ ] 所有 Zod Schema 定义完整且通过校验
- [ ] LLM Provider 可切换且正常调用
- [ ] 配置文件加载正常
- [ ] 触发表执行正确
- [ ] 行为推导公式验证通过
- [ ] CLI 交互流畅
- [ ] 代码通过 ESLint 检查
- [ ] 代码通过 Prettier 格式检查
- [ ] Commit 符合 Conventional Commits 规范
- [ ] 关键模块有基础测试（覆盖率 > 60%）
- [ ] 所有测试通过

---

## 十三、参考文档

- [需求文档-星穹铁道剧情复现计划.md](需求文档-星穹铁道剧情复现计划.md)
- [概要设计.md](概要设计.md)
- [WBS任务分解表.md](WBS任务分解表.md)
- [技术选型与架构设计.md](技术选型与架构设计.md)
- [项目进度表.md](项目进度表.md)
- [UI-01-体验目标与信息架构.md](UI-UX/UI-01-体验目标与信息架构.md)
- [优化计划.md](优化计划.md)

---

## 十四、变更记录

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0 | 2026-02-05 | 初始版本，记录四轮技术讨论结果 | Claude Sonnet 4.5 |
| v1.1 | 2026-02-05 | 新增第五轮（配置管理、Prompt、CLI、错误处理、日志）和第六轮（测试、Git、开发规范）讨论结果 | Claude Sonnet 4.5 |

