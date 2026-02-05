import 'reflect-metadata';

// Container
export { initializeContainer, getContainer, resolve } from './container.js';

// Vision Manager
export { VisionManager } from './vision-manager/index.js';

// Character State
export {
  BehaviorEngine,
  TriggerEngine,
  CharacterStateService,
} from './character-state/index.js';

// World Engine
export { WorldEngine } from './world-engine/index.js';

// Input Parser
export { InputParser, InputType } from './input-parser/index.js';

// Character Agent
export { CharacterAgent, PromptBuilder } from './character-agent/index.js';
export type { AgentResponse } from './character-agent/character-agent.js';
export type { PromptContext } from './character-agent/prompt-builder.js';

// Story Orchestrator
export { StoryOrchestrator } from './story-orchestrator/index.js';

// Anchor Evaluation
export { AnchorEvaluator } from './anchor-evaluation/index.js';

// Export Import
export { ExportImportService } from './export-import/index.js';
export type {
  ExportMetadata,
  ExportPackage,
  ImportResult,
} from './export-import/index.js';
