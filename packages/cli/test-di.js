#!/usr/bin/env node
import 'reflect-metadata';
import { initializeContainer, getContainer, StoryOrchestrator } from '@star-rail/core';

console.log('Testing DI container...\n');

// Initialize container
initializeContainer({
  dataDir: './data',
  llmConfig: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    apiKey: 'test-key',
    baseURL: 'https://api.deepseek.com',
  },
});

console.log('Container initialized\n');

// Try to resolve StoryOrchestrator
try {
  const container = getContainer();
  const orchestrator = container.resolve(StoryOrchestrator);
  console.log('✓ StoryOrchestrator resolved successfully');
  console.log('✓ All dependencies should be injected properly');
} catch (error) {
  console.error('✗ Failed to resolve StoryOrchestrator:', error.message);
  console.error(error.stack);
  process.exit(1);
}
