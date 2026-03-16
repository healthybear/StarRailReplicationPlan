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
 * 故事编排器 - 核心业务逻辑协调器
 *
 * 职责：
 * 1. 协调输入解析、视野过滤、角色响应、状态更新等模块
 * 2. 管理故事推进的完整生命周期（单角色/多角色/双角色对话）
 * 3. 处理快照创建与加载，支持状态回溯
 * 4. 实现死胡同检测与回退机制
 * 5. 监控各阶段性能指标（响应时间、快照数量）
 *
 * 核心流程：
 * 用户输入 → 解析命令 → 过滤视野 → 生成响应 → 更新状态 → 创建快照
 *
 * 对应 WBS：P1-SO-01（单轮推进流程）、P1-SO-02（状态快照）、P3-SO-01（死胡同兜底）、P3-INF-01（性能监控）
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
    // 依赖注入验证：确保所有核心模块都已正确注入
    // 这些模块是故事编排器正常运行的必要依赖
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
   *
   * 职责：
   * 1. 将会话中的所有角色注册到输入解析器（用于角色名称识别）
   * 2. 清空快照历史（新会话或重新加载会话时）
   *
   * @param session 会话状态
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
   *
   * 这是故事推进的核心方法，完整流程包括：
   * 1. 解析用户输入（命令/对话/角色指定）
   * 2. 验证权限和角色有效性
   * 3. 获取角色视野（过滤不可见信息）
   * 4. 调用 LLM 生成角色响应
   * 5. 更新世界状态和角色状态
   * 6. 创建状态快照（用于回退）
   * 7. 记录性能指标
   *
   * P1-SO-01: 用户输入→解析→世界/信息/状态更新→Agent 调用→结果写回
   *
   * @param session 会话状态
   * @param userInput 用户输入文本
   * @param scene 当前场景配置
   * @param triggerRules 触发规则（用于状态变更）
   * @returns 推进结果，包含角色响应、状态变更、快照 ID、性能指标
   */
  async advance(
    session: SessionState,
    userInput: string,
    scene: SceneConfig,
    triggerRules: TriggerRule[] = []
  ): Promise<AdvanceResult> {
    const startTime = Date.now();

    // 步骤 1: 解析用户输入
    // 输入解析器会识别命令类型（对话/动作/命令）、目标角色、权限验证
    const parsed = this.inputParser.parse(userInput);

    // 处理无效输入
    if (parsed.type === InputType.Invalid) {
      return {
        success: false,
        responses: [],
        error: `无法解析输入: ${parsed.reason}`,
      };
    }

    // 处理越权请求（例如尝试控制不允许控制的角色）
    if (parsed.type === InputType.Unauthorized) {
      return {
        success: false,
        responses: [],
        error: `越权请求: ${parsed.reason}`,
      };
    }

    // 步骤 2: 获取目标角色
    const targetCharacter = session.characters[parsed.targetCharacterId];
    if (!targetCharacter) {
      return {
        success: false,
        responses: [],
        error: `未找到角色: ${parsed.targetCharacterId}`,
      };
    }

    // 步骤 3: 获取角色的过滤后视野
    // 视野管理器会根据信息归属规则过滤掉角色不应知道的信息
    const knownInfo = this.visionManager.getFilteredVision(
      targetCharacter.id,
      session.information
    );

    // 步骤 4: 获取最近事件（用于上下文）
    const recentEvents = this.worldEngine.getRecentEvents(session.worldState);

    // 步骤 5: 生成角色响应
    // 调用 LLM 生成符合角色性格和当前情境的响应
    const response = await this.characterAgent.generateResponse(
      targetCharacter,
      scene,
      knownInfo,
      recentEvents,
      parsed.type === InputType.Dialogue ? parsed.content : undefined
    );

    // 步骤 6: 添加事件到事件链
    // 记录本轮发生的事件，用于后续回合的上下文
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

    // 步骤 7: 处理触发规则并收集状态变更
    // 触发规则可能导致角色状态变化（如好感度、情绪等）
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

    // 步骤 8: 如果是对话，记录响应事件
    if (parsed.type === InputType.Dialogue && response.parsed?.dialogue) {
      this.worldEngine.addEvent(session.worldState, {
        eventId: `event_response_${Date.now()}`,
        sceneId: scene.id,
        participants: [targetCharacter.id],
        description: `${targetCharacter.name}回应了用户`,
      });
    }

    // 步骤 9: 推进回合
    this.worldEngine.advanceTurn(session.worldState);

    // 步骤 10: 更新保存时间
    session.metadata.lastSaved = Date.now();

    // 步骤 11: 创建状态快照（P1-SO-02）
    // 快照用于锚点对比和死胡同回退
    this.createSnapshot(session, scene);

    // 性能监控：检查响应时间是否超过阈值
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
   *
   * 用于多个角色同时在场的场景，每个角色会根据各自的视野生成响应。
   * 与单角色推进的区别：
   * 1. 支持多个角色同时响应
   * 2. 每个角色有独立的视野过滤
   * 3. 所有角色的响应会一起返回
   *
   * P1-SO-01: 支持多角色同时在场的场景
   *
   * @param session 会话状态
   * @param scene 当前场景配置
   * @param options 多角色推进选项（角色列表、用户输入、触发规则）
   * @returns 推进结果，包含所有角色的响应
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
   *
   * 专门用于两个角色之间的对话场景，特点：
   * 1. 两个角色分别注入各自的视野（信息不对称）
   * 2. 生成的响应会考虑双方的互动关系
   * 3. 适用于角色间的深度对话和关系发展
   *
   * P1-CA-03 + P1-SO-01: 两个角色分别注入各自视野后调用
   *
   * @param session 会话状态
   * @param scene 当前场景配置
   * @param characterAId 角色 A ID
   * @param characterBId 角色 B ID
   * @param userInput 用户输入（可选，用于引导对话方向）
   * @returns 双角色对话结果
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
    // 关键：两个角色可能知道不同的信息，这会影响对话内容
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
    // CharacterAgent 会生成考虑双方关系和信息差异的对话
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
   *
   * 快照用途：
   * 1. 锚点对比：记录关键时刻的状态，用于分支对比
   * 2. 死胡同回退：当剧情陷入僵局时，可以回退到之前的快照
   * 3. 状态追踪：记录角色状态、已知信息、关系变化的历史
   *
   * 快照内容：
   * - 回合数、场景 ID、情节节点 ID
   * - 所有角色的已知信息列表
   * - 所有角色的关系状态
   *
   * P1-SO-02: 编排器在每轮结束后写入当前状态
   *
   * @param session 会话状态
   * @param scene 当前场景
   * @returns 创建的快照对象
   */
  createSnapshot(session: SessionState, scene: SceneConfig): StateSnapshot {
    const characters: AnchorCharacterState[] = [];

    for (const char of Object.values(session.characters)) {
      // 收集关系状态（仅记录信任度）
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
    // 这样可以控制内存占用，避免快照无限增长
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
   *
   * 当角色获得新信息时（通过对话、观察、推理等），需要：
   * 1. 将信息添加到全局信息库（如果不存在）
   * 2. 将信息添加到角色的已知信息列表
   * 3. 更新视野管理器的索引（用于后续过滤）
   *
   * @param session 会话状态
   * @param characterId 角色 ID
   * @param information 信息对象
   */
  addInformationToCharacter(
    session: SessionState,
    characterId: string,
    information: Information
  ): void {
    // 添加到全局信息库（避免重复）
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
          confidence: 1, // 默认完全确信
        });
      }
    }

    // 更新视野索引（用于后续的视野过滤）
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
