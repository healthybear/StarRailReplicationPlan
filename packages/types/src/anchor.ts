import { z } from 'zod';

/**
 * 锚点人物状态 Schema
 * 记录锚点时刻的人物状态
 */
export const AnchorCharacterStateSchema = z.object({
  /** 人物 ID */
  characterId: z.string(),
  /** 人物名称 */
  characterName: z.string(),
  /** 对话内容 */
  dialogue: z.string().optional(),
  /** 已知信息 ID 列表 */
  knownInformationIds: z.array(z.string()),
  /** 判断/决策描述 */
  judgment: z.string().optional(),
  /** 关系状态快照 */
  relationships: z.record(z.number()).optional(),
});

export type AnchorCharacterState = z.infer<typeof AnchorCharacterStateSchema>;

/**
 * 锚点 Schema
 * 用于标注原剧情的关键节点，供对比评估使用
 */
export const AnchorSchema = z.object({
  /** 锚点 ID */
  id: z.string(),
  /** 节点 ID */
  nodeId: z.string(),
  /** 剧情线 ID */
  storylineId: z.string(),
  /** 时间/顺序标识 */
  sequence: z.number(),
  /** 锚点名称 */
  name: z.string(),
  /** 锚点描述 */
  description: z.string().optional(),
  /** 人物状态列表 */
  characters: z.array(AnchorCharacterStateSchema),
  /** 环境状态描述 */
  environmentDescription: z.string().optional(),
  /** 情节描述 */
  plotDescription: z.string(),
  /** 主题标签（可选，Phase 3） */
  themes: z.array(z.string()).optional(),
  /** 创建时间戳 */
  createdAt: z.number(),
});

export type Anchor = z.infer<typeof AnchorSchema>;

/**
 * 对比结果维度 Schema
 */
export const ComparisonDimensionSchema = z.object({
  /** 维度名称 */
  name: z.string(),
  /** 原剧情值 */
  originalValue: z.union([z.string(), z.number()]),
  /** 当前分支值 */
  currentValue: z.union([z.string(), z.number()]),
  /** 差异描述 */
  difference: z.string(),
  /** 差异程度 (0-1) */
  divergence: z.number().min(0).max(1),
});

export type ComparisonDimension = z.infer<typeof ComparisonDimensionSchema>;

/**
 * 对比结果 Schema
 */
export const ComparisonResultSchema = z.object({
  /** 锚点 ID */
  anchorId: z.string(),
  /** 对比时间戳 */
  comparedAt: z.number(),
  /** 总体评价 */
  overallAssessment: z.string(),
  /** 总体差异度 (0-1) */
  overallDivergence: z.number().min(0).max(1),
  /** 分维度对比 */
  dimensions: z.array(ComparisonDimensionSchema),
  /** 差异列表 */
  differences: z.array(z.string()),
});

export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;

/**
 * 生成锚点 ID
 */
export function generateAnchorId(): string {
  return `anchor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
