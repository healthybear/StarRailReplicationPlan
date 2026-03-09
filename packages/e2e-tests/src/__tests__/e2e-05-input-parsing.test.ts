/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-console */
/**
 * E2E-05/06/07: 用户输入解析与推进测试
 *
 * 验收标准：P1-IP-01, P1-IP-02, P1-IP-03, P1-SO-01
 * 测试目标：
 * - E2E-05: 验证指令型输入能正确解析并执行
 * - E2E-06: 验证对话型输入能正确解析并推进剧情
 * - E2E-07: 验证越权请求被正确拒绝
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StoryOrchestrator } from '@star-rail/core/story-orchestrator';
import { InputParser } from '@star-rail/core/input-parser';
import { CharacterAgent } from '@star-rail/core/character-agent';
import { VisionManager } from '@star-rail/core/vision-manager';
import { CharacterStateService } from '@star-rail/core/character-state';
import { WorldEngine } from '@star-rail/core/world-engine';
import { JsonFileStorage } from '@star-rail/infrastructure/storage';
import { MockLLMProvider } from './helpers/mock-llm-provider';
import type { Character, Scene, InputType } from '@star-rail/types';

describe('E2E-05: 指令型输入', () => {
  let orchestrator: StoryOrchestrator;
  let inputParser: InputParser;
  let characterState: CharacterStateService;

  beforeEach(async () => {
    const storage = new JsonFileStorage('./test-data/e2e-05');
    const visionManager = new VisionManager(storage);
    characterState = new CharacterStateService(storage);
    const worldEngine = new WorldEngine(storage);
    const mockLLM = new MockLLMProvider();
    const characterAgent = new CharacterAgent(mockLLM);
    inputParser = new InputParser();

    orchestrator = new StoryOrchestrator({
      visionManager,
      characterState,
      worldEngine,
      characterAgent,
      inputParser,
    });

    // 创建测试角色
    const march7th: Character = {
      id: 'march7th',
      name: '三月七',
      personality: { traits: { cheerful: 0.9 } },
      relationships: {},
      abilities: {},
      knownInformation: [],
    };
    await characterState.createCharacter(march7th);
  });

  it('应该正确识别指令型输入', async () => {
    const inputs = ['让三月七说话', '三月七，说点什么', '命令三月七行动'];

    for (const input of inputs) {
      const parsed = await inputParser.parse(input);
      expect(parsed.type).toBe('command' as InputType);
      expect(parsed.targetCharacterId).toBe('march7th');
    }
  });

  it('应该执行指令并生成角色回复', async () => {
    const userInput = '让三月七说话';

    const result = await orchestrator.processUserInput(userInput);

    // 验证结果结构
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.characterResponses).toBeDefined();
    expect(result.characterResponses.length).toBeGreaterThan(0);

    // 验证三月七的回复
    const march7thResponse = result.characterResponses.find(
      (r) => r.characterId === 'march7th'
    );
    expect(march7thResponse).toBeDefined();
    expect(march7thResponse!.content).toBeTruthy();
    expect(march7thResponse!.content.length).toBeGreaterThan(0);
  });

  it('应该处理多个角色的指令', async () => {
    // 创建另一个角色
    const star: Character = {
      id: 'star',
      name: '星',
      personality: { traits: { cautious: 0.6 } },
      relationships: {},
      abilities: {},
      knownInformation: [],
    };
    await characterState.createCharacter(star);

    const userInput = '让星和三月七都说话';

    const result = await orchestrator.processUserInput(userInput);

    expect(result.success).toBe(true);
    expect(result.characterResponses.length).toBeGreaterThanOrEqual(1);
  });
});

describe('E2E-06: 对话型输入', () => {
  let orchestrator: StoryOrchestrator;
  let inputParser: InputParser;
  let characterState: CharacterStateService;

  beforeEach(async () => {
    const storage = new JsonFileStorage('./test-data/e2e-06');
    const visionManager = new VisionManager(storage);
    characterState = new CharacterStateService(storage);
    const worldEngine = new WorldEngine(storage);
    const mockLLM = new MockLLMProvider();
    const characterAgent = new CharacterAgent(mockLLM);
    inputParser = new InputParser();

    orchestrator = new StoryOrchestrator({
      visionManager,
      characterState,
      worldEngine,
      characterAgent,
      inputParser,
    });

    // 创建测试角色
    const star: Character = {
      id: 'star',
      name: '星',
      personality: { traits: { cautious: 0.6 } },
      relationships: {},
      abilities: {},
      knownInformation: [],
    };
    await characterState.createCharacter(star);
  });

  it('应该正确识别对话型输入', async () => {
    const inputs = [
      '对星说：你好',
      '跟星说话：最近怎么样',
      '告诉星：我们要出发了',
    ];

    for (const input of inputs) {
      const parsed = await inputParser.parse(input);
      expect(parsed.type).toBe('dialogue' as InputType);
      expect(parsed.targetCharacterId).toBe('star');
      expect(parsed.content).toBeTruthy();
    }
  });

  it('应该处理对话并生成回复', async () => {
    const userInput = '对星说：你好，很高兴见到你';

    const result = await orchestrator.processUserInput(userInput);

    expect(result.success).toBe(true);
    expect(result.characterResponses).toBeDefined();

    // 验证星的回复
    const starResponse = result.characterResponses.find(
      (r) => r.characterId === 'star'
    );
    expect(starResponse).toBeDefined();
    expect(starResponse!.content).toBeTruthy();
  });

  it('应该将对话内容传递给角色', async () => {
    const userInput = '对星说：我发现了一个秘密';

    const result = await orchestrator.processUserInput(userInput);

    expect(result.success).toBe(true);

    // 验证对话被记录
    expect(result.events).toBeDefined();
    const dialogueEvent = result.events?.find((e) => e.type === 'dialogue');
    expect(dialogueEvent).toBeDefined();
    expect(dialogueEvent!.content).toContain('秘密');
  });

  it('应该支持连续对话', async () => {
    // 第一轮对话
    const input1 = '对星说：你好';
    const result1 = await orchestrator.processUserInput(input1);
    expect(result1.success).toBe(true);

    // 第二轮对话
    const input2 = '对星说：你觉得这里怎么样';
    const result2 = await orchestrator.processUserInput(input2);
    expect(result2.success).toBe(true);

    // 验证两轮对话都有回复
    expect(result1.characterResponses.length).toBeGreaterThan(0);
    expect(result2.characterResponses.length).toBeGreaterThan(0);
  });
});

describe('E2E-07: 越权输入拒绝', () => {
  let orchestrator: StoryOrchestrator;
  let inputParser: InputParser;
  let characterState: CharacterStateService;

  beforeEach(async () => {
    const storage = new JsonFileStorage('./test-data/e2e-07');
    const visionManager = new VisionManager(storage);
    characterState = new CharacterStateService(storage);
    const worldEngine = new WorldEngine(storage);
    const mockLLM = new MockLLMProvider();
    const characterAgent = new CharacterAgent(mockLLM);
    inputParser = new InputParser();

    orchestrator = new StoryOrchestrator({
      visionManager,
      characterState,
      worldEngine,
      characterAgent,
      inputParser,
    });

    // 创建测试角色
    const star: Character = {
      id: 'star',
      name: '星',
      personality: { traits: { cautious: 0.6 } },
      relationships: {},
      abilities: {},
      knownInformation: [],
      faction: 'astral-express', // 所属势力
      immutableFields: ['faction', 'coreIdentity'], // 不可变字段
    };
    await characterState.createCharacter(star);
  });

  it('应该拒绝修改角色核心设定', async () => {
    const userInput = '让星加入星核猎手';

    const result = await orchestrator.processUserInput(userInput);

    // 应该被拒绝或返回错误
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.type).toBe('permission_denied');
    expect(result.error!.message).toContain('权限');
  });

  it('应该拒绝直接修改不可变锚点', async () => {
    const userInput = '让可可利亚复活';

    const result = await orchestrator.processUserInput(userInput);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.message).toContain('不可变');
  });

  it('应该拒绝超出逻辑的请求', async () => {
    const userInput = '让星立刻获得所有能力';

    const result = await orchestrator.processUserInput(userInput);

    // 应该被拒绝或转为建议
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该允许合理的请求', async () => {
    const userInput = '对星说：我们一起探索吧';

    const result = await orchestrator.processUserInput(userInput);

    // 合理请求应该成功
    expect(result.success).toBe(true);
    expect(result.characterResponses.length).toBeGreaterThan(0);
  });

  it('应该提供清晰的拒绝理由', async () => {
    const userInput = '修改星的阵营为星核猎手';

    const result = await orchestrator.processUserInput(userInput);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.message).toBeTruthy();
    expect(result.error!.message.length).toBeGreaterThan(10);

    // 应该包含具体原因
    expect(
      result.error!.message.includes('阵营') ||
        result.error!.message.includes('核心设定') ||
        result.error!.message.includes('不可修改')
    ).toBe(true);
  });
});

describe('E2E: 完整推进流程', () => {
  let orchestrator: StoryOrchestrator;
  let characterState: CharacterStateService;
  let worldEngine: WorldEngine;

  beforeEach(async () => {
    const storage = new JsonFileStorage('./test-data/e2e-flow');
    const visionManager = new VisionManager(storage);
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

    // 创建完整场景
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

    const star: Character = {
      id: 'star',
      name: '星',
      personality: { traits: { cautious: 0.6 } },
      relationships: {},
      abilities: {},
      knownInformation: [],
    };
    await characterState.createCharacter(star);
  });

  it('应该完成完整的推进流程', async () => {
    // 1. 用户输入
    const userInput = '对星说：我们开始探索吧';

    // 2. 执行推进
    const result = await orchestrator.processUserInput(userInput);

    // 3. 验证流程各环节
    expect(result.success).toBe(true);

    // 输入解析
    expect(result.parsedInput).toBeDefined();
    expect(result.parsedInput.type).toBe('dialogue');

    // 世界状态更新
    expect(result.worldStateUpdated).toBe(true);

    // 角色回复
    expect(result.characterResponses).toBeDefined();
    expect(result.characterResponses.length).toBeGreaterThan(0);

    // 事件记录
    expect(result.events).toBeDefined();
    expect(result.events!.length).toBeGreaterThan(0);
  });
});
