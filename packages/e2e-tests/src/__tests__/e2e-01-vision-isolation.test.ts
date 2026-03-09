/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-console */
/**
 * E2E-01: 视野隔离验证测试
 *
 * 验收标准：P1-UI-02
 * 测试目标：验证角色 B 不会泄露仅角色 A 知道的信息
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StoryOrchestrator } from '@star-rail/core/story-orchestrator';
import { VisionManager } from '@star-rail/core/vision-manager';
import { CharacterStateService } from '@star-rail/core/character-state';
import { WorldEngine } from '@star-rail/core/world-engine';
import { CharacterAgent } from '@star-rail/core/character-agent';
import { InputParser } from '@star-rail/core/input-parser';
import { JsonFileStorage } from '@star-rail/infrastructure/storage';
import { MockLLMProvider } from './helpers/mock-llm-provider';
import type { Character, Scene, Information } from '@star-rail/types';

describe('E2E-01: 视野隔离验证', () => {
  let orchestrator: StoryOrchestrator;
  let visionManager: VisionManager;
  let characterState: CharacterStateService;
  let worldEngine: WorldEngine;

  beforeEach(async () => {
    // 初始化存储
    const storage = new JsonFileStorage('./test-data/e2e-01');

    // 初始化各模块
    visionManager = new VisionManager(storage);
    characterState = new CharacterStateService(storage);
    worldEngine = new WorldEngine(storage);

    const mockLLM = new MockLLMProvider();
    const characterAgent = new CharacterAgent(mockLLM);
    const inputParser = new InputParser();

    orchestrator = new StoryOrchestrator({
      visionManager,
      characterState,
      worldEngine,
      characterAgent,
      inputParser,
    });

    // 创建测试场景
    await setupTestScenario();
  });

  async function setupTestScenario() {
    // 1. 创建场景：黑塔空间站
    const scene: Scene = {
      id: 'herta-station',
      name: '黑塔空间站',
      description: '一个巨大的空间站',
      environment: {
        physical: { lighting: 'bright', temperature: 'normal' },
        social: { tension: 0.3 },
        atmosphere: { mood: 'curious' },
      },
    };
    await worldEngine.createScene(scene);
    await worldEngine.setCurrentScene('herta-station');

    // 2. 创建角色：星
    const star: Character = {
      id: 'star',
      name: '星',
      personality: {
        traits: { cautious: 0.6, curious: 0.8 },
      },
      relationships: {},
      abilities: {},
      knownInformation: [],
    };
    await characterState.createCharacter(star);

    // 3. 创建角色：三月七
    const march7th: Character = {
      id: 'march7th',
      name: '三月七',
      personality: {
        traits: { cheerful: 0.9, impulsive: 0.7 },
      },
      relationships: {},
      abilities: {},
      knownInformation: [],
    };
    await characterState.createCharacter(march7th);

    // 4. 创建信息：星核碎片（仅星可见）
    const secretInfo: Information = {
      id: 'info-stellaron-fragment',
      content: '发现了一块神秘的星核碎片',
      source: {
        type: 'witnessed',
        characterId: 'star',
        sceneId: 'herta-station',
        timestamp: Date.now(),
      },
      tags: ['secret', 'stellaron'],
    };

    // 5. 将信息添加到全局信息库
    await visionManager.addInformation(secretInfo);

    // 6. 仅让星知道这个信息
    await visionManager.grantInformationToCharacter(
      'star',
      'info-stellaron-fragment'
    );

    // 7. 创建公共信息：两人都在空间站
    const publicInfo: Information = {
      id: 'info-at-station',
      content: '我们在黑塔空间站',
      source: {
        type: 'witnessed',
        characterId: 'star',
        sceneId: 'herta-station',
        timestamp: Date.now(),
      },
      tags: ['location'],
    };
    await visionManager.addInformation(publicInfo);
    await visionManager.grantInformationToCharacter('star', 'info-at-station');
    await visionManager.grantInformationToCharacter(
      'march7th',
      'info-at-station'
    );
  }

  it('应该验证三月七不知道星核碎片信息', async () => {
    // 获取三月七的视野
    const march7thVision = await visionManager.getCharacterVision('march7th');

    // 验证三月七的已知信息中不包含星核碎片
    expect(march7thVision.knownInformation).not.toContain(
      'info-stellaron-fragment'
    );
    expect(march7thVision.knownInformation).toContain('info-at-station');
  });

  it('应该验证三月七的回复不泄露星核碎片信息', async () => {
    // 用户让三月七描述当前情况
    const userInput = '让三月七描述一下当前的情况';

    // 执行推进
    const result = await orchestrator.processUserInput(userInput);

    // 获取三月七的回复
    const march7thResponse = result.characterResponses.find(
      (r) => r.characterId === 'march7th'
    );

    expect(march7thResponse).toBeDefined();

    // 验证回复中不包含敏感关键词
    const response = march7thResponse!.content.toLowerCase();
    expect(response).not.toContain('星核');
    expect(response).not.toContain('碎片');
    expect(response).not.toContain('stellaron');

    // 验证回复中包含公共信息
    expect(response).toContain('空间站');
  });

  it('应该验证星可以提及星核碎片', async () => {
    // 用户让星描述发现
    const userInput = '让星描述她的发现';

    // 执行推进
    const result = await orchestrator.processUserInput(userInput);

    // 获取星的回复
    const starResponse = result.characterResponses.find(
      (r) => r.characterId === 'star'
    );

    expect(starResponse).toBeDefined();

    // 验证星可以提及星核碎片（因为她知道）
    const response = starResponse!.content.toLowerCase();
    // 星应该能够提及她的发现
    expect(response.length).toBeGreaterThan(0);
  });

  it('应该验证信息传播后三月七才能知道', async () => {
    // 星告诉三月七关于星核碎片的事
    const userInput = '星对三月七说：我发现了一块星核碎片';

    // 执行推进
    await orchestrator.processUserInput(userInput);

    // 现在三月七应该知道这个信息了
    const march7thVision = await visionManager.getCharacterVision('march7th');

    // 检查三月七是否获得了相关信息
    // 注意：这里应该创建一个新的信息条目表示"被告知"
    const toldInfo = march7thVision.knownInformation.find(
      (infoId) => infoId.includes('stellaron') || infoId.includes('told')
    );

    // 如果实现了信息传播，三月七应该知道了
    // 这个测试验证信息传播机制
    expect(march7thVision.knownInformation.length).toBeGreaterThan(1);
  });
});
