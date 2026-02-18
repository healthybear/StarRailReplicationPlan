# Phase 2 - Web 前端开发计划

**文档版本**：v1.0
**创建时间**：2026-02-18
**负责人**：开发团队
**状态**：规划中

---

## 一、背景与目标

### 1.1 当前状态

Phase 1 MVP 已完成，实现了基于 CLI 的命令行界面，包含所有核心功能：

- ✅ 视野隔离
- ✅ 剧情推进（对话型/指令型输入）
- ✅ 快照管理
- ✅ 锚点对比
- ✅ 导出导入

### 1.2 Phase 2 目标

提供 Web UI 界面，提升用户体验，使剧情推进过程和人物状态变化更加直观可视化。

### 1.3 技术决策

根据用户需求确认：

- **开发时机**：现在就开始（与 Phase 1 QA 测试并行）
- **后端框架**：Nest.js（架构完整，易扩展）
- **开发策略**：MVP 优先（先实现核心 3 个页面）
- **认证方案**：简单 JWT 认证

---

## 二、技术栈

### 2.1 前端技术栈（packages/web）

| 技术       | 版本 | 用途                           |
| ---------- | ---- | ------------------------------ |
| Vue 3      | 3.4+ | 前端框架                       |
| TypeScript | 5.x  | 类型系统                       |
| Vite       | 5.x  | 构建工具                       |
| Vuetify 3  | 3.5+ | UI 组件库（Material Design 3） |
| Pinia      | 2.x  | 状态管理                       |
| Vue Router | 4.x  | 路由管理                       |
| Axios      | 1.x  | HTTP 客户端                    |

### 2.2 后端技术栈（packages/api）

| 技术             | 版本 | 用途     |
| ---------------- | ---- | -------- |
| Nest.js          | 10.x | 后端框架 |
| TypeScript       | 5.x  | 类型系统 |
| @nestjs/jwt      | -    | JWT 认证 |
| @nestjs/passport | -    | 认证策略 |
| bcrypt           | -    | 密码加密 |
| class-validator  | -    | DTO 验证 |

---

## 三、MVP 实现范围

### 3.1 核心 3 个页面（优先级 P0）

1. **P01 会话列表**
   - 展示所有会话
   - 支持新建/删除/进入会话
   - 搜索和筛选功能

2. **P02 新建会话**
   - 三步向导创建会话
   - 配置包选择功能
   - 表单验证

3. **P03 剧情推进**
   - 对话历史展示（时间线格式）
   - 用户输入区（支持对话型/指令型）
   - 人物状态面板（实时更新）
   - 响应式布局（移动端/桌面端）

### 3.2 后续页面（优先级 P1）

4. P05 快照列表
5. P06 对比报告
6. P07 导出/导入
7. P04 人物状态面板（独立页面）

---

## 四、项目结构

### 4.1 Monorepo 结构

```
packages/
├── web/              # Vue 3 前端应用（新增）
├── api/              # Nest.js API 服务（新增）
├── core/             # 现有：核心业务逻辑
├── infrastructure/   # 现有：基础设施层
├── types/            # 现有：共享类型定义
└── cli/              # 现有：CLI 工具
```

### 4.2 packages/web 目录结构

```
packages/web/
├── src/
│   ├── main.ts                  # 应用入口
│   ├── App.vue                  # 根组件
│   ├── router/
│   │   └── index.ts             # 路由配置
│   ├── stores/                  # Pinia 状态管理
│   │   ├── auth.ts              # 认证状态
│   │   ├── session.ts           # 会话状态
│   │   ├── story.ts             # 剧情推进状态
│   │   └── character.ts         # 人物状态
│   ├── views/                   # 页面组件
│   │   ├── Login.vue            # 登录页
│   │   ├── SessionList.vue      # P01 会话列表
│   │   ├── CreateSession.vue    # P02 新建会话
│   │   └── StoryAdvance.vue     # P03 剧情推进
│   ├── components/              # 可复用组件
│   │   ├── common/              # 通用组件
│   │   ├── story/               # 剧情相关
│   │   └── character/           # 人物相关
│   ├── composables/             # Vue 3 组合式函数
│   ├── services/                # API 服务层
│   ├── types/                   # 前端特定类型
│   ├── plugins/
│   │   └── vuetify.ts           # Vuetify 配置
│   └── assets/
│       └── styles/
│           └── main.scss        # 全局样式
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

### 4.3 packages/api 目录结构

```
packages/api/
├── src/
│   ├── main.ts                  # 应用入口
│   ├── app.module.ts            # 根模块
│   ├── modules/
│   │   ├── auth/                # 认证模块
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── dto/
│   │   ├── session/             # 会话模块
│   │   │   ├── session.module.ts
│   │   │   ├── session.controller.ts
│   │   │   ├── session.service.ts
│   │   │   └── dto/
│   │   └── story/               # 剧情模块
│   │       ├── story.module.ts
│   │       ├── story.controller.ts
│   │       ├── story.service.ts
│   │       └── dto/
│   ├── common/
│   │   ├── guards/
│   │   ├── decorators/
│   │   └── filters/
│   └── config/
│       └── app.config.ts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 五、核心功能设计

### 5.1 用户认证

**认证方案**：

- JWT Token 认证
- 本地 JSON 文件存储用户信息
- 预设管理员账号：admin/admin123
- Token 有效期：7 天

**API 接口**：

```typescript
POST /api/auth/login
Body: { username: string, password: string }
Response: { access_token: string, user: { id: string, username: string } }

GET /api/auth/profile (需要认证)
Response: { id: string, username: string }
```

### 5.2 会话管理

**API 接口**：

