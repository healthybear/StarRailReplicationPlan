import { injectable, inject } from 'tsyringe';
import type {
  SessionState,
  SceneConfig,
  TriggerRule,
  Information,
  Character,
  AnchorCharacterState,
} from '@star-rail/types';
import type { StorageAdapter } from '@star-rail/infrastructure';
import { VisionManager } from '../vision-manager/vision-manager.js';
import { CharacterStateService } from '../character-state/character-state.service.js';
import { WorldEngine } from '../world-engine/world-engine.js';
import { InputParser, InputType } from '../input-parser/input-parser.js';
import {
  CharacterAgent,
  type AgentResponse,
  type DualCharacterResponse,
} from '../character-agent/character-agent.js';

/**
 * 推进结果
 * P1-SO-01: 单轮推进流程的返回结果
 */
export interface AdvanceResult {
  /** 是否成功 */
  success: boolean;
  /** 角色响应列表 */
  responses: AgentResponse[];
  /** 错误信息 */
  error?: string;
  /** 本轮事件 ID */
  eventId?: string;
  /** 状态变更记录 */
  stateChanges?: Array<{
    characterId: string;
    target: string;
    oldValue: number;
    newValue: number;
  }>;
  /** 响应耗时（毫秒）（P3-INF-01） */
  durationMs?: number;
  /** 是否触发死胡同兜底（P3-SO-01） */
  deadEndFallback?: boolean;
}

/**
 * 状态快照
 * P1-SO-02: 用于锚点对比的状态快照
 */
export interface StateSnapshot {
  /** 快照 ID */
  snapshotId: string;
  /** 创建时间戳 */
  timestamp: number;
  /** 当前回合 */
  turn: number;
  /** 当前场景 ID */
  sceneId: string;
  /** 当前情节节点 ID */
  plotNodeId?: string;
  /** 角色状态快照 */
  characters: AnchorCharacterState[];
  /** 环境描述 */
  environmentDescription?: string;
}

/**
 * 多角色推进选项
 */
export interface MultiCharacterAdvanceOptions {
  /** 在场角色 ID 列表 */
  characterIds: string[];
  /** 用户输入 */
  userInput?: string;
  /** 触发规则 */
  triggerRules?: TriggerRule[];
}

/**
 * 剧情编排器
 * P1-SO-01~02: 串联各模块，实现剧情推进流程
 */
@injectable()
export class StoryOrchestrator {
  /** 状态快照历史 */
  private snapshotHistory: StateSnapshot[] = [];

  /** 快照数量上限（P3-INF-01，0 表示不限制） */
  private maxSnapshots: number = 0;

  /** 响应时间告警阈值（毫秒，P3-INF-01，0 表示不监控） */
  private responseTimeThresholdMs: number = 0;

  /** 死胡同兜底消息（P3-SO-01） */
  private deadEndFallbackMessage: string =
    '当前剧情陷入僵局，请尝试其他行动或切换场景。';

  constructor(
    @inject('StorageAdapter') private storage: StorageAdapter,
    private visionManager: VisionManager,
    private characterStateService: CharacterStateService,
    private worldEngine: WorldEngine,
    private inputParser: InputParser,
    private characterAgent: CharacterAgent
  ) {
    // 调试：检查所有依赖是否正确注入
    if (!storage) console.error('[StoryOrchestrator] storage is undefined');
    if (!visionManager)
      console.error('[StoryOrchestrator] visionManager is undefined');
    if (!characterStateService)
      console.error('[StoryOrchestrator] characterStateService is undefined');
    if (!worldEngine)
      console.error('[StoryOrchestrator] worldEngine is undefined');
    if (!inputParser)
      console.error('[StoryOrchestrator] inputParser is undefined');
    if (!characterAgent)
      console.error('[StoryOrchestrator] characterAgent is undefined');
  }

  // ==================== P3-INF-01 性能与存储上限 ====================

  /**
   * 配置快照上限与响应时间监控
   * P3-INF-01: 响应时间与存储上限符合设计指标；可配置快照上限
   * @param maxSnapshots 最大快照数量（0 = 不限制）
   * @param responseTimeThresholdMs 响应时间告警阈值（0 = 不监控）
   */
  configurePerformance(
    maxSnapshots: number,
    responseTimeThresholdMs = 0
  ): void {
    this.maxSnapshots = maxSnapshots;
    this.responseTimeThresholdMs = responseTimeThresholdMs;
  }

  /**
   * 获取当前快照数量
   */
  getSnapshotCount(): number {
    return this.snapshotHistory.length;
  }

