# 核心模块 API 验证报告

## 验证时间

2026-03-09

## 问题总结

测试用例中使用的 API 与实际实现**不匹配**。主要问题：

1. **StoryOrchestrator** - 测试假设有 `processUserInput()` 方法，实际是 `advance()`
2. **构造函数** - 实际使用依赖注入（tsyringe），测试中手动传参
3. **返回类型** - 实际返回 `AdvanceResult`，测试假设不同的结构

## 模块 API 对比

### 1. StoryOrchestrator

#### 测试中假设的 API

```typescript
constructor(options: {
  visionManager: VisionManager;
  characterState: CharacterStateService;
  worldEngine: WorldEngine;
  characterAgent: CharacterAgent;
  inputParser: InputParser;
});

processUserInput(input: string): Promise<{
  success: boolean;
  characterResponses: Array<{
    characterId: string;
    content: string;
  }>;
  parsedInput: { type: string };
  worldStateUpdated: boolean;
  events: Array<any>;
}>;
```

#### 实际 API

```typescript
@injectable()
constructor(
  @inject('StorageAdapter') private storage: StorageAdapter,
  @inject(VisionManager) private visionManager: VisionManager,
  @inject(CharacterStateService) private characterState: CharacterStateService,
  @inject(WorldEngine) private worldEngine: WorldEngine,
  @inject(InputParser) private inputParser: InputParser,
  @inject(CharacterAgent) private characterAgent: CharacterAgent
);

async advance(
  sessionId: string,
  userInput: string,
  characterId?: string
): Promise<AdvanceResult>;

interface AdvanceResult {
  success: boolean;
  responses: AgentResponse[];
  error?: string;
  eventId?: string;
  stateChanges?: Array<{
    characterId: string;
    target: string;
    oldValue: number;
    newValue: number;
  }>;
  durationMs?: number;
  deadEndFallback?: boolean;
}
```

### 2. VisionManager

#### 测试中假设的 API

```typescript
constructor(storage: JsonFileStorage);

addInformation(info: Information): Promise<void>;
grantInformationToCharacter(characterId: string, infoId: string): Promise<void>;
getCharacterVision(characterId: string): Promise<{
  knownInformation: string[];
}>;
```

#### 实际 API

```typescript
@injectable()
constructor(
  @inject('StorageAdapter') private storage: StorageAdapter
);

async addInformation(info: Information): Promise<void>;
async grantInformationToCharacter(characterId: string, infoId: string): Promise<void>;
async getCharacterVision(characterId: string, sceneId: string): Promise<{
  knownInformation: Information[];
  visibleCharacters: Character[];
  sceneState: SceneConfig;
}>;
```

**关键差异**：

- `getCharacterVision` 需要 `sceneId` 参数
- 返回的是 `Information[]` 对象数组，不是 `string[]`

### 3. CharacterStateService

#### 测试中假设的 API

```typescript
constructor(storage: JsonFileStorage);

createCharacter(character: Character): Promise<void>;
getCharacter(id: string): Promise<Character | undefined>;
updateCharacterAbility(id: string, ability: string, value: number): Promise<void>;
updateRelationship(id: string, targetId: string, dimension: string, value: number): Promise<void>;
loadTriggerRules(rules: TriggerRule[]): Promise<void>;
getTriggerRules(): Promise<TriggerRule[]>;
processEvent(event: GameEvent): Promise<void>;
addTriggerRule(rule: TriggerRule): Promise<void>;
```

#### 实际 API

```typescript
@injectable()
constructor(
  @inject('StorageAdapter') private storage: StorageAdapter,
  @inject(VisionManager) private visionManager: VisionManager
);

async createCharacter(character: Character): Promise<void>;
async getCharacter(characterId: string): Promise<Character | null>;
async updateCharacter(characterId: string, updates: Partial<Character>): Promise<void>;
async deleteCharacter(characterId: string): Promise<void>;
async listCharacters(): Promise<Character[]>;
```

**关键差异**：

- 没有 `updateCharacterAbility` 和 `updateRelationship` 方法
- 使用通用的 `updateCharacter` 方法
- 没有触发规则相关方法（在 BehaviorEngine 中）

### 4. ExportImportService

#### 测试中假设的 API

