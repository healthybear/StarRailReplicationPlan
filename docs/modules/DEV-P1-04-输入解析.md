# DEV-P1-04 输入解析（IP）

## 一、模块概述

### 模块目标

实现用户输入的解析和分类功能，包括指令型与对话型输入的识别、权限校验、越权请求拒绝等功能。

### 对应 WBS 任务 ID

- P1-IP-01: 用户输入分类（指令型 vs 对话型）
- P1-IP-02: 指令型与对话型解析
- P1-IP-03: 权限校验与越权拒绝

### 依赖模块

- DEV-P1-01 基础设施与数据模型（INF）

### 被依赖模块

- DEV-P1-07 剧情编排（SO）
- DEV-P1-08 会话管理（SM）

---

## 二、功能清单

| 功能名称       | 功能描述               | 类/方法                                   | 文件位置                                         |
| -------------- | ---------------------- | ----------------------------------------- | ------------------------------------------------ |
| 输入解析       | 解析用户输入并分类     | `InputParser.parse()`                     | `packages/core/src/input-parser/input-parser.ts` |
| 对话解析       | 解析对话型输入         | `InputParser.parseDialogue()`             | 同上                                             |
| 指令解析       | 解析指令型输入         | `InputParser.parseCommand()`              | 同上                                             |
| 权限配置       | 设置权限配置           | `InputParser.setPermissionConfig()`       | 同上                                             |
| 获取权限配置   | 获取当前权限配置       | `InputParser.getPermissionConfig()`       | 同上                                             |
| 设置可控人物   | 设置可控制的人物列表   | `InputParser.setControllableCharacters()` | 同上                                             |
| 添加可控人物   | 添加单个可控制人物     | `InputParser.addControllableCharacter()`  | 同上                                             |
| 添加不可变锚点 | 添加不可修改的内容锚点 | `InputParser.addImmutableAnchor()`        | 同上                                             |
| 注册人物       | 注册人物名称映射       | `InputParser.registerCharacter()`         | 同上                                             |
| 批量注册人物   | 批量注册人物           | `InputParser.registerCharacters()`        | 同上                                             |
| 获取已注册人物 | 获取已注册的人物列表   | `InputParser.getRegisteredCharacters()`   | 同上                                             |
| 清除人物       | 清除所有注册的人物     | `InputParser.clearCharacters()`           | 同上                                             |
| 权限检查       | 检查操作权限           | `InputParser.checkPermission()`           | 同上                                             |
| 禁止动作检查   | 检查是否包含禁止动作   | `InputParser.checkForbiddenActions()`     | 同上                                             |
| 不可变锚点检查 | 检查是否涉及不可变锚点 | `InputParser.checkImmutableAnchors()`     | 同上                                             |

---

## 三、API 接口

### 3.1 InputParser.parse

```typescript
parse(input: string): ParsedInput
```

**参数**：

- `input`: 用户输入字符串

**返回值**：解析结果，可能是以下类型之一：

- `ParsedCommand`: 指令型输入
- `ParsedDialogue`: 对话型输入
- `ParsedInvalid`: 无效输入
- `ParsedUnauthorized`: 越权请求

**使用示例**：

```typescript
const parser = new InputParser();
parser.registerCharacters([
  { id: 'march7', name: '三月七' },
  { id: 'stelle', name: '星' },
]);

// 对话型输入
const dialogue = parser.parse('对三月七说：你好');
// { type: 'dialogue', targetCharacterId: 'march7', content: '你好' }

// 指令型输入
const command = parser.parse('让三月七去调查房间');
// { type: 'command', targetCharacterId: 'march7', action: '调查房间' }
```

### 3.2 InputParser.setPermissionConfig

```typescript
setPermissionConfig(config: Partial<PermissionConfig>): void
```

**参数**：

- `config`: 权限配置对象（部分）

**配置项**：

```typescript
interface PermissionConfig {
  controllableCharacters: string[]; // 可控制的人物 ID 列表
  forbiddenActions: string[]; // 禁止的动作关键词
  immutableAnchors: string[]; // 不可变锚点
  allowSystemCommands: boolean; // 是否允许系统级命令
}
```

**使用示例**：

```typescript
parser.setPermissionConfig({
  controllableCharacters: ['march7', 'stelle'],
  forbiddenActions: ['删除', '销毁', '杀死'],
});
```

### 3.3 InputType 枚举

```typescript
enum InputType {
  Command = 'command', // 指令型
  Dialogue = 'dialogue', // 对话型
  Invalid = 'invalid', // 无效输入
  Unauthorized = 'unauthorized', // 越权请求
}
```

### 3.4 ParsedUnauthorized 接口

```typescript
interface ParsedUnauthorized {
  type: InputType.Unauthorized;
  reason: string; // 拒绝原因
  attemptedAction: string; // 尝试的动作
  targetCharacterId?: string; // 目标人物 ID（如有）
}
```

---

## 四、配置文件

### 4.1 默认权限配置

**位置**：`packages/core/src/input-parser/input-parser.ts`

**默认配置**：

