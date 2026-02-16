import 'reflect-metadata';
import {
  StoryOrchestrator,
  AnchorEvaluator,
  initializeContainer,
  getContainer,
  type SimpleLLMConfig,
} from '@star-rail/core';
import type {
  StateSnapshot,
  AdvanceResult,
  CompareOptions,
} from '@star-rail/core';
import type {
  SessionState,
  SceneConfig,
  TriggerRule,
  Anchor,
  ComparisonResult,
  LLMConfig,
} from '@star-rail/types';

/**
 * 剧情服务
 * 封装 StoryOrchestrator 和 AnchorEvaluator 供 CLI 使用
 */
export class StoryService {
  private orchestrator: StoryOrchestrator | null = null;
  private anchorEvaluator: AnchorEvaluator;
  private initialized = false;

  constructor() {
    this.anchorEvaluator = new AnchorEvaluator();
  }

  /**
   * 初始化服务
   * @param llmConfig LLM 配置
   * @param dataDir 数据目录
   */
  initialize(
    llmConfig: LLMConfig | SimpleLLMConfig,
    dataDir: string = './data'
  ): void {
    if (this.initialized) {
      return;
    }

    // 初始化 DI 容器
    initializeContainer({
      dataDir,
      llmConfig,
    });

    // 解析 StoryOrchestrator
    const container = getContainer();
    this.orchestrator = container.resolve(StoryOrchestrator);
    this.initialized = true;
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 初始化会话
   */
  initializeSession(session: SessionState): void {
    this.ensureInitialized();
    this.orchestrator!.initializeSession(session);
  }

  /**
   * 推进剧情（单角色）
   */
  async advance(
    session: SessionState,
    userInput: string,
    scene: SceneConfig,
    triggerRules: TriggerRule[] = []
  ): Promise<AdvanceResult> {
    this.ensureInitialized();
    return this.orchestrator!.advance(session, userInput, scene, triggerRules);
  }

  /**
   * 推进剧情（双角色对话）
   */
  async advanceDualCharacter(
    session: SessionState,
    scene: SceneConfig,
    characterAId: string,
    characterBId: string,
    userInput?: string
  ) {
    this.ensureInitialized();
    return this.orchestrator!.advanceDualCharacter(
      session,
      scene,
      characterAId,
      characterBId,
      userInput
    );
  }

  /**
   * 获取当前状态快照
   */
  getCurrentSnapshot(session: SessionState, scene: SceneConfig): StateSnapshot {
    this.ensureInitialized();
    return this.orchestrator!.getCurrentSnapshot(session, scene);
  }

  /**
   * 获取快照历史
   */
  getSnapshotHistory(): StateSnapshot[] {
    this.ensureInitialized();
    return this.orchestrator!.getSnapshotHistory();
  }

  // ==================== 锚点评估 ====================

  /**
   * 从快照创建锚点
   */
  createAnchorFromSnapshot(
    snapshot: StateSnapshot,
    options: {
      name: string;
      nodeId: string;
      storylineId: string;
      sequence: number;
      plotDescription: string;
      description?: string;
      themes?: string[];
    }
  ): Anchor {
    return this.anchorEvaluator.createAnchorFromSnapshot(snapshot, options);
  }

  /**
   * 从会话创建锚点
   */
  createAnchorFromSession(
    session: SessionState,
    options: {
      name: string;
      nodeId: string;
      storylineId: string;
      sequence: number;
      plotDescription: string;
      description?: string;
      themes?: string[];
    }
  ): Anchor {
    return this.anchorEvaluator.createAnchorFromSession(session, options);
  }

  /**
   * 添加锚点
   */
  addAnchor(anchor: Anchor): void {
    this.anchorEvaluator.addAnchor(anchor);
  }

  /**
   * 获取锚点
   */
  getAnchor(anchorId: string): Anchor | undefined {
    return this.anchorEvaluator.getAnchor(anchorId);
  }

  /**
   * 获取所有锚点
   */
  getAllAnchors(): Anchor[] {
    return this.anchorEvaluator.getAllAnchors();
  }

  /**
   * 获取剧情线的锚点
   */
  getAnchorsByStoryline(storylineId: string): Anchor[] {
    return this.anchorEvaluator.getAnchorsByStoryline(storylineId);
  }

  /**
   * 删除锚点
   */
  removeAnchor(anchorId: string): boolean {
    return this.anchorEvaluator.removeAnchor(anchorId);
  }

  /**
   * 对比当前状态与锚点
   */
  compare(
    session: SessionState,
    anchor: Anchor,
    options?: CompareOptions
  ): ComparisonResult {
    return this.anchorEvaluator.compare(session, anchor, options);
  }

  /**
   * 对比当前状态与快照
   */
  compareWithSnapshot(
    session: SessionState,
    snapshot: StateSnapshot,
    options?: CompareOptions
  ): ComparisonResult {
    return this.anchorEvaluator.compareWithSnapshot(session, snapshot, options);
  }

  /**
   * 批量对比多个锚点
   */
  compareMultiple(
    session: SessionState,
    anchorIds: string[],
    options?: CompareOptions
  ): ComparisonResult[] {
    return this.anchorEvaluator.compareMultiple(session, anchorIds, options);
  }

  /**
   * 对比剧情线上的所有锚点
   */
  compareStoryline(
    session: SessionState,
    storylineId: string,
    options?: CompareOptions
  ): ComparisonResult[] {
    return this.anchorEvaluator.compareStoryline(session, storylineId, options);
  }

  /**
   * 确保已初始化
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.orchestrator) {
      throw new Error('StoryService 未初始化，请先调用 initialize()');
    }
  }
}

// 单例
let storyService: StoryService | null = null;

export function getStoryService(): StoryService {
  if (!storyService) {
    storyService = new StoryService();
  }
  return storyService;
}
