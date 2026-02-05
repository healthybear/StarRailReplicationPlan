import { z } from 'zod';

/**
 * 信息来源类型
 */
export const InformationSourceEnum = z.enum([
  'witnessed', // 亲眼目睹
  'heard', // 听闻
  'told', // 被告知
  'inferred', // 推理得出
]);

export type InformationSource = z.infer<typeof InformationSourceEnum>;

/**
 * 信息 Schema
 * 描述一条信息的完整内容
 */
export const InformationSchema = z.object({
  /** 信息唯一标识 */
  id: z.string(),
  /** 信息内容 */
  content: z.string(),
  /** 信息来源 */
  source: InformationSourceEnum,
  /** 获取时间戳 */
  timestamp: z.number(),
  /** 发生场景 ID */
  sceneId: z.string(),
  /** 关联事件 ID（可选） */
  relatedEventId: z.string().optional(),
  /** 是否为关键记忆 */
  isKeyMemory: z.boolean().optional(),
  /** 信息标签（用于分类和检索） */
  tags: z.array(z.string()).optional(),
});

export type Information = z.infer<typeof InformationSchema>;

/**
 * 信息库 Schema
 * 管理全局信息和各人物已知信息
 */
export const InformationStoreSchema = z.object({
  /** 全局信息列表 */
  global: z.array(InformationSchema),
  /** 按人物 ID 索引的已知信息 ID 列表 */
  byCharacter: z.record(z.array(z.string())),
});

export type InformationStore = z.infer<typeof InformationStoreSchema>;

/**
 * 创建空信息库
 */
export function createEmptyInformationStore(): InformationStore {
  return {
    global: [],
    byCharacter: {},
  };
}

/**
 * 生成信息 ID
 */
export function generateInformationId(): string {
  return `info_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
