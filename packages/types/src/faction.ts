import { z } from 'zod';

/**
 * 势力间关系 Schema
 */
export const FactionRelationshipSchema = z.object({
  /** 态度 (-1 到 1，负为敌对，正为友好) */
  attitude: z.number().min(-1).max(1),
  /** 是否结盟 */
  alliance: z.boolean().optional(),
  /** 备注 */
  notes: z.string().optional(),
});

export type FactionRelationship = z.infer<typeof FactionRelationshipSchema>;

/**
 * 势力实体 Schema
 * 描述一个势力的完整信息
 */
export const FactionSchema = z.object({
  /** 势力唯一标识 */
  id: z.string(),
  /** 势力名称 */
  name: z.string(),
  /** 势力描述 */
  description: z.string().optional(),
  /** 成员人物 ID 列表 */
  members: z.array(z.string()),
  /** 势力目标 */
  goals: z.array(z.string()).optional(),
  /** 与其他势力的关系（key 为势力 ID） */
  relationships: z.record(FactionRelationshipSchema).optional(),
  /** 标签 */
  tags: z.array(z.string()).optional(),
});

export type Faction = z.infer<typeof FactionSchema>;

/**
 * 势力配置 Schema（用于 YAML 配置文件）
 */
export const FactionConfigSchema = z.object({
  /** 势力 ID */
  id: z.string(),
  /** 势力名称 */
  name: z.string(),
  /** 势力描述 */
  description: z.string().optional(),
  /** 势力目标 */
  goals: z.array(z.string()).optional(),
  /** 初始成员 ID 列表 */
  initialMembers: z.array(z.string()).optional(),
  /** 初始势力关系 */
  initialRelationships: z.record(FactionRelationshipSchema).optional(),
  /** 标签 */
  tags: z.array(z.string()).optional(),
});

export type FactionConfig = z.infer<typeof FactionConfigSchema>;

/**
 * 创建默认势力关系
 */
export function createDefaultFactionRelationship(): FactionRelationship {
  return { attitude: 0 };
}
