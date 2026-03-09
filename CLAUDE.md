# Claude Code 项目规则

本文件定义了 Claude Code 在本项目中的工作规则和约定。

## 一、模块完成文档规则

**规则**：每完成一个开发模块（DEV-P1-XX），必须在 `docs/modules/` 目录下创建对应的模块完成文档。

### 1.1 文档命名规范

```
docs/modules/{模块ID}-{模块名称}.md
```

示例：`docs/modules/DEV-P1-02-视野与信息.md`

### 1.2 文档结构模板

每个模块完成文档必须包含以下章节：

```markdown
# {模块ID} {模块名称}

## 一、模块概述

- 模块目标
- 对应 WBS 任务 ID
- 依赖模块
- 被依赖模块

## 二、功能清单

列出模块实现的所有功能点，包括：

- 功能名称
- 功能描述
- 对应的类/方法
- 文件位置

## 三、API 接口

列出模块对外暴露的接口：

- 接口签名
- 参数说明
- 返回值说明
- 使用示例

## 四、配置文件

列出模块相关的配置文件：

- 配置文件路径
- 配置项说明
- 配置示例

## 五、验收标准

对应 WBS 中的验收标准，逐条列出：

- [ ] 验收项 1
- [ ] 验收项 2
- ...

## 六、测试用例

列出关键测试用例：
| 测试用例 | 测试目的 | 预期结果 | 测试文件位置 |
|---------|---------|---------|-------------|

## 七、已知限制

列出当前实现的已知限制和后续优化方向

## 八、变更记录

| 日期 | 版本 | 变更内容 | 变更人 |
| ---- | ---- | -------- | ------ |
```

### 1.3 执行时机

- 模块开发完成后
- 所有单元测试通过后
- 代码构建成功后

---

## 二、代码提交规则

### 2.1 Commit 规范

遵循 Conventional Commits 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**type 类型**：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具变更

**scope 范围**：使用模块 ID，如 `DEV-P1-02`

### 2.2 提交前检查

- [ ] 代码通过 ESLint 检查
- [ ] 代码通过 Prettier 格式化
- [ ] 单元测试全部通过
- [ ] 构建成功

---

## 三、测试规则

### 3.1 测试文件位置

```
packages/{package}/src/{module}/__tests__/{module}.test.ts
```

### 3.2 测试覆盖率要求

- 分支覆盖率 ≥ 60%
- 函数覆盖率 ≥ 60%
- 行覆盖率 ≥ 60%

### 3.3 关键测试用例

每个模块必须包含以下类型的测试：

- 正常流程测试
- 边界条件测试
- 错误处理测试
- 视野隔离验证测试（如适用）

---

## 四、文档更新规则

### 4.1 需要更新的文档

完成模块开发后，检查并更新以下文档：

- `docs/modules/{模块ID}-{模块名称}.md` - 模块完成文档（必须）
- `docs/项目进度表.md` - 更新模块状态（如需要）
- `README.md` - 更新功能说明（如需要）

### 4.2 文档语言

- 代码注释：中文
- API 文档：中文
- 配置文件注释：中文

---

## 五、开发流程检查清单

每完成一个模块，执行以下检查：

```
□ 功能实现完成
□ 类型定义完整
□ 单元测试编写并通过
□ 代码构建成功
□ 模块完成文档编写
□ 相关配置文件创建
□ 导出接口更新
```

---

## 六、技术规范

### 6.1 模块系统规范

**规则**: 项目统一使用 CommonJS 模块系统

**原因**: NestJS 默认使用 CommonJS，为保持兼容性，所有包统一使用 CommonJS

**配置要求**:

1. **package.json**:
   - 不要设置 `"type": "module"`
   - `exports` 字段必须同时包含 `"require"` 和 `"import"` 入口

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  }
}
```

2. **tsconfig.json**:
   - `"module": "CommonJS"`
   - `"moduleResolution": "node"`

3. **构建脚本**:
   - tsup: `--format cjs`
   - tsc: 使用 tsconfig.json 配置

**检查清单**:

```
□ package.json 无 "type": "module"
□ exports 包含 "require" 入口
□ tsconfig.json module 为 CommonJS
□ 构建脚本使用 cjs 格式
```

### 6.2 依赖注入规范

**规则**: NestJS 模块使用 Provider 工厂桥接 tsyringe 容器

**Core 服务注册**:

1. 在 `packages/api/src/common/providers/core.provider.ts` 中注册
2. 使用类 token 而非字符串 token
3. 通过 `container.resolve(ClassName)` 获取实例

**示例**:

```typescript
// ✅ 正确：使用类 token
import { StoryOrchestrator } from '@star-rail/core';

export const STORY_ORCHESTRATOR = 'STORY_ORCHESTRATOR';

{
  provide: STORY_ORCHESTRATOR,
  useFactory: () => container.resolve(StoryOrchestrator),
}

// ❌ 错误：使用字符串 token
{
  provide: STORY_ORCHESTRATOR,
  useFactory: () => container.resolve('StoryOrchestrator'),
}
```

**全局模块**:

- Core 服务通过 `CoreModule` 提供
- `CoreModule` 使用 `@Global()` 装饰器
- 业务模块无需重复导入 `CoreModule`

**注入服务**:

```typescript
@Injectable()
export class MyService {
  constructor(
    @Inject(STORY_ORCHESTRATOR)
    private readonly storyOrchestrator: StoryOrchestrator
  ) {}
}
```

### 6.3 TypeScript 配置规范

**根目录 tsconfig.json** (基础配置):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**包级别 tsconfig.json** (继承):

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  }
}
```

**关键配置**:

- `experimentalDecorators: true` - NestJS 装饰器必需
- `emitDecoratorMetadata: true` - DI 元数据必需
- `declaration: true` - 库包必须生成类型定义

### 6.4 测试文件规范

**ESLint 规则放宽**:

测试文件（`*.spec.ts`, `*.test.ts`）可以放宽以下规则：

```javascript
{
  files: ['**/*.spec.ts', '**/*.test.ts'],
  rules: {
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
  },
}
```

**Mock 对象创建**:

优先创建类型化的 mock 对象，避免使用 `as any`:

```typescript
// ✅ 推荐
const mockWorldState: WorldState = {
  currentSceneId: 'scene_001',
  timeline: { currentTurn: 0, timestamp: Date.now() },
  // ...
};

// ❌ 避免
const mockWorldState = {} as any;
```

---

## 七、问题排查指南

遇到问题时，参考 `docs/技术问题与解决方案.md` 文档。

**常见错误**:

| 错误                            | 文档章节                    |
| ------------------------------- | --------------------------- |
| `ERR_REQUIRE_ESM`               | 一、模块系统兼容性问题      |
| `Unregistered dependency token` | 二、依赖注入容器桥接问题    |
| TypeScript 编译错误             | 三、TypeScript 配置最佳实践 |
| ESLint 测试文件错误             | 四、ESLint 配置问题         |
