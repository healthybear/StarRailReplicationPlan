import 'reflect-metadata';

// Container
export { initializeContainer, getContainer, resolve } from './container.js';
export type { SimpleLLMConfig } from './container.js';

// Vision Manager
export { VisionManager } from './vision-manager/index.js';
export type {
  EventContext,
  AttributionResult,
} from './vision-manager/index.js';

// Character State
export {
  BehaviorEngine,
  TriggerEngine,
  CharacterStateService,
} from './character-state/index.js';
export type {
  StateChangeRecord,
  StateChangeListener,
} from './character-state/index.js';

// World Engine
export { WorldEngine } from './world-engine/index.js';

// Input Parser
export {
  InputParser,
  InputType,
  DEFAULT_PERMISSION_CONFIG,
} from './input-parser/index.js';
export type {
  ParsedInput,
  ParsedCommand,
  ParsedDialogue,
  ParsedInvalid,
  ParsedUnauthorized,
  PermissionConfig,
} from './input-parser/index.js';

// Character Agent
export {
  CharacterAgent,
  PromptBuilder,
  ResponseType,
} from './character-agent/index.js';
export type {
  AgentResponse,
  ParsedResponseContent,
  DualCharacterResponse,
  PromptContext,
} from './character-agent/index.js';

// Story Orchestrator
export { StoryOrchestrator } from './story-orchestrator/index.js';
export type {
  AdvanceResult,
  StateSnapshot,
  MultiCharacterAdvanceOptions,
} from './story-orchestrator/index.js';

// Anchor Evaluation
export { AnchorEvaluator } from './anchor-evaluation/index.js';
export type {
  CreateAnchorOptions,
  CompareOptions,
} from './anchor-evaluation/index.js';

// Export Import
export { ExportImportService } from './export-import/index.js';
export type {
  ExportType,
  ConflictStrategy,
  ExportMetadata,
  ExportPackage,
  ConflictInfo,
  ImportOptions,
  ImportResult,
} from './export-import/index.js';