  /**
   * 获取性能配置
   */
  getPerformanceConfig(): {
    maxSnapshots: number;
    responseTimeThresholdMs: number;
  } {
    return {
      maxSnapshots: this.maxSnapshots,
      responseTimeThresholdMs: this.responseTimeThresholdMs,
    };
  }

  // ==================== P3-SO-01 死胡同兜底 ====================

  /**
   * 配置死胡同兜底消息
   * P3-SO-01: 无推进路径时提示或触发支线
   */
  configureDeadEndFallback(message: string): void {
    this.deadEndFallbackMessage = message;
  }

  /**
   * 检测是否陷入死胡同
   * P3-SO-01: 连续多轮无有效响应或响应内容重复时判定为死胡同
   * @param recentResponses 最近几轮的响应列表
   * @param threshold 重复阈值（默认 3 轮）
   */
  detectDeadEnd(recentResponses: AgentResponse[], threshold = 3): boolean {
    if (recentResponses.length < threshold) return false;
    const last = recentResponses.slice(-threshold);
    // 所有响应内容完全相同则判定为死胡同
    const firstContent = last[0].content;
    return last.every((r) => r.content === firstContent);
  }

  /**
   * 尝试从损坏快照回滚到最近有效快照
   * P3-SO-01: 状态/快照损坏时回滚与提示
   * @returns 最近有效快照，或 null（无可用快照）
   */
  rollbackToLastValidSnapshot(): StateSnapshot | null {
    // 从最新往旧找第一个有效快照（有角色数据）
    for (let i = this.snapshotHistory.length - 1; i >= 0; i--) {
      const snap = this.snapshotHistory[i];
      if (snap && snap.characters && snap.characters.length > 0) {
        return snap;
      }
    }
    return null;
  }

  /**
   * 初始化会话
   * 注册人物到输入解析器
   */
  initializeSession(session: SessionState): void {
    const characters = Object.values(session.characters);
    this.inputParser.registerCharacters(
      characters.map((c) => ({ id: c.id, name: c.name }))
    );
    // 清空快照历史
    this.snapshotHistory = [];
  }

  /**
   * 推进剧情（单角色）
   * P1-SO-01: 用户输入→解析→世界/信息/状态更新→Agent 调用→结果写回
   * @param session 会话状态
   * @param userInput 用户输入
   * @param scene 当前场景配置
   * @param triggerRules 触发规则
   */
  async advance(
    session: SessionState,
    userInput: string,
    scene: SceneConfig,
    triggerRules: TriggerRule[] = []
  ): Promise<AdvanceResult> {
    const startTime = Date.now();
    // 1. 解析用户输入
    const parsed = this.inputParser.parse(userInput);

    if (parsed.type === InputType.Invalid) {
      return {
        success: false,
        responses: [],
        error: `无法解析输入: ${parsed.reason}`,
      };
    }

    if (parsed.type === InputType.Unauthorized) {
      return {
        success: false,
        responses: [],
        error: `越权请求: ${parsed.reason}`,
      };
    }

    // 2. 获取目标角色
    const targetCharacter = session.characters[parsed.targetCharacterId];
    if (!targetCharacter) {
      return {
        success: false,
        responses: [],
        error: `未找到角色: ${parsed.targetCharacterId}`,
      };
    }

    // 3. 获取角色的过滤后视野
    const knownInfo = this.visionManager.getFilteredVision(
      targetCharacter.id,
      session.information
    );

    // 4. 获取最近事件
    const recentEvents = this.worldEngine.getRecentEvents(session.worldState);

    // 5. 生成角色响应
    const response = await this.characterAgent.generateResponse(
      targetCharacter,
      scene,
      knownInfo,
      recentEvents,
      parsed.type === InputType.Dialogue ? parsed.content : undefined
    );

    // 6. 添加事件到事件链
    const eventId = `event_${Date.now()}`;
    this.worldEngine.addEvent(session.worldState, {
      eventId,
      sceneId: scene.id,
      participants: [targetCharacter.id],
      description:
        parsed.type === InputType.Dialogue
          ? `用户对${targetCharacter.name}说话`
          : `${targetCharacter.name}执行动作`,
    });

    // 7. 处理触发规则并收集状态变更
    const stateChanges: AdvanceResult['stateChanges'] = [];
    if (triggerRules.length > 0) {
      const changes = this.characterStateService.processEventWithRules(
        targetCharacter,
        parsed.type === InputType.Dialogue ? 'dialogue' : 'action',
        triggerRules,
        { targetCharacterId: targetCharacter.id }
      );

      for (const change of changes) {
        stateChanges.push({
          characterId: targetCharacter.id,
          target: change.target,
          oldValue: change.oldValue,
          newValue: change.newValue,
        });
      }
    }

    // 8. 如果是对话，可能需要更新信息（角色获得新信息）
    if (parsed.type === InputType.Dialogue && response.parsed?.dialogue) {
      // 记录对话事件
      this.worldEngine.addEvent(session.worldState, {
        eventId: `event_response_${Date.now()}`,
        sceneId: scene.id,
        participants: [targetCharacter.id],
        description: `${targetCharacter.name}回应了用户`,
      });
    }

    // 9. 推进回合
    this.worldEngine.advanceTurn(session.worldState);

    // 10. 更新保存时间
    session.metadata.lastSaved = Date.now();

    // 11. 创建状态快照（P1-SO-02）
    this.createSnapshot(session, scene);

    const durationMs = Date.now() - startTime;
    if (
      this.responseTimeThresholdMs > 0 &&
      durationMs > this.responseTimeThresholdMs
    ) {
      console.warn(
        `[StoryOrchestrator] advance 响应时间 ${durationMs}ms 超过阈值 ${this.responseTimeThresholdMs}ms`
      );
    }

    return {
      success: true,
      responses: [response],
      eventId,
      stateChanges: stateChanges.length > 0 ? stateChanges : undefined,
      durationMs,
    };
  }

