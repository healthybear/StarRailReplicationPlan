// Character types
export {
  RelationshipSchema,
  BigFiveTraitsSchema,
  BehaviorTendenciesSchema,
  PersonalitySchema,
  KnownInformationRefSchema,
  CharacterStateSchema,
  CharacterMetadataSchema,
  CharacterSchema,
  createDefaultRelationship,
  createDefaultPersonality,
} from './character.js';
export type {
  Relationship,
  BigFiveTraits,
  BehaviorTendencies,
  Personality,
  KnownInformationRef,
  CharacterState,
  CharacterMetadata,
  Character,
} from './character.js';

// World state types
export {
  PhysicalEnvironmentSchema,
  FactionStateSchema,
  SocialEnvironmentSchema,
  AtmosphereSchema,
  EnvironmentSchema,
  TimelineSchema,
  EventRecordSchema,
  WorldStateSchema,
  SceneConfigSchema,
  createDefaultWorldState,
} from './world-state.js';
export type {
  PhysicalEnvironment,
  FactionState,
  SocialEnvironment,
  Atmosphere,
  Environment,
  Timeline,
  EventRecord,
  WorldState,
  SceneConfig,
} from './world-state.js';

// Information types
export {
  InformationSourceEnum,
  InformationSchema,
  InformationStoreSchema,
  createEmptyInformationStore,
  generateInformationId,
} from './information.js';
export type {
  InformationSource,
  Information,
  InformationStore,
} from './information.js';

// Session types
export {
  SessionMetadataSchema,
  SessionStateSchema,
  SnapshotSchema,
  generateSessionId,
  generateSnapshotId,
  CURRENT_DATA_VERSION,
} from './session.js';
export type { SessionMetadata, SessionState, Snapshot } from './session.js';

// Anchor types
export {
  AnchorCharacterStateSchema,
  AnchorSchema,
  ComparisonDimensionSchema,
  ComparisonResultSchema,
  generateAnchorId,
} from './anchor.js';
export type {
  AnchorCharacterState,
  Anchor,
  ComparisonDimension,
  ComparisonResult,
} from './anchor.js';

// Faction types
export {
  FactionRelationshipSchema,
  FactionSchema,
  FactionConfigSchema,
  createDefaultFactionRelationship,
} from './faction.js';
export type { FactionRelationship, Faction, FactionConfig } from './faction.js';

// Plot types
export {
  PlotOutcomeTypeEnum,
  PlotOutcomeSchema,
  PlotBranchSchema,
  PlotNodeSchema,
  PlotGraphConfigSchema,
} from './plot.js';
export type {
  PlotOutcomeType,
  PlotOutcome,
  PlotBranch,
  PlotNode,
  PlotGraphConfig,
} from './plot.js';

// Item types
export {
  ItemTypeEnum,
  ItemSchema,
  ItemInstanceSchema,
  ItemStoreSchema,
  createEmptyItemStore,
  generateItemInstanceId,
} from './item.js';
export type { ItemType, Item, ItemInstance, ItemStore } from './item.js';

// Config types
export {
  LLMProviderConfigSchema,
  LLMConfigSchema,
  TriggerEffectSchema,
  TriggerConditionSchema,
  TriggerRuleSchema,
  TriggerTableConfigSchema,
  CharacterConfigSchema,
  InformationAttributionRuleSchema,
  InformationAttributionConfigSchema,
} from './config.js';
export type {
  LLMProviderConfig,
  LLMConfig,
  TriggerEffect,
  TriggerCondition,
  TriggerRule,
  TriggerTableConfig,
  CharacterConfig,
  InformationAttributionRule,
  InformationAttributionConfig,
} from './config.js';
