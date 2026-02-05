import { injectable, inject } from 'tsyringe';
import type { SessionState, SceneConfig, TriggerRule } from '@star-rail/types';
import type { StorageAdapter } from '@star-rail/infrastructure';
import { VisionManager } from '../vision-manager/vision-manager.js';
import { CharacterStateService } from '../character-state/character-state.service.js';
import { WorldEngine } from '../world-engine/world-engine.js';
import { InputParser, InputType } from '../input-parser/input-parser.js';
import {
  CharacterAgent,
  type AgentResponse,
} from '../character-agent/character-agent.js';

/**
 * 推进结果
 */
export interface AdvanceResult {
  success: boolean;
  responses: AgentResponse[];
  error?: string;
}

/**
 * 剧情编排器
 * 串联各模块，实现剧情推进流程
 */
@injectable()
export class StoryOrchestrator {
  constructor(
    @inject('StorageAdapter') private storage: StorageAdapter,
    private visionManager: VisionManager,
    private characterStateService: CharacterStateService,
    private worldEngine: WorldEngine,
    private inputParser: InputParser,
    private characterAgent: CharacterAgent
  ) {}

  /**
   * 初始化会话
   * 注册人物到输入解析器
   */
  initializeSession(session: SessionState): void {
    const characters = Object.values(session.characters);
    this.inputParser.registerCharacters(
      characters.map((c) => ({ id: c.id, name: c.name }))
    );
  }

  /**
   * 推进剧情
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
    // 1. 解析用户输入
    const parsed = this.inputParser.parse(userInput);

    if (parsed.type === InputType.Invalid) {
      return {
        success: false,
        responses: [],
        error: `无法解析输入: ${parsed.reason}`,
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
    this.worldEngine.addEvent(session.worldState, {
      eventId: `event_${Date.now()}`,
      sceneId: scene.id,
      participants: [targetCharacter.id],
      description:
        parsed.type === InputType.Dialogue
          ? `用户对${targetCharacter.name}说话`
          : `${targetCharacter.name}执行动作`,
    });

    // 7. 处理触发规则
    if (triggerRules.length > 0) {
      this.characterStateService.processEvent(
        targetCharacter,
        parsed.type === InputType.Dialogue ? 'dialogue' : 'action',
        triggerRules,
        { targetCharacterId: targetCharacter.id }
      );
    }

    // 8. 推进回合
    this.worldEngine.advanceTurn(session.worldState);

    // 9. 更新保存时间
    session.metadata.lastSaved = Date.now();

    return {
      success: true,
      responses: [response],
    };
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
}