  /**
   * 推进剧情（多角色场景）
   * P1-SO-01: 支持多角色同时在场的场景
   * @param session 会话状态
   * @param scene 当前场景配置
   * @param options 多角色推进选项
   */
  async advanceMultiCharacter(
    session: SessionState,
    scene: SceneConfig,
    options: MultiCharacterAdvanceOptions
  ): Promise<AdvanceResult> {
    const { characterIds, userInput, triggerRules = [] } = options;

    // 获取所有在场角色
    const characters: Character[] = [];
    for (const id of characterIds) {
      const char = session.characters[id];
      if (char) {
        characters.push(char);
      }
    }

    if (characters.length === 0) {
      return {
        success: false,
        responses: [],
        error: '没有找到有效的在场角色',
      };
    }

    // 为每个角色获取过滤后的视野
    const knownInfoMap = new Map<string, Information[]>();
    for (const char of characters) {
      const knownInfo = this.visionManager.getFilteredVision(
        char.id,
        session.information
      );
      knownInfoMap.set(char.id, knownInfo);
    }

    // 获取最近事件
    const recentEvents = this.worldEngine.getRecentEvents(session.worldState);

    // 生成所有角色的响应
    const responses = await this.characterAgent.generateMultipleResponses(
      characters,
      scene,
      knownInfoMap,
      recentEvents
    );

    // 添加事件
    const eventId = `event_multi_${Date.now()}`;
    this.worldEngine.addEvent(session.worldState, {
      eventId,
      sceneId: scene.id,
      participants: characterIds,
      description: userInput ? `用户输入: ${userInput}` : `多角色场景推进`,
    });

    // 处理触发规则
    const stateChanges: AdvanceResult['stateChanges'] = [];
    if (triggerRules.length > 0) {
      for (const char of characters) {
        const changes = this.characterStateService.processEventWithRules(
          char,
          'scene_advance',
          triggerRules,
          { sceneId: scene.id }
        );

        for (const change of changes) {
          stateChanges.push({
            characterId: char.id,
            target: change.target,
            oldValue: change.oldValue,
            newValue: change.newValue,
          });
        }
      }
    }

    // 推进回合
    this.worldEngine.advanceTurn(session.worldState);

    // 更新保存时间
    session.metadata.lastSaved = Date.now();

    // 创建状态快照
    this.createSnapshot(session, scene);

    return {
      success: true,
      responses,
      eventId,
      stateChanges: stateChanges.length > 0 ? stateChanges : undefined,
    };
  }

  /**
   * 双角色对话推进
   * P1-CA-03 + P1-SO-01: 两个角色分别注入各自视野后调用
   * @param session 会话状态
   * @param scene 当前场景配置
   * @param characterAId 角色 A ID
   * @param characterBId 角色 B ID
   * @param userInput 用户输入（可选）
   */
  async advanceDualCharacter(
    session: SessionState,
    scene: SceneConfig,
    characterAId: string,
    characterBId: string,
    userInput?: string
  ): Promise<{
    success: boolean;
    result?: DualCharacterResponse;
    error?: string;
  }> {
    const characterA = session.characters[characterAId];
    const characterB = session.characters[characterBId];

    if (!characterA || !characterB) {
      return {
        success: false,
        error: `未找到角色: ${!characterA ? characterAId : characterBId}`,
      };
    }

    // 获取各自的过滤后视野
    const knownInfoA = this.visionManager.getFilteredVision(
      characterAId,
      session.information
    );
    const knownInfoB = this.visionManager.getFilteredVision(
      characterBId,
      session.information
    );

    // 获取最近事件
    const recentEvents = this.worldEngine.getRecentEvents(session.worldState);

    // 生成双角色响应
    const result = await this.characterAgent.generateDualCharacterResponses(
      characterA,
      characterB,
      scene,
      knownInfoA,
      knownInfoB,
      recentEvents,
      userInput
    );

    // 添加事件
    this.worldEngine.addEvent(session.worldState, {
      eventId: `event_dual_${Date.now()}`,
      sceneId: scene.id,
      participants: [characterAId, characterBId],
      description: `${characterA.name}与${characterB.name}的对话`,
    });

    // 推进回合
    this.worldEngine.advanceTurn(session.worldState);

    // 更新保存时间
    session.metadata.lastSaved = Date.now();

    // 创建状态快照
    this.createSnapshot(session, scene);

    return {
      success: true,
      result,
    };
  }