```typescript
GET /api/sessions (需要认证)
Query: { page?: number, limit?: number }
Response: { data: SessionMetadata[], total: number }

GET /api/sessions/:sessionId (需要认证)
Response: { data: SessionState }

POST /api/sessions (需要认证)
Body: { sessionName: string, description?: string, configPackages: string[] }
Response: { data: SessionMetadata }

DELETE /api/sessions/:sessionId (需要认证)
Response: { success: boolean }
```

**实现要点**：

- 复用 `@star-rail/infrastructure` 的 `JsonFileStorage`
- 按用户 ID 过滤会话
- 验证会话所有权

### 5.3 剧情推进

**API 接口**：

```typescript
POST /api/story/advance (需要认证)
Body: {
  sessionId: string,
  userInput: string,
  characterIds: string[]
}
Response: {
  data: {
    success: boolean,
    responses: AgentResponse[],
    eventId: string,
    stateChanges: StateChange[]
  }
}

GET /api/story/history/:sessionId (需要认证)
Query: { limit?: number, offset?: number }
Response: { data: EventRecord[], total: number }
```

**实现要点**：

- 复用 `@star-rail/core` 的 `StoryOrchestrator`
- 初始化 DI 容器
- 加载/保存会话状态

---

## 六、开发步骤

### 阶段 1：项目初始化（1-2 天）

- [ ] 创建 packages/api（Nest.js 项目）
- [ ] 创建 packages/web（Vite + Vue 3 项目）
- [ ] 配置 packages/api 的依赖和 workspace 引用
- [ ] 配置 packages/web 的依赖（Vuetify 3、Pinia、Vue Router）
- [ ] 配置环境变量

### 阶段 2：认证功能（2-3 天）

- [ ] 实现后端认证模块（JWT + bcrypt）
- [ ] 实现前端登录页面和认证状态管理
- [ ] 配置 Axios 拦截器
- [ ] 配置路由守卫

### 阶段 3：会话管理（3-4 天）

- [ ] 实现后端会话管理模块（CRUD API）
- [ ] 实现前端 P01 会话列表页面
- [ ] 实现前端 P02 新建会话页面（三步向导）

### 阶段 4：剧情推进（5-7 天）

- [ ] 实现后端剧情推进模块（集成 StoryOrchestrator）
- [ ] 实现前端 P03 剧情推进页面（对话展示 + 输入 + 人物状态）
- [ ] 实现响应式布局（移动端/桌面端）

### 阶段 5：测试与优化（2-3 天）

- [ ] 功能测试（登录、会话、剧情推进）
- [ ] 端到端测试（完整流程、视野隔离）
- [ ] 性能优化（虚拟滚动、懒加载）
- [ ] 错误处理（API 错误、网络断开）

---

## 七、验收标准

### 7.1 MVP 阶段验收标准

- [ ] 用户可以登录并保持认证状态
- [ ] 用户可以查看所有会话列表
- [ ] 用户可以创建新会话（三步向导）
- [ ] 用户可以进入会话并推进剧情
- [ ] 对话历史正确展示（时间线格式）
- [ ] 人物状态面板实时更新
- [ ] 支持对话型和指令型输入
- [ ] 响应式布局在移动端和桌面端正常工作
- [ ] 错误提示友好（网络错误、API 错误）

### 7.2 端到端测试用例

**测试用例 1：完整剧情推进流程**

1. 登录系统
2. 创建新会话（选择"雅利洛-VI 初遇"配置包）
3. 进入会话
4. 输入对话："你好，我是开拓者"
5. 验证：三月七和丹恒的回复正确显示
6. 验证：人物状态面板显示三月七和丹恒的状态
7. 输入指令："/status"
8. 验证：显示当前场景和人物状态摘要

**测试用例 2：视野隔离验证**

1. 进入会话（场景：雅利洛-VI，人物：三月七、丹恒）
2. 输入："（悄悄对三月七说）我发现了一个秘密"
3. 验证：三月七的视野中包含该信息
4. 验证：丹恒的视野中不包含该信息
5. 输入："丹恒，你知道什么秘密吗？"
6. 验证：丹恒的回复表明他不知道

---

## 八、预计工作量

| 阶段       | 工作量                      |
| ---------- | --------------------------- |
| 项目初始化 | 1-2 天                      |
| 认证功能   | 2-3 天                      |
| 会话管理   | 3-4 天                      |
| 剧情推进   | 5-7 天                      |
| 测试与优化 | 2-3 天                      |
| **总计**   | **13-19 天（约 2.5-4 周）** |

---

## 九、参考文档

- [技术选型与架构设计](./技术选型与架构设计.md)
- [UI-01 体验目标与信息架构](./ui-ux/UI-01-体验目标与信息架构.md)
- [UI-02 关键页面详细描述](./ui-ux/UI-02-关键页面详细描述.md)
- [UI-04 视觉稿与组件规范](./ui-ux/UI-04-视觉稿与组件规范.md)
- [WBS 任务分解表](./WBS任务分解表.md)

---

## 十、注意事项

### 10.1 安全性

- JWT Token 存储在 localStorage
- 生产环境需要 HTTPS
- 密码使用 bcrypt 加密（salt rounds = 10）
- API 接口需要 JWT 守卫保护

### 10.2 性能

- 对话历史超过 100 条时使用虚拟滚动
- 图片资源使用 CDN（后续优化）
- API 响应时间目标 < 2s（LLM 调用除外）

### 10.3 兼容性

- 浏览器支持：Chrome 90+, Firefox 88+, Safari 14+
- 移动端支持：iOS 14+, Android 10+

### 10.4 文档

- 完成后更新 `docs/modules/` 添加 DEV-P2-01 模块文档
- 更新 `README.md` 添加 Web UI 使用说明

---

**文档状态**：已确认
**下一步**：开始阶段 1 - 项目初始化
