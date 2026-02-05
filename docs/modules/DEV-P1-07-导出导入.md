# DEV-P1-07 导出/导入（EI）

## 一、模块概述

### 模块目标

实现人物、场景、会话等数据的导出和导入功能，支持 JSON 序列化/反序列化、冲突检查、依赖验证，为数据复用和迁移提供基础能力。

### 对应 WBS 任务 ID

- P1-EI-01: 人物/场景的 JSON 序列化与反序列化
- P1-EI-02: 导入时冲突检查（ID 冲突、依赖缺失）策略实现
- P1-EI-03: 导出/导入成功与失败用例验证

### 依赖模块

- DEV-P1-01 基础设施与数据模型（INF）
- DEV-P1-03 人物状态演化（CS）
- DEV-P1-06 剧情编排（SO）

### 被依赖模块

- DEV-P1-10 表现层（UI）

---

## 二、功能清单

| 功能名称     | 功能描述                       | 类/方法                                       | 文件位置                                                   |
| ------------ | ------------------------------ | --------------------------------------------- | ---------------------------------------------------------- |
| 导出角色     | 将角色数据导出为 JSON 文件     | `ExportImportService.exportCharacter()`       | `packages/core/src/export-import/export-import.service.ts` |
| 导入角色     | 从 JSON 文件导入角色数据       | `ExportImportService.importCharacter()`       | 同上                                                       |
| 导出场景     | 将场景配置导出为 JSON 文件     | `ExportImportService.exportScene()`           | 同上                                                       |
| 导入场景     | 从 JSON 文件导入场景配置       | `ExportImportService.importScene()`           | 同上                                                       |
| 导出会话     | 将完整会话状态导出为 JSON 文件 | `ExportImportService.exportSession()`         | 同上                                                       |
| 导入会话     | 从 JSON 文件导入会话状态       | `ExportImportService.importSession()`         | 同上                                                       |
| 批量导出角色 | 批量导出多个角色               | `ExportImportService.exportCharacters()`      | 同上                                                       |
| 批量导入角色 | 批量导入多个角色（带冲突追踪） | `ExportImportService.importCharacters()`      | 同上                                                       |
| 列出导出文件 | 列出指定类型的所有导出文件     | `ExportImportService.listExports()`           | 同上                                                       |
| 读取元数据   | 读取导出包的元数据             | `ExportImportService.readMetadata()`          | 同上                                                       |
| 验证导出包   | 验证导出包的有效性             | `ExportImportService.validateExportPackage()` | 同上                                                       |
| 删除导出文件 | 删除指定的导出文件             | `ExportImportService.deleteExport()`          | 同上                                                       |
| 清空导出目录 | 清空指定类型或所有导出文件     | `ExportImportService.clearExports()`          | 同上                                                       |

---

## 三、API 接口

### 3.1 ExportType 类型

```typescript
type ExportType = 'character' | 'scene' | 'session';
```

### 3.2 ConflictStrategy 类型

```typescript
/**
 * 冲突策略
 * P1-EI-02: 导入时冲突检查策略
 */
type ConflictStrategy = 'reject' | 'overwrite' | 'rename';
```

- `reject`: 拒绝导入，返回错误
- `overwrite`: 覆盖现有数据
- `rename`: 自动重命名 ID 后导入

### 3.3 ExportMetadata 接口

```typescript
interface ExportMetadata {
  /** 数据版本 */
  version: string;
  /** 导出类型 */
  type: ExportType;
  /** 导出时间戳 */
  exportedAt: number;
  /** 依赖的其他资源 ID 列表 */
  dependencies: string[];
  /** 导出来源会话 ID */
  sourceSessionId?: string;
  /** 导出描述 */
  description?: string;
}
```

### 3.4 ConflictInfo 接口

```typescript
/**
 * 冲突信息
 * P1-EI-02: 冲突检查结果
 */
interface ConflictInfo {
  /** 冲突类型 */
  type: 'id_conflict' | 'dependency_missing';
  /** 冲突资源 ID */
  resourceId: string;
  /** 冲突描述 */
  description: string;
  /** 现有资源（如果是 ID 冲突） */
  existingResource?: string;
}
```

### 3.5 ImportOptions 接口

```typescript
interface ImportOptions {
  /** 冲突策略 */
  conflictStrategy?: ConflictStrategy;
  /** 现有角色 ID 列表（用于冲突检查） */
  existingCharacterIds?: string[];
  /** 现有场景 ID 列表（用于冲突检查） */
  existingSceneIds?: string[];
  /** 是否验证依赖 */
  validateDependencies?: boolean;
}
```