  /**
   * 创建状态快照
   * P1-SO-02: 编排器在每轮结束后写入当前状态
   * @param session 会话状态
   * @param scene 当前场景
   */
  createSnapshot(session: SessionState, scene: SceneConfig): StateSnapshot {
    const characters: AnchorCharacterState[] = [];

    for (const char of Object.values(session.characters)) {
      // 收集关系状态
      const relationships: Record<string, number> = {};
      for (const [targetId, rel] of Object.entries(char.state.relationships)) {
        relationships[targetId] = rel.trust;
      }

      characters.push({
        characterId: char.id,
        characterName: char.name,
        knownInformationIds: char.state.knownInformation.map(
          (k) => k.informationId
        ),
        relationships:
          Object.keys(relationships).length > 0 ? relationships : undefined,
      });
    }

    const snapshot: StateSnapshot = {
      snapshotId: `snapshot_${Date.now()}`,
      timestamp: Date.now(),
      turn: session.worldState.timeline.currentTurn,
      sceneId: scene.id,
      plotNodeId: session.worldState.currentPlotNodeId,
      characters,
    };

    this.snapshotHistory.push(snapshot);

    // P3-INF-01: 超出上限时移除最旧的快照
    if (
      this.maxSnapshots > 0 &&
      this.snapshotHistory.length > this.maxSnapshots
    ) {
      this.snapshotHistory.splice(
        0,
        this.snapshotHistory.length - this.maxSnapshots
      );
    }

    return snapshot;
  }

  /**
   * 获取当前状态快照
   * P1-SO-02: 锚点模块可读取当前分支状态
   * @param session 会话状态
   * @param scene 当前场景
   */
  getCurrentSnapshot(session: SessionState, scene: SceneConfig): StateSnapshot {
    return this.createSnapshot(session, scene);
  }

  /**
   * 获取快照历史
   */
  getSnapshotHistory(): StateSnapshot[] {
    return [...this.snapshotHistory];
  }

  /**
   * 获取指定回合的快照
   * @param turn 回合数
   */
  getSnapshotByTurn(turn: number): StateSnapshot | undefined {
    return this.snapshotHistory.find((s) => s.turn === turn);
  }

  /**
   * 清除快照历史
   */
  clearSnapshotHistory(): void {
    this.snapshotHistory = [];
  }

  /**
   * 添加信息到角色视野
   * @param session 会话状态
   * @param characterId 角色 ID
   * @param information 信息
   */
  addInformationToCharacter(
    session: SessionState,
    characterId: string,
    information: Information
  ): void {
    // 添加到全局信息库
    const existingInfo = session.information.global.find(
      (i) => i.id === information.id
    );
    if (!existingInfo) {
      session.information.global.push(information);
    }

    // 添加到角色已知信息
    const character = session.characters[characterId];
    if (character) {
      const alreadyKnown = character.state.knownInformation.some(
        (k) => k.informationId === information.id
      );
      if (!alreadyKnown) {
        character.state.knownInformation.push({
          informationId: information.id,
          acquiredAt: Date.now(),
          confidence: 1,
        });
      }
    }

    // 更新视野索引
    this.visionManager.assignInformationToCharacter(
      session.information,
      characterId,
      information.id
    );
  }

  /**
   * 保存会话
   */
  async saveSession(session: SessionState): Promise<void> {
    session.metadata.lastSaved = Date.now();
    await this.storage.saveSession(session.metadata.sessionId, session);
  }

  /**
   * 加载会话
   */
  async loadSession(sessionId: string): Promise<SessionState | null> {
    const session = await this.storage.loadSession(sessionId);
    if (session) {
      this.initializeSession(session);
    }
    return session;
  }

  /**
   * 获取会话列表
   */
  async listSessions(): Promise<string[]> {
    return this.storage.listSessions();
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.storage.deleteSession(sessionId);
  }
}
