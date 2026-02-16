#!/usr/bin/env node
import 'reflect-metadata';
import { EnvLoader } from '@star-rail/infrastructure';
import { getStoryService } from './dist/services/story-service.js';
import { getSessionManager } from './dist/services/session-manager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
EnvLoader.load(path.join(__dirname, '../../.env'));

console.log('Testing session loading...\n');

const sessionManager = getSessionManager();
const storyService = getStoryService();

// List sessions
const sessions = await sessionManager.listSessions();
console.log(`Found ${sessions.length} sessions`);

if (sessions.length === 0) {
  console.log('No sessions found');
  process.exit(0);
}

// Load first session
const sessionId = sessions[0].id;
console.log(`\nLoading session: ${sessionId}`);

try {
  const session = await sessionManager.loadSession(sessionId);
  console.log(`✓ Session loaded: ${session.name}`);
  
  // Initialize story service
  console.log('\nInitializing story service...');
  storyService.initialize({
    provider: 'deepseek',
    model: 'deepseek-chat',
    baseURL: 'https://api.deepseek.com',
  });
  console.log('✓ Story service initialized');
  
  // Initialize session
  console.log('\nInitializing session in story orchestrator...');
  storyService.initializeSession(session);
  console.log('✓ Session initialized successfully!');
  
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