### 3.6 ImportResult 接口

```typescript
interface ImportResult<T> {
  /** 是否成功 */
  success: boolean;
  /** 导入的数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 冲突列表 */
  conflicts?: ConflictInfo[];
  /** 缺失的依赖 */
  missingDependencies?: string[];
  /** 导入后的新 ID（如果使用 rename 策略） */
  newId?: string;
}
```

### 3.7 ExportImportService.exportCharacter

```typescript
async exportCharacter(
  character: Character,
  options?: {
    filename?: string;
    description?: string;
    sourceSessionId?: string;
  }
): Promise<string>
```

**参数**：

- `character`: 角色数据
- `options.filename`: 自定义文件名（可选）
- `options.description`: 导出描述（可选）
- `options.sourceSessionId`: 来源会话 ID（可选）

**返回值**：导出文件的完整路径

**使用示例**：

```typescript
const filePath = await service.exportCharacter(character, {
  description: '三月七角色数据',
});
```

### 3.8 ExportImportService.importCharacter

```typescript
async importCharacter(
  filePath: string,
  options?: ImportOptions
): Promise<ImportResult<Character>>
```

**参数**：

- `filePath`: 导出文件路径
- `options`: 导入选项

**返回值**：ImportResult<Character>

**使用示例**：

```typescript
const result = await service.importCharacter(filePath, {
  existingCharacterIds: ['march7', 'stelle'],
  conflictStrategy: 'reject',
  validateDependencies: true,
});

if (result.success) {
  console.log('导入成功:', result.data.name);
} else {
  console.log('导入失败:', result.error);
  if (result.conflicts) {
    console.log('冲突:', result.conflicts);
  }
}
```

### 3.9 ExportImportService.exportSession

```typescript
async exportSession(
  session: SessionState,
  options?: {
    filename?: string;
    description?: string;
  }
): Promise<string>
```

**参数**：

- `session`: 会话状态
- `options.filename`: 自定义文件名（可选）
- `options.description`: 导出描述（可选）

**返回值**：导出文件的完整路径

### 3.10 ExportImportService.importSession

```typescript
async importSession(
  filePath: string,
  options?: ImportOptions & { existingSessionIds?: string[] }
): Promise<ImportResult<SessionState>>
```

**参数**：

- `filePath`: 导出文件路径
- `options`: 导入选项（包含 existingSessionIds）

**返回值**：ImportResult<SessionState>

---

## 四、导出包格式

### 4.1 导出包结构

```json
{
  "metadata": {
    "version": "0.1.0",
    "type": "character",
    "exportedAt": 1707123456789,
    "dependencies": ["stelle"],
    "sourceSessionId": "session_001",
    "description": "三月七角色数据"
  },
  "data": {
    "id": "march7",
    "name": "三月七",
    "state": { ... },
    "personality": { ... }
  }
}
```

### 4.2 目录结构

```
exports/
├── characters/
│   ├── march7.json
│   └── stelle.json
├── scenes/
│   └── scene_test.json
└── sessions/
    └── session_001.json
```

---

## 五、验收标准

对应 WBS 中的验收标准：

- [x] **P1-EI-01**: 导出包格式说明（含元数据、依赖 ID 列表）；序列化/反序列化实现
  - 支持 Character、SceneConfig、SessionState 的导出/导入
  - 导出包包含 metadata（版本、类型、时间戳、依赖列表）
  - 使用 Zod Schema 进行数据校验

- [x] **P1-EI-02**: 冲突时提示或拒绝；至少一种策略文档化
  - 支持三种冲突策略：reject、overwrite、rename
  - 检测 ID 冲突和依赖缺失
  - 返回详细的冲突信息

- [x] **P1-EI-03**: 人物/场景 JSON 可导出并成功导入到新会话；冲突场景有明确结果
  - 38 个测试用例覆盖成功和失败场景
  - 批量导入支持冲突追踪

---

## 六、测试用例

**测试文件位置**：`packages/core/src/export-import/__tests__/export-import.service.test.ts`

### Character Export/Import 测试 (P1-EI-01)

| 测试用例                                     | 测试目的         | 预期结果            |
| -------------------------------------------- | ---------------- | ------------------- |
| should export character to JSON file         | 验证角色导出     | 文件创建成功        |
| should export character with dependencies    | 验证依赖收集     | 包含关系中的角色 ID |
| should export character with custom filename | 验证自定义文件名 | 使用指定文件名      |
| should import character from JSON file       | 验证角色导入     | 数据正确解析        |
| should fail import for wrong type            | 验证类型检查     | 返回错误            |
| should fail import for non-existent file     | 验证文件不存在   | 返回错误            |

