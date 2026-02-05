import { z } from 'zod';

/**
 * 物理环境 Schema
 * 描述场景的物理状态
 */
export const PhysicalEnvironmentSchema = z.object({
  /** 天气 */
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'snowy', 'foggy']).optional(),
  /** 温度 (-50 到 50 摄氏度) */
  temperature: z.number().min(-50).max(50).optional(),
  /** 光照 */
  lighting: z.enum(['bright', 'dim', 'dark']).optional(),
  /** 时间段 */
  timeOfDay: z
    .enum(['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night'])
    .optional(),
  /** 场景状态 */
  sceneCondition: z
    .object({
      /** 是否损坏 */
      damaged: z.boolean().optional(),
      /** 是否可进入 */
      accessible: z.boolean().optional(),
      /** 是否拥挤 */
      crowded: z.boolean().optional(),
    })
    .optional(),
  /** 扩展字段（Phase 2-3） */
  custom: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type PhysicalEnvironment = z.infer<typeof PhysicalEnvironmentSchema>;

/**
 * 势力状态 Schema
 */
export const FactionStateSchema = z.object({
  /** 态度 (-1 到 1，负为敌对，正为友好) */
  attitude: z.number().min(-1).max(1),
  /** 控制力 (0-1) */
  control: z.number().min(0).max(1),
});

export type FactionState = z.infer<typeof FactionStateSchema>;

/**
 * 社会环境 Schema
 */
export const SocialEnvironmentSchema = z.object({
  /** 各势力状态 */
  factions: z.record(FactionStateSchema),
});

export type SocialEnvironment = z.infer<typeof SocialEnvironmentSchema>;

/**
 * 氛围 Schema
 */
export const AtmosphereSchema = z.object({
  /** 紧张度 (0-1) */
  tension: z.number().min(0).max(1),
  /** 情绪基调 */
  mood: z.string().optional(),
});

export type Atmosphere = z.infer<typeof AtmosphereSchema>;

/**
 * 环境 Schema
 */
export const EnvironmentSchema = z.object({
  /** 物理环境 */
  physical: PhysicalEnvironmentSchema,
  /** 社会环境 */
  social: SocialEnvironmentSchema,
  /** 氛围 */
  atmosphere: AtmosphereSchema,
});

export type Environment = z.infer<typeof EnvironmentSchema>;

/**
 * 时间线 Schema
 */
export const TimelineSchema = z.object({
  /** 当前回合数 */
  currentTurn: z.number().int().min(0),
  /** 时间戳 */
  timestamp: z.number(),
});

export type Timeline = z.infer<typeof TimelineSchema>;

/**
 * 事件记录 Schema
 */
export const EventRecordSchema = z.object({
  /** 事件 ID */
  eventId: z.string(),
  /** 发生时间戳 */
  timestamp: z.number(),
  /** 发生场景 ID */
  sceneId: z.string(),
  /** 参与者 ID 列表 */
  participants: z.array(z.string()),
  /** 事件描述 */
  description: z.string().optional(),
});

export type EventRecord = z.infer<typeof EventRecordSchema>;

/**
 * 世界状态 Schema
 * 描述整个世界的当前状态
 */
export const WorldStateSchema = z.object({
  /** 当前场景 ID */
  currentSceneId: z.string(),
  /** 时间线 */
  timeline: TimelineSchema,
  /** 环境状态 */
  environment: EnvironmentSchema,
  /** 事件链 */
  eventChain: z.array(EventRecordSchema),
  /** 当前情节节点 ID */
  currentPlotNodeId: z.string().optional(),
});

export type WorldState = z.infer<typeof WorldStateSchema>;

/**
 * 场景配置 Schema
 */
export const SceneConfigSchema = z.object({
  /** 场景 ID */
  id: z.string(),
  /** 场景名称 */
  name: z.string(),
  /** 场景描述 */
  description: z.string(),
  /** 默认物理环境 */
  defaultEnvironment: PhysicalEnvironmentSchema.optional(),
  /** 可连接的场景 ID 列表 */
  connectedScenes: z.array(z.string()).optional(),
  /** 场景标签 */
  tags: z.array(z.string()).optional(),
});

export type SceneConfig = z.infer<typeof SceneConfigSchema>;

/**
 * 创建默认世界状态
 */
export function createDefaultWorldState(sceneId: string): WorldState {
  return {
    currentSceneId: sceneId,
    timeline: {
      currentTurn: 0,
      timestamp: Date.now(),
    },
    environment: {
      physical: {
        weather: 'sunny',
        lighting: 'bright',
        timeOfDay: 'morning',
      },
      social: {
        factions: {},
      },
      atmosphere: {
        tension: 0,
      },
    },
    eventChain: [],
  };
}
