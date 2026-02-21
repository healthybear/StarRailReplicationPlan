import { z } from 'zod';

/**
 * 道具类型枚举
 */
export const ItemTypeEnum = z.enum([
  'weapon', // 武器
  'armor', // 防具
  'consumable', // 消耗品
  'key_item', // 关键道具
  'misc', // 杂项
]);

export type ItemType = z.infer<typeof ItemTypeEnum>;

/**
 * 道具定义 Schema
 * 描述一类道具的模板
 */
export const ItemSchema = z.object({
  /** 道具唯一标识 */
  id: z.string(),
  /** 道具名称 */
  name: z.string(),
  /** 道具描述 */
  description: z.string().optional(),
  /** 道具类型 */
  type: ItemTypeEnum,
  /** 道具属性（自定义键值对） */
  properties: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  /** 标签 */
  tags: z.array(z.string()).optional(),
});

export type Item = z.infer<typeof ItemSchema>;

/**
 * 道具实例 Schema
 * 描述世界中某个具体的道具实例
 */
export const ItemInstanceSchema = z.object({
  /** 对应道具定义 ID */
  itemId: z.string(),
  /** 数量 */
  quantity: z.number().int().min(1),
  /** 持有者 ID（人物 ID 或场景 ID，可选） */
  ownerId: z.string().optional(),
  /** 获取时间戳 */
  acquiredAt: z.number(),
});

export type ItemInstance = z.infer<typeof ItemInstanceSchema>;

/**
 * 道具库 Schema
 * 存储所有道具定义和实例
 */
export const ItemStoreSchema = z.object({
  /** 道具定义（key 为道具 ID） */
  definitions: z.record(ItemSchema),
  /** 道具实例（key 为实例唯一 ID） */
  instances: z.record(ItemInstanceSchema),
});

export type ItemStore = z.infer<typeof ItemStoreSchema>;

/**
 * 创建空道具库
 */
export function createEmptyItemStore(): ItemStore {
  return { definitions: {}, instances: {} };
}

/**
 * 生成道具实例 ID
 */
export function generateItemInstanceId(): string {
  return `item_inst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
