#!/usr/bin/env tsx
/**
 * 创建示例会话脚本
 * 用于快速创建一个包含初始剧情的演示会话
 */

/* eslint-disable no-console */

import { resolve } from 'path';
import { SessionManager } from '../packages/cli/src/services/session-manager.js';
import { ConfigLoader } from '../packages/infrastructure/src/config/config-loader.js';
import {
  CharacterConfigSchema,
  SceneConfigSchema,
} from '../packages/types/src/index.js';
import type {
  Character,
  Information,
  EventRecord,
  CharacterConfig,
  SceneConfig,
} from '../packages/types/src/index.js';

const CONFIG_DIR = resolve(process.cwd(), 'config');
const DATA_DIR = resolve(process.cwd(), 'data');

async function main() {
  console.log('🚀 创建示例会话...\n');

  const sessionManager = new SessionManager(DATA_DIR);
  const configLoader = new ConfigLoader(CONFIG_DIR);

  // 1. 加载角色配置
  console.log('📖 加载角色配置...');
  const march7Config = await configLoader.loadYaml<CharacterConfig>(
    'characters/march7.yaml',
    CharacterConfigSchema
  );
  const stelleConfig = await configLoader.loadYaml<CharacterConfig>(
    'characters/stelle.yaml',
    CharacterConfigSchema
  );

  // 2. 加载场景配置
  console.log('🏛️  加载场景配置...');
  const sceneConfig = await configLoader.loadYaml<SceneConfig>(
    'scenes/belobog_plaza.yaml',
    SceneConfigSchema
  );

  // 3. 创建会话
  console.log('✨ 创建会话...');
  const session = await sessionManager.createSession(
    '贝洛伯格初遇',
    'belobog_plaza'
  );

  // 4. 初始化角色
  console.log('👥 初始化角色...');
  const march7: Character = {
    id: march7Config.id,
    name: march7Config.name,
    faction: march7Config.faction,
    personality: march7Config.personality,
    state: {
      abilities: march7Config.initialAbilities || {},
      relationships: march7Config.initialRelationships || {},
      knownInformation: [],
    },
  };

  const stelle: Character = {
    id: stelleConfig.id,
    name: stelleConfig.name,
    faction: stelleConfig.faction,
    personality: stelleConfig.personality,
    state: {
      abilities: stelleConfig.initialAbilities || {},
      relationships: stelleConfig.initialRelationships || {},
      knownInformation: [],
    },
  };

  session.characters = {
    march7: march7,
    stelle: stelle,
  };

  // 5. 设置场景环境
  console.log('🌨️  设置场景环境...');
  session.worldState.currentSceneId = sceneConfig.id;

  // 将场景配置的扁平环境转换为结构化环境
  session.worldState.environment = {
    physical: {
      weather: sceneConfig.defaultEnvironment.weather,
      temperature: sceneConfig.defaultEnvironment.temperature,
      lighting: sceneConfig.defaultEnvironment.lighting,
      timeOfDay: sceneConfig.defaultEnvironment.timeOfDay,
      sceneCondition: sceneConfig.defaultEnvironment.sceneCondition,
    },
    social: {
      factions: {},
    },
    atmosphere: {
      tension: 0.2,
      mood: '平静而好奇',
    },
  };

  // 6. 添加初始信息
  console.log('📝 添加初始信息...');

  const info1: Information = {
    id: 'info_001',
    content: '贝洛伯格是一座被永冬笼罩的城市，人们在严寒中艰难生存',
    source: 'witnessed' as const,
    timestamp: Date.now(),
    sceneId: 'belobog_plaza',
    tags: ['world_knowledge', 'belobog'],
  };

  const info2: Information = {
    id: 'info_002',
    content: '星穹列车刚刚抵达雅利洛-VI星球，三月七和星准备探索这座城市',
    source: 'witnessed' as const,
    timestamp: Date.now() + 1,
    sceneId: 'belobog_plaza',
    tags: ['event', 'arrival'],
  };

  const info3: Information = {
    id: 'info_003',
    content: '广场中央的雕像是贝洛伯格的守护者，象征着这座城市的历史',
    source: 'witnessed' as const,
    timestamp: Date.now() + 2,
    sceneId: 'belobog_plaza',
    tags: ['world_knowledge', 'landmark'],
  };

  session.information.global = [info1, info2, info3];

  // 两个角色都知道这些初始信息
  march7.state.knownInformation = [
    { informationId: 'info_001', acquiredAt: Date.now() },
    { informationId: 'info_002', acquiredAt: Date.now() },
    { informationId: 'info_003', acquiredAt: Date.now() },
  ];

  stelle.state.knownInformation = [
    { informationId: 'info_001', acquiredAt: Date.now() },
    { informationId: 'info_002', acquiredAt: Date.now() },
    { informationId: 'info_003', acquiredAt: Date.now() },
  ];

  // 7. 添加初始事件
  console.log('📅 添加初始事件...');
  const event1: EventRecord = {
    eventId: 'event_001',
    timestamp: Date.now(),
    sceneId: 'belobog_plaza',
    description: '星穹列车抵达雅利洛-VI',
    participants: ['march7', 'stelle'],
    effects: [],
  };

  const event2: EventRecord = {
    eventId: 'event_002',
    timestamp: Date.now() + 1,
    sceneId: 'belobog_plaza',
    description: '三月七和星来到贝洛伯格中央广场',
    participants: ['march7', 'stelle'],
    effects: [],
  };

  session.worldState.eventChain = [event1, event2];

  // 8. 保存会话
  console.log('💾 保存会话...');
  await sessionManager.saveSession(session);

  console.log('\n✅ 示例会话创建成功！');
  console.log(`\n会话 ID: ${session.metadata.sessionId}`);
  console.log(`会话名称: ${session.metadata.sessionName}`);
  console.log(`场景: ${session.worldState.currentSceneId}`);
  console.log(`角色数: ${Object.keys(session.characters).length}`);
  console.log(`初始信息数: ${session.information.global.length}`);
  console.log(`初始事件数: ${session.worldState.eventChain.length}`);
  console.log('\n🎮 使用以下命令开始游戏：');
  console.log(`   pnpm cli start -c ${session.metadata.sessionId}`);
  console.log('\n或者直接运行：');
  console.log('   pnpm cli start');
  console.log('   然后选择"贝洛伯格初遇"会话\n');
}

main().catch((error) => {
  console.error('❌ 创建失败:', error);
  process.exit(1);
});