```typescript
constructor(storage: JsonFileStorage);

exportCharacter(id: string): Promise<ExportPackage>;
importCharacter(pkg: ExportPackage, options?: {
  conflictStrategy?: 'overwrite' | 'rename' | 'cancel';
}): Promise<{
  success: boolean;
  conflicts: Array<any>;
  renamedEntities?: Array<{ newId: string }>;
  warnings?: Array<any>;
}>;
exportScene(id: string): Promise<ExportPackage>;
importScene(pkg: ExportPackage): Promise<{ success: boolean }>;
```

#### 实际 API

```typescript
@injectable()
constructor(
  @inject('StorageAdapter') private storage: StorageAdapter
);

async exportCharacter(characterId: string): Promise<ExportPackage>;
async importCharacter(pkg: ExportPackage): Promise<ImportResult>;
async exportScene(sceneId: string): Promise<ExportPackage>;
async importScene(pkg: ExportPackage): Promise<ImportResult>;

interface ImportResult {
  success: boolean;
  message: string;
  conflicts?: ConflictInfo[];
}
```

**关键差异**：

- 没有 `conflictStrategy` 选项参数
- 返回类型不同

### 5. AnchorEvaluator

#### 测试中假设的 API

```typescript
constructor(options: {
  characterState: CharacterStateService;
  visionManager: VisionManager;
  worldEngine: WorldEngine;
});

saveAnchor(anchor: Anchor): Promise<boolean>;
getAnchor(id: string): Promise<Anchor | undefined>;
compareWithAnchor(anchorId: string): Promise<ComparisonResult>;
generateComparisonReport(anchorId: string): Promise<Report>;
```

#### 实际 API

```typescript
@injectable()
constructor(
  @inject('StorageAdapter') private storage: StorageAdapter,
  @inject(CharacterStateService) private characterState: CharacterStateService,
  @inject(VisionManager) private visionManager: VisionManager
);

async saveAnchor(anchor: Anchor): Promise<void>;
async getAnchor(anchorId: string): Promise<Anchor | null>;
async compareWithAnchor(anchorId: string, currentState: AnchorCharacterState): Promise<ComparisonResult>;
async listAnchors(): Promise<Anchor[]>;
```

**关键差异**：

- `compareWithAnchor` 需要 `currentState` 参数
- 没有 `generateComparisonReport` 方法

## 根本问题

### 1. 依赖注入

所有服务类都使用 `tsyringe` 进行依赖注入，测试中不能直接 `new` 实例化。

**解决方案**：

- 使用 `container.resolve()` 获取实例
- 或者注册 mock 依赖到容器

### 2. 存储适配器

所有服务都依赖 `StorageAdapter` 接口，不是直接依赖 `JsonFileStorage`。

**解决方案**：

- 注册 `JsonFileStorage` 为 `StorageAdapter`
- 或者使用内存存储适配器

### 3. 方法签名不匹配

测试假设的方法签名与实际不符。

**解决方案**：

- 逐个调整测试用例的方法调用
- 使用实际的参数和返回类型

## 修复建议

### 优先级 P0（必须修复）

1. **创建测试辅助工具**
   - 创建 `TestContainer` 类，封装依赖注入容器设置
   - 创建 `MockStorageAdapter` 内存实现

2. **修复 StoryOrchestrator 测试**
   - 使用 `advance()` 替代 `processUserInput()`
   - 调整返回值处理

3. **修复 VisionManager 测试**
   - 添加 `sceneId` 参数
   - 处理 `Information[]` 返回类型

### 优先级 P1（建议修复）

1. **修复 CharacterStateService 测试**
   - 使用 `updateCharacter()` 替代专用方法
   - 移除触发规则测试（或移到 BehaviorEngine）

2. **修复 ExportImportService 测试**
   - 调整返回类型处理
   - 移除不支持的选项参数

3. **修复 AnchorEvaluator 测试**
   - 添加 `currentState` 参数
   - 移除不存在的方法调用

## 下一步行动

1. ✅ 创建 API 验证报告（本文档）
2. ⏳ 创建测试辅助工具（TestContainer, MockStorage）
3. ⏳ 逐个修复测试文件
4. ⏳ 运行测试并验证

---

**创建时间**: 2026-03-09
**状态**: API 验证完成，等待测试修复
