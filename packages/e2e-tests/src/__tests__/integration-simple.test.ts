/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-console */
/**
 * 简化的集成测试
 * 验证核心模块能否正常协同工作
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestContainer, TestContainer } from './helpers/test-container';
import { StoryOrchestrator } from '@star-rail/core/story-orchestrator';
import { VisionManager } from '@star-rail/core/vision-manager';
import { CharacterStateService } from '@star-rail/core/character-state';
import type { Character, SessionState } from '@star-rail/types';

describe('简化集成测试', () => {
  let testContainer: TestContainer;
  let orchestrator: StoryOrchestrator;
  let characterState: CharacterStateService;

  beforeEach(() => {
    testContainer = createTestContainer();
    orchestrator = testContainer.resolve(StoryOrchestrator);
    characterState = testContainer.resolve(CharacterStateService);
  });

  afterEach(() => {
    testContainer.cleanup();
  });

  it('应该能够创建角色', async () => {
    const character: Character = {
      id: 'test-char',
      name: '测试角色',
      personality: {
        traits: { friendly: 0.8 },
      },
      relationships: {},
      abilities: {},
      knownInformation: [],
    };

    await characterState.createCharacter(character);

    const retrieved = await characterState.getCharacter('test-char');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('测试角色');
  });

  it('应该能够列出角色', async () => {
    const char1: Character = {
      id: 'char-1',
      name: '角色1',
      personality: { traits: {} },
      relationships: {},
      abilities: {},
      knownInformation: [],
    };

    const char2: Character = {
      id: 'char-2',
      name: '角色2',
      personality: { traits: {} },
      relationships: {},
      abilities: {},
      knownInformation: [],
    };

    await characterState.createCharacter(char1);
    await characterState.createCharacter(char2);

    const list = await characterState.listCharacters();
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('应该能够更新角色', async () => {
    const character: Character = {
      id: 'test-char',
      name: '测试角色',
      personality: { traits: { friendly: 0.5 } },
      relationships: {},
      abilities: { combat: 50 },
      knownInformation: [],
    };

    await characterState.createCharacter(character);

    await characterState.updateCharacter('test-char', {
      abilities: { combat: 75 },
    });

    const updated = await characterState.getCharacter('test-char');
    expect(updated?.abilities.combat).toBe(75);
  });
});
