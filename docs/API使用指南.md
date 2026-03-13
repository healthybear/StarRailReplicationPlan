# API 使用指南

本文档介绍《星穹铁道剧情复现计划》REST API 的使用方法。

## 📖 API 文档

启动 API 服务器后，访问 Swagger 文档：

**地址**: http://localhost:3000/api/docs

Swagger 文档提供：

- 所有 API 端点的详细说明
- 请求参数和响应格式
- 在线测试功能

## 🚀 快速开始

### 启动 API 服务器

\`\`\`bash
cd packages/api
pnpm start:dev # 开发模式

# 或

pnpm start:prod # 生产模式
\`\`\`

服务器将在 http://localhost:3000 启动。

### 测试连接

\`\`\`bash
curl http://localhost:3000/api

# 返回: {"message":"Star Rail Replication Plan API"}

\`\`\`

## 📦 API 模块

### 1. Session 模块 - 会话管理

#### 创建会话

\`\`\`bash
POST /api/sessions

{
"sessionName": "我的会话",
"sceneId": "train_parlor",
"characterIds": ["march7", "stelle"]
}
\`\`\`

#### 获取会话列表

\`\`\`bash
GET /api/sessions?page=1&limit=10&search=关键词
\`\`\`

#### 获取会话详情

\`\`\`bash
GET /api/sessions/:sessionId
\`\`\`

#### 删除会话

\`\`\`bash
DELETE /api/sessions/:sessionId
\`\`\`

### 2. Character 模块 - 人物管理

#### 创建人物

\`\`\`bash
POST /api/characters

{
"characterId": "march7",
"name": "三月七",
"personality": {
"traits": ["活泼", "好奇"],
"values": ["友情", "冒险"],
"speechStyle": "活泼可爱"
},
"initialState": {
"relationships": {},
"abilities": {
"combat": 80,
"intelligence": 70,
"charisma": 90
},
"cultivation": {},
"personality": {},
"vision": {
"knownInformation": []
}
}
}
\`\`\`

#### 获取人物列表

\`\`\`bash
GET /api/characters
\`\`\`

#### 获取人物详情

\`\`\`bash
GET /api/characters/:characterId
\`\`\`

#### 更新人物

\`\`\`bash
PUT /api/characters/:characterId

{
"name": "三月七（更新）",
"personality": {...}
}
\`\`\`

#### 删除人物

\`\`\`bash
DELETE /api/characters/:characterId
\`\`\`

### 3. Scene 模块 - 场景管理

#### 创建场景

\`\`\`bash
POST /api/scenes

{
"sceneId": "train_parlor",
"name": "列车客厅",
"description": "星穹列车的主客厅",
"environment": {
"physical": {
"weather": "室内",
"temperature": 22,
"lighting": "明亮"
},
"social": {
"crowdLevel": "稀少",
"atmosphere": "平静"
}
},
"tags": ["列车", "室内"]
}
\`\`\`

#### 获取场景列表

\`\`\`bash
GET /api/scenes
\`\`\`

#### 获取场景详情

\`\`\`bash
GET /api/scenes/:sceneId
\`\`\`

### 4. Story 模块 - 剧情推进

#### 单角色剧情推进

\`\`\`bash
POST /api/story/advance

{
"sessionId": "session_xxx",
"characterId": "march7",
"sceneId": "train_parlor",
"userInput": "你好，三月七！"
}
\`\`\`

#### 多角色剧情推进

\`\`\`bash
POST /api/story/advance-multi

{
"sessionId": "session_xxx",
"characterIds": ["march7", "stelle"],
"sceneId": "train_parlor",
"userInput": "大家好！"
}
\`\`\`

### 5. Snapshot 模块 - 快照管理

#### 创建快照

\`\`\`bash
POST /api/snapshots/:sessionId

{
"label": "初次见面",
"description": "第一次与三月七对话"
}
\`\`\`

#### 获取快照列表

\`\`\`bash
GET /api/snapshots/:sessionId
\`\`\`

#### 恢复快照

\`\`\`bash
POST /api/snapshots/:sessionId/:snapshotId/restore

{
"strategy": "overwrite" # 或 "merge", "rename", "skip"
}
\`\`\`

#### 删除快照

\`\`\`bash
DELETE /api/snapshots/:sessionId/:snapshotId
\`\`\`

### 6. Anchor 模块 - 锚点管理

#### 创建锚点

\`\`\`bash
POST /api/anchors

{
"sessionId": "session_xxx",
"anchorId": "anchor_001",
"label": "原剧情锚点",
"nodeId": "node_001",
"plotlineId": "main_story"
}
\`\`\`

#### 获取锚点列表

\`\`\`bash
GET /api/anchors/:sessionId
\`\`\`

#### 锚点对比

\`\`\`bash
POST /api/anchors/compare

{
"sessionId": "session_xxx",
"anchorId": "anchor_001"
}
\`\`\`

## 🔐 认证（未实现）

当前版本暂未实现认证功能，所有 API 端点均可直接访问。

## 📊 响应格式

### 成功响应

\`\`\`json
{
"data": {...},
"message": "操作成功"
}
\`\`\`

### 错误响应

\`\`\`json
{
"statusCode": 400,
"message": "错误信息",
"error": "Bad Request"
}
\`\`\`

## 🧪 测试示例

### 完整流程示例

\`\`\`bash

# 1. 创建人物

curl -X POST http://localhost:3000/api/characters \
 -H "Content-Type: application/json" \
 -d '{"characterId":"march7","name":"三月七",...}'

# 2. 创建场景

curl -X POST http://localhost:3000/api/scenes \
 -H "Content-Type: application/json" \
 -d '{"sceneId":"train_parlor","name":"列车客厅",...}'

# 3. 创建会话

curl -X POST http://localhost:3000/api/sessions \
 -H "Content-Type: application/json" \
 -d '{"sessionName":"测试会话","sceneId":"train_parlor","characterIds":["march7"]}'

# 4. 剧情推进

curl -X POST http://localhost:3000/api/story/advance \
 -H "Content-Type: application/json" \
 -d '{"sessionId":"session_xxx","characterId":"march7","sceneId":"train_parlor","userInput":"你好！"}'

# 5. 创建快照

curl -X POST http://localhost:3000/api/snapshots/session_xxx \
 -H "Content-Type: application/json" \
 -d '{"label":"初次见面","description":"第一次对话"}'
\`\`\`

## 📚 更多资源

- [Swagger 文档](http://localhost:3000/api/docs) - 在线 API 文档
- [快速开始指南](./快速开始指南.md) - 新手入门
- [部署指南](./部署指南.md) - 生产环境部署