### Scene Export/Import 测试 (P1-EI-01)

| 测试用例                                          | 测试目的       | 预期结果      |
| ------------------------------------------------- | -------------- | ------------- |
| should export scene to JSON file                  | 验证场景导出   | 文件创建成功  |
| should export scene with participant dependencies | 验证参与者依赖 | 包含参与者 ID |
| should import scene from JSON file                | 验证场景导入   | 数据正确解析  |

### Session Export/Import 测试 (P1-EI-01)

| 测试用例                                    | 测试目的     | 预期结果          |
| ------------------------------------------- | ------------ | ----------------- |
| should export session to JSON file          | 验证会话导出 | 文件创建成功      |
| should export session with all dependencies | 验证完整依赖 | 包含角色和场景 ID |
| should import session from JSON file        | 验证会话导入 | 数据正确解析      |

### Conflict Detection 测试 (P1-EI-02)

| 测试用例                                                 | 测试目的             | 预期结果     |
| -------------------------------------------------------- | -------------------- | ------------ |
| should detect character ID conflict                      | 验证角色 ID 冲突检测 | 返回冲突信息 |
| should rename character on conflict with rename strategy | 验证重命名策略       | 生成新 ID    |
| should overwrite on conflict with overwrite strategy     | 验证覆盖策略         | 保持原 ID    |
| should detect scene ID conflict                          | 验证场景 ID 冲突检测 | 返回冲突信息 |
| should detect session ID conflict                        | 验证会话 ID 冲突检测 | 返回冲突信息 |

### Dependency Validation 测试 (P1-EI-02)

| 测试用例                                             | 测试目的           | 预期结果     |
| ---------------------------------------------------- | ------------------ | ------------ |
| should detect missing character dependencies         | 验证角色依赖缺失   | 返回缺失列表 |
| should detect missing scene participant dependencies | 验证场景参与者缺失 | 返回缺失列表 |
| should pass when all dependencies exist              | 验证依赖完整       | 无缺失依赖   |

### Batch Operations 测试

| 测试用例                                                 | 测试目的             | 预期结果         |
| -------------------------------------------------------- | -------------------- | ---------------- |
| should export multiple characters                        | 验证批量导出         | 所有文件创建成功 |
| should import multiple characters with conflict tracking | 验证批量导入         | 所有导入成功     |
| should track imported IDs during batch import            | 验证批量导入冲突追踪 | 检测到重复 ID    |

### List and Query 测试 (P1-EI-03)

| 测试用例                                            | 测试目的     | 预期结果     |
| --------------------------------------------------- | ------------ | ------------ |
| should list exported characters                     | 验证列出角色 | 返回正确列表 |
| should list exported scenes                         | 验证列出场景 | 返回正确列表 |
| should list exported sessions                       | 验证列出会话 | 返回正确列表 |
| should return empty list for non-existent directory | 验证空目录   | 返回空列表   |

### Validation 测试 (P1-EI-03)

| 测试用例                                  | 测试目的       | 预期结果 |
| ----------------------------------------- | -------------- | -------- |
| should validate valid character export    | 验证有效角色包 | 验证通过 |
| should validate valid scene export        | 验证有效场景包 | 验证通过 |
| should validate valid session export      | 验证有效会话包 | 验证通过 |
| should fail validation for invalid file   | 验证无效文件   | 验证失败 |
| should fail validation for corrupted data | 验证损坏数据   | 验证失败 |

### 运行测试

```bash
cd packages/core && pnpm test
```

**测试结果**：169 passed, 0 failed（包含 ExportImportService 38 个测试）

---

## 七、已知限制

1. **文件系统依赖**：当前实现依赖本地文件系统，不支持远程存储
2. **无版本迁移**：不同版本的导出包之间没有自动迁移机制
3. **依赖不自动解决**：检测到依赖缺失时只报告，不自动导入依赖
4. **无加密支持**：导出文件为明文 JSON，不支持加密

---

## 八、变更记录

| 日期       | 版本  | 变更内容                                          | 变更人          |
| ---------- | ----- | ------------------------------------------------- | --------------- |
| 2026-02-05 | 0.1.0 | 初始实现：基础导出/导入功能                       | Claude Opus 4.5 |
| 2026-02-05 | 0.1.1 | 增强：会话导出/导入、冲突检查、依赖验证、批量操作 | Claude Opus 4.5 |
