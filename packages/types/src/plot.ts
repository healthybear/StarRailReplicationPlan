import { z } from 'zod';
import { TriggerConditionSchema } from './config.js';

/**
 * 剧情结果类型
 */
export const PlotOutcomeTypeEnum = z.enum([
  'state_change', // 人物状态变化
  'scene_change', // 场景切换
  'item_give', // 给予道具
  'item_remove', // 移除道具
  'faction_change', // 势力关系变化
  'custom', // 自定义
]);

export type PlotOutcomeType = z.infer<typeof PlotOutcomeTypeEnum>;

/**
 * 剧情结果 Schema
 */
export const PlotOutcomeSchema = z.object({
  /** 结果类型 */
  type: PlotOutcomeTypeEnum,
  /** 目标（人物 ID / 场景 ID / 道具 ID 等） */
  target: z.string().optional(),
  /** 结果值（依类型而定） */
  value: z
    .union([z.string(), z.number(), z.boolean(), z.record(z.unknown())])
    .optional(),
  /** 描述 */
  description: z.string().optional(),
});

export type PlotOutcome = z.infer<typeof PlotOutcomeSchema>;

/**
 * 剧情分支 Schema
 */
export const PlotBranchSchema = z.object({
  /** 分支唯一标识 */
  id: z.string(),
  /** 分支名称 */
  name: z.string(),
  /** 分支描述 */
  description: z.string().optional(),
  /** 触发条件（满足时此分支可用） */
  conditions: z.array(TriggerConditionSchema).optional(),
  /** 分支结果列表 */
  outcomes: z.array(PlotOutcomeSchema),
  /** 下一个情节节点 ID */
  nextNodeId: z.string().optional(),
  /** 标签 */
  tags: z.array(z.string()).optional(),
});

export type PlotBranch = z.infer<typeof PlotBranchSchema>;

/**
 * 情节节点 Schema
 */
export const PlotNodeSchema = z.object({
  /** 节点唯一标识 */
  id: z.string(),
  /** 节点名称 */
  name: z.string(),
  /** 节点描述 */
  description: z.string().optional(),
  /** 可用分支列表 */
  branches: z.array(PlotBranchSchema),
  /** 是否为终止节点 */
  isTerminal: z.boolean().optional(),
  /** 标签 */
  tags: z.array(z.string()).optional(),
});

export type PlotNode = z.infer<typeof PlotNodeSchema>;

/**
 * 剧情图配置 Schema
 */
export const PlotGraphConfigSchema = z.object({
  /** 配置版本 */
  version: z.string(),
  /** 起始节点 ID */
  startNodeId: z.string(),
  /** 节点列表（key 为节点 ID） */
  nodes: z.record(PlotNodeSchema),
});

export type PlotGraphConfig = z.infer<typeof PlotGraphConfigSchema>;
