import { z } from 'zod';

/**
 * LLM Provider 配置 Schema
 */
export const LLMProviderConfigSchema = z.object({
  /** 是否启用 */
  enabled: z.boolean(),
  /** 模型名称 */
  model: z.string(),
  /** API 基础 URL（可选） */
  baseUrl: z.string().optional(),
  /** 默认参数 */
  defaultParams: z
    .object({
      /** 温度 */
      temperature: z.number().min(0).max(2).optional(),
      /** 最大 token 数 */
      maxTokens: z.number().positive().optional(),
      /** Top P */
      topP: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

export type LLMProviderConfig = z.infer<typeof LLMProviderConfigSchema>;

/**
 * LLM 配置 Schema
 */
export const LLMConfigSchema = z.object({
  /** 默认 Provider */
  defaultProvider: z.string(),
  /** Provider 配置列表 */
  providers: z.record(LLMProviderConfigSchema),
  /** 角色专用 Provider（可选） */
  characterProviders: z.record(z.string()).optional(),
});

export type LLMConfig = z.infer<typeof LLMConfigSchema>;

/**
 * 触发效果 Schema
 */
export const TriggerEffectSchema = z.object({
  /** 目标（如 relationship.trust） */
  target: z.string(),
  /** 变化类型 */
  changeType: z.enum(['delta', 'multiply', 'set']),
  /** 变化值 */
  value: z.number(),
  /** 最小值限制 */
  min: z.number().optional(),
  /** 最大值限制 */
  max: z.number().optional(),
});

export type TriggerEffect = z.infer<typeof TriggerEffectSchema>;

/**
 * 触发条件 Schema
 */
export const TriggerConditionSchema = z.object({
  /** 条件字段 */
  field: z.string(),
  /** 操作符 */
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn']),
  /** 比较值 */
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

export type TriggerCondition = z.infer<typeof TriggerConditionSchema>;

/**
 * 触发规则 Schema
 */
export const TriggerRuleSchema = z.object({
  /** 规则 ID */
  id: z.string(),
  /** 规则名称 */
  name: z.string(),
  /** 事件类型 */
  eventType: z.string(),
  /** 触发条件（可选） */
  conditions: z.array(TriggerConditionSchema).optional(),
  /** 效果列表 */
  effects: z.array(TriggerEffectSchema),
  /** 优先级 */
  priority: z.number().optional(),
});

export type TriggerRule = z.infer<typeof TriggerRuleSchema>;

/**
 * 触发表配置 Schema
 */
export const TriggerTableConfigSchema = z.object({
  /** 配置版本 */
  version: z.string(),
  /** 规则列表 */
  rules: z.array(TriggerRuleSchema),
});

export type TriggerTableConfig = z.infer<typeof TriggerTableConfigSchema>;

/**
 * 人物配置 Schema（用于 YAML 配置文件）
 */
export const CharacterConfigSchema = z.object({
  /** 人物 ID */
  id: z.string(),
  /** 人物名称 */
  name: z.string(),
  /** 所属势力 */
  faction: z.string().optional(),
  /** 人物描述 */
  description: z.string().optional(),
  /** 人格特质 */
  personality: z.object({
    traits: z.object({
      openness: z.number().min(0).max(1),
      conscientiousness: z.number().min(0).max(1),
      extraversion: z.number().min(0).max(1),
      agreeableness: z.number().min(0).max(1),
      neuroticism: z.number().min(0).max(1),
    }),
    values: z.object({
      selfDirection: z.number().min(0).max(1),
      benevolence: z.number().min(0).max(1),
      security: z.number().min(0).max(1),
    }),
  }),
  /** 初始能力值 */
  initialAbilities: z.record(z.number().min(0).max(100)).optional(),
  /** 初始关系 */
  initialRelationships: z
    .record(
      z.object({
        trust: z.number().min(0).max(1),
        hostility: z.number().min(0).max(1),
        intimacy: z.number().min(0).max(1),
        respect: z.number().min(0).max(1),
      })
    )
    .optional(),
  /** 行为配置 */
  behaviorConfig: z
    .object({
      /** 说话风格 */
      speakingStyle: z.string().optional(),
      /** 常用语 */
      catchphrases: z.array(z.string()).optional(),
    })
    .optional(),
});

export type CharacterConfig = z.infer<typeof CharacterConfigSchema>;

/**
 * 信息归属规则 Schema
 * 定义事件如何触发信息归属给人物
 */
export const InformationAttributionRuleSchema = z.object({
  /** 规则 ID */
  id: z.string(),
  /** 规则名称 */
  name: z.string(),
  /** 事件类型 */
  eventType: z.string(),
  /** 信息来源类型 */
  sourceType: z.enum(['witnessed', 'heard', 'told', 'inferred']),
  /** 归属目标 */
  attributionTarget: z.enum([
    'participants', // 所有参与者
    'witnesses', // 目击者（在场但非参与者）
    'specific', // 特定人物（需要在条件中指定）
    'all_present', // 所有在场人物
  ]),
  /** 触发条件（可选） */
  conditions: z.array(TriggerConditionSchema).optional(),
  /** 信息置信度（可选，默认 1.0） */
  confidence: z.number().min(0).max(1).optional(),
  /** 优先级 */
  priority: z.number().optional(),
});

export type InformationAttributionRule = z.infer<
  typeof InformationAttributionRuleSchema
>;

/**
 * 信息归属配置 Schema
 */
export const InformationAttributionConfigSchema = z.object({
  /** 配置版本 */
  version: z.string(),
  /** 规则列表 */
  rules: z.array(InformationAttributionRuleSchema),
});

export type InformationAttributionConfig = z.infer<
  typeof InformationAttributionConfigSchema
>;

/**
 * 信息推理规则 Schema
 * 当角色已知某些前提信息时，自动推理出新信息
 */
export const InferenceRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** 前提信息标签（角色需同时拥有含这些标签的信息） */
  premiseTags: z.array(z.string()),
  /** 推理出的信息内容模板 */
  conclusionTemplate: z.string(),
  /** 推理置信度（默认 0.7） */
  confidence: z.number().min(0).max(1).optional(),
  priority: z.number().optional(),
});

export type InferenceRule = z.infer<typeof InferenceRuleSchema>;

/**
 * 遗忘规则 Schema
 * 满足条件时，角色遗忘（移除）某些信息
 */
export const ForgetRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** 信息超过多少毫秒则遗忘（0 或未设置表示不按时间） */
  maxAgeMs: z.number().nonnegative().optional(),
  /** 信息标签匹配时遗忘 */
  targetTags: z.array(z.string()).optional(),
  /** 是否保留关键记忆（isKeyMemory=true 的信息不遗忘，默认 true） */
  preserveKeyMemory: z.boolean().optional(),
});

export type ForgetRule = z.infer<typeof ForgetRuleSchema>;

/**
 * 模糊规则 Schema
 * 满足条件时，降低角色对某些信息的置信度
 */
export const FuzzyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** 触发条件：信息来源类型 */
  sourceTypes: z
    .array(z.enum(['witnessed', 'heard', 'told', 'inferred']))
    .optional(),
  /** 触发条件：信息标签 */
  targetTags: z.array(z.string()).optional(),
  /** 置信度衰减系数（0-1，乘以当前置信度） */
  decayFactor: z.number().min(0).max(1),
  /** 信息超过多少毫秒后开始模糊 */
  afterAgeMs: z.number().nonnegative().optional(),
});

export type FuzzyRule = z.infer<typeof FuzzyRuleSchema>;

/**
 * 信息规则配置 Schema（推理 + 遗忘 + 模糊）
 */
export const InformationRulesConfigSchema = z.object({
  version: z.string(),
  inferenceRules: z.array(InferenceRuleSchema).optional(),
  forgetRules: z.array(ForgetRuleSchema).optional(),
  fuzzyRules: z.array(FuzzyRuleSchema).optional(),
});

export type InformationRulesConfig = z.infer<
  typeof InformationRulesConfigSchema
>;
