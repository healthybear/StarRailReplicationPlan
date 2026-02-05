import { z } from 'zod';

/**
 * 关系 Schema（多维度）
 * 描述人物之间的关系状态
 */
export const RelationshipSchema = z.object({
  /** 信任度 (0-1) */
  trust: z.number().min(0).max(1),
  /** 敌对度 (0-1) */
  hostility: z.number().min(0).max(1),
  /** 亲密度 (0-1) */
  intimacy: z.number().min(0).max(1),
  /** 尊重度 (0-1) */
  respect: z.number().min(0).max(1),
  /** 扩展字段（可选） */
  custom: z.record(z.number().min(0).max(1)).optional(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

/**
 * 五大人格 Schema (Big Five)
 * 基于心理学的人格特质模型
 */
export const BigFiveTraitsSchema = z.object({
  /** 开放性 - 对新体验的接受程度 */
  openness: z.number().min(0).max(1),
  /** 尽责性 - 自律和目标导向程度 */
  conscientiousness: z.number().min(0).max(1),
  /** 外向性 - 社交活跃程度 */
  extraversion: z.number().min(0).max(1),
  /** 宜人性 - 合作和信任他人的程度 */
  agreeableness: z.number().min(0).max(1),
  /** 神经质 - 情绪不稳定程度 */
  neuroticism: z.number().min(0).max(1),
});

export type BigFiveTraits = z.infer<typeof BigFiveTraitsSchema>;

/**
 * 行为倾向 Schema
 * 从人格特质推导的行为倾向
 */
export const BehaviorTendenciesSchema = z.object({
  /** 探索倾向 */
  exploration: z.number().min(0).max(1),
  /** 合作倾向 */
  cooperation: z.number().min(0).max(1),
  /** 谨慎倾向 */
  caution: z.number().min(0).max(1),
  /** 冲动倾向 */
  impulsivity: z.number().min(0).max(1),
  /** 自信倾向 */
  assertiveness: z.number().min(0).max(1),
});

export type BehaviorTendencies = z.infer<typeof BehaviorTendenciesSchema>;

/**
 * 人格模型 Schema
 */
export const PersonalitySchema = z.object({
  /** 五大人格特质 */
  traits: BigFiveTraitsSchema,
  /** 核心价值观 */
  values: z.object({
    /** 自我导向 */
    selfDirection: z.number().min(0).max(1),
    /** 仁慈 */
    benevolence: z.number().min(0).max(1),
    /** 安全感 */
    security: z.number().min(0).max(1),
  }),
  /** 行为倾向（可选，可从特质推导） */
  behaviorTendencies: BehaviorTendenciesSchema.optional(),
});

export type Personality = z.infer<typeof PersonalitySchema>;

/**
 * 已知信息引用 Schema
 */
export const KnownInformationRefSchema = z.object({
  /** 信息 ID */
  informationId: z.string(),
  /** 获取时间戳 */
  acquiredAt: z.number(),
  /** 信息置信度（可选） */
  confidence: z.number().min(0).max(1).optional(),
});

export type KnownInformationRef = z.infer<typeof KnownInformationRefSchema>;

/**
 * 人物状态 Schema
 */
export const CharacterStateSchema = z.object({
  /** 与其他人物的关系 */
  relationships: z.record(RelationshipSchema),
  /** 能力值 (0-100) */
  abilities: z.record(z.number().min(0).max(100)),
  /** 已知信息（视野） */
  knownInformation: z.array(KnownInformationRefSchema),
});

export type CharacterState = z.infer<typeof CharacterStateSchema>;

/**
 * 人物元数据 Schema
 */
export const CharacterMetadataSchema = z.object({
  /** 创建时间戳 */
  createdAt: z.number(),
  /** 更新时间戳 */
  updatedAt: z.number(),
});

export type CharacterMetadata = z.infer<typeof CharacterMetadataSchema>;

/**
 * 人物 Schema
 * 核心实体，描述一个角色的完整信息
 */
export const CharacterSchema = z.object({
  /** 人物唯一标识 */
  id: z.string(),
  /** 人物名称 */
  name: z.string(),
  /** 所属势力（可选） */
  faction: z.string().optional(),
  /** 人设配置文件路径（可选） */
  profileConfigPath: z.string().optional(),
  /** 当前状态 */
  state: CharacterStateSchema,
  /** 人格模型 */
  personality: PersonalitySchema,
  /** 元数据（可选） */
  metadata: CharacterMetadataSchema.optional(),
});

export type Character = z.infer<typeof CharacterSchema>;

/**
 * 创建默认关系
 */
export function createDefaultRelationship(): Relationship {
  return {
    trust: 0.5,
    hostility: 0,
    intimacy: 0,
    respect: 0.5,
  };
}

/**
 * 创建默认人格
 */
export function createDefaultPersonality(): Personality {
  return {
    traits: {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5,
    },
    values: {
      selfDirection: 0.5,
      benevolence: 0.5,
      security: 0.5,
    },
  };
}