```typescript
const DEFAULT_PERMISSION_CONFIG: PermissionConfig = {
  controllableCharacters: [], // 空表示允许所有
  forbiddenActions: ['删除', '销毁', '杀死', '重置'],
  immutableAnchors: [],
  allowSystemCommands: false,
};
```

---

## 五、验收标准

对应 WBS 中的验收标准：

- [x] **P1-IP-01**: 输入分类准确率 ≥ 90%（指令/对话/无效）
- [x] **P1-IP-02**: 指令型解析出目标人物与动作；对话型解析出目标人物与内容
- [x] **P1-IP-03**: 越权请求返回 Unauthorized 类型；包含拒绝原因和尝试的动作

---

## 六、测试用例

**测试文件位置**：`packages/core/src/input-parser/__tests__/input-parser.test.ts`

### 输入分类测试 (P1-IP-01)

| 测试用例                                         | 测试目的         | 预期结果      |
| ------------------------------------------------ | ---------------- | ------------- |
| should classify empty input as invalid           | 验证空输入分类   | 返回 Invalid  |
| should classify whitespace-only input as invalid | 验证空白输入分类 | 返回 Invalid  |
| should classify dialogue input correctly         | 验证对话输入分类 | 返回 Dialogue |
| should classify command input correctly          | 验证指令输入分类 | 返回 Command  |
| should classify unrecognized input as invalid    | 验证无法识别输入 | 返回 Invalid  |

### 对话解析测试 (P1-IP-02)

| 测试用例                                   | 测试目的          | 预期结果           |
| ------------------------------------------ | ----------------- | ------------------ |
| should parse dialogue with colon format    | 验证冒号格式对话  | 正确解析人物和内容 |
| should parse dialogue with quotes          | 验证引号格式对话  | 正确解析内容       |
| should parse dialogue with 跟...说 format  | 验证"跟...说"格式 | 正确解析           |
| should parse dialogue with 告诉 format     | 验证"告诉"格式    | 正确解析           |
| should handle partial character name match | 验证部分名称匹配  | 正确匹配人物       |

### 指令解析测试 (P1-IP-02)

| 测试用例                                        | 测试目的          | 预期结果           |
| ----------------------------------------------- | ----------------- | ------------------ |
| should parse command with 让...去 format        | 验证"让...去"格式 | 正确解析人物和动作 |
| should parse command with 让... format (no 去)  | 验证"让..."格式   | 正确解析           |
| should parse command with 命令 format           | 验证"命令"格式    | 正确解析           |
| should parse command with 指示 format           | 验证"指示"格式    | 正确解析           |
| should parse command with [人物]去[动作] format | 验证直接格式      | 正确解析           |

### 权限校验测试 (P1-IP-03)

| 测试用例                                                        | 测试目的             | 预期结果          |
| --------------------------------------------------------------- | -------------------- | ----------------- |
| should allow all operations when no controllable characters set | 验证无限制时允许所有 | 返回 Command      |
| should reject unauthorized character control                    | 验证越权控制拒绝     | 返回 Unauthorized |
| should allow authorized character control                       | 验证授权控制允许     | 返回 Command      |
| should reject forbidden actions                                 | 验证禁止动作拒绝     | 返回 Unauthorized |
| should reject operations on immutable anchors                   | 验证不可变锚点保护   | 返回 Unauthorized |
| should add controllable character correctly                     | 验证添加可控人物     | 新人物可控制      |

### 边界情况测试

| 测试用例                                                 | 测试目的             | 预期结果               |
| -------------------------------------------------------- | -------------------- | ---------------------- |
| should handle unknown character name                     | 验证未知人物处理     | 返回 Invalid           |
| should handle case-insensitive character matching        | 验证大小写不敏感匹配 | 正确匹配               |
| should handle multiple forbidden actions in one input    | 验证多禁止动作       | 返回 Unauthorized      |
| should include attempted action in unauthorized response | 验证越权响应包含动作 | 包含 attemptedAction   |
| should include target character in unauthorized response | 验证越权响应包含人物 | 包含 targetCharacterId |

### 运行测试

```bash
cd packages/core && pnpm test
```

**测试结果**：70 passed, 0 failed（包含 VisionManager 15 个 + CharacterState 24 个 + InputParser 31 个）

---

## 七、已知限制

1. **输入格式有限**：当前仅支持中文格式的输入解析，英文格式需要后续扩展
2. **人物名称匹配简单**：使用简单的字符串包含匹配，可能存在误匹配
3. **参数解析未实现**：指令型输入的 `parameters` 字段当前未解析，仅返回动作字符串
4. **系统命令未实现**：`allowSystemCommands` 配置项当前未使用
5. **正则表达式性能**：大量人物注册时，遍历匹配可能影响性能

---

## 八、变更记录

| 日期       | 版本  | 变更内容                             | 变更人          |
| ---------- | ----- | ------------------------------------ | --------------- |
| 2026-02-05 | 0.1.0 | 初始实现：基础输入解析（指令/对话）  | Claude Opus 4.5 |
| 2026-02-05 | 0.1.1 | 增强：权限校验、越权拒绝、不可变锚点 | Claude Opus 4.5 |
