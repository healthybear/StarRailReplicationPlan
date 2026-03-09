import { injectable } from 'tsyringe';
import type { WorldState } from '@star-rail/types';

/**
 * 场景定义
 * P2-WE-01: 多场景支持
 */
export interface Scene {
  /** 场景唯一标识 */
  id: string;
  /** 场景名称 */
  name: string;
  /** 场景描述 */
  description: string;
  /** 场景类型 */
  type: 'indoor' | 'outdoor' | 'space' | 'virtual' | 'other';
  /** 场景标签 */
  tags: string[];
  /** 连接的场景（可到达的场景 ID 列表） */
  connectedScenes: string[];
  /** 场景中的道具实例 ID 列表 */
  items?: string[];
  /** 场景中的角色 ID 列表 */
  characters?: string[];
  /** 场景属性（自定义） */
  properties?: Record<string, unknown>;
}

/**
 * 场景切换条件
 * P2-WE-01: 场景切换规则
 */
export interface SceneTransitionCondition {
  /** 条件类型 */
  type: 'item_required' | 'character_present' | 'plot_node' | 'custom';
  /** 条件参数 */
  parameters: Record<string, unknown>;
}

/**
 * 场景切换定义
 * P2-WE-01: 场景切换系统
 */
export interface SceneTransition {
  /** 切换 ID */
  id: string;
  /** 源场景 ID */
  fromSceneId: string;
  /** 目标场景 ID */
  toSceneId: string;
  /** 切换名称（如"北门"、"传送点"） */
  name: string;
  /** 切换描述 */
  description?: string;
  /** 切换条件 */
  conditions?: SceneTransitionCondition[];
  /** 是否双向 */
  bidirectional: boolean;
  /** 切换效果（可选） */
  effects?: SceneTransitionEffect[];
}

/**
 * 场景切换效果
 */
export interface SceneTransitionEffect {
  /** 效果类型 */
  type: 'time_advance' | 'event_trigger' | 'state_change';
  /** 效果参数 */
  parameters: Record<string, unknown>;
}

/**
 * 场景切换记录
 */
export interface SceneTransitionRecord {
  timestamp: number;
  fromSceneId: string;
  toSceneId: string;
  transitionId?: string;
  characterIds: string[];
  reason?: string;
}

/**
 * 场景管理服务
 * P2-WE-01: 多场景支持与场景切换
 */
@injectable()
export class SceneManager {
  private scenes: Map<string, Scene> = new Map();
  private transitions: Map<string, SceneTransition> = new Map();
  private transitionHistory: SceneTransitionRecord[] = [];

  /**
   * 注册场景
   */
  registerScene(scene: Scene): void {
    this.scenes.set(scene.id, scene);
  }

  /**
   * 批量注册场景
   */
  registerScenes(scenes: Scene[]): void {
    for (const scene of scenes) {
      this.registerScene(scene);
    }
  }

  /**
   * 获取场景
   */
  getScene(sceneId: string): Scene | undefined {
    return this.scenes.get(sceneId);
  }

  /**
   * 获取所有场景
   */
  getAllScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }

  /**
   * 注册场景切换
   */
  registerTransition(transition: SceneTransition): void {
    this.transitions.set(transition.id, transition);

    // 如果是双向切换，自动创建反向切换
    if (transition.bidirectional) {
      const reverseId = `${transition.id}_reverse`;
      if (!this.transitions.has(reverseId)) {
        this.transitions.set(reverseId, {
          ...transition,
          id: reverseId,
          fromSceneId: transition.toSceneId,
          toSceneId: transition.fromSceneId,
          bidirectional: false, // 避免无限递归
        });
      }
    }
  }

  /**
   * 批量注册场景切换
   */
  registerTransitions(transitions: SceneTransition[]): void {
    for (const transition of transitions) {
      this.registerTransition(transition);
    }
  }

  /**
   * 获取场景的可用切换
   */
  getAvailableTransitions(sceneId: string): SceneTransition[] {
    return Array.from(this.transitions.values()).filter(
      (t) => t.fromSceneId === sceneId
    );
  }

  /**
   * 检查场景切换是否可用
   */
  canTransition(
    worldState: WorldState,
    transitionId: string,
    characterIds: string[]
  ): { canTransition: boolean; reason?: string } {
    const transition = this.transitions.get(transitionId);
    if (!transition) {
      return { canTransition: false, reason: '切换不存在' };
    }

    if (worldState.currentSceneId !== transition.fromSceneId) {
      return { canTransition: false, reason: '当前不在源场景' };
    }

    // 检查条件
    if (transition.conditions) {
      for (const condition of transition.conditions) {
        const result = this.checkCondition(worldState, condition, characterIds);
        if (!result.satisfied) {
          return { canTransition: false, reason: result.reason };
        }
      }
    }

    return { canTransition: true };
  }

  /**
   * 执行场景切换
   */
  executeTransition(
    worldState: WorldState,
    transitionId: string,
    characterIds: string[],
    reason?: string
  ): { success: boolean; error?: string } {
    const canTransitionResult = this.canTransition(
      worldState,
      transitionId,
      characterIds
    );

    if (!canTransitionResult.canTransition) {
      return { success: false, error: canTransitionResult.reason };
    }

    const transition = this.transitions.get(transitionId)!;
    const fromSceneId = worldState.currentSceneId;

    // 更新世界状态
    worldState.currentSceneId = transition.toSceneId;

    // 应用切换效果
    if (transition.effects) {
      for (const effect of transition.effects) {
        this.applyEffect(worldState, effect);
      }
    }

    // 记录切换
    this.transitionHistory.push({
      timestamp: Date.now(),
      fromSceneId,
      toSceneId: transition.toSceneId,
      transitionId,
      characterIds,
      reason,
    });

    return { success: true };
  }

  /**
   * 直接切换场景（无需切换定义）
   */
  changeScene(
    worldState: WorldState,
    toSceneId: string,
    characterIds: string[],
    reason?: string
  ): { success: boolean; error?: string } {
    const scene = this.scenes.get(toSceneId);
    if (!scene) {
      return { success: false, error: '目标场景不存在' };
    }

    const fromSceneId = worldState.currentSceneId;
    worldState.currentSceneId = toSceneId;

    // 记录切换
    this.transitionHistory.push({
      timestamp: Date.now(),
      fromSceneId,
      toSceneId,
      characterIds,
      reason,
    });

    return { success: true };
  }

  /**
   * 获取场景中的角色
   */
  getCharactersInScene(sceneId: string): string[] {
    const scene = this.scenes.get(sceneId);
    return scene?.characters || [];
  }

  /**
   * 添加角色到场景
   */
  addCharacterToScene(sceneId: string, characterId: string): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    if (!scene.characters) {
      scene.characters = [];
    }

    if (!scene.characters.includes(characterId)) {
      scene.characters.push(characterId);
    }

    return true;
  }

  /**
   * 从场景移除角色
   */
  removeCharacterFromScene(sceneId: string, characterId: string): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene || !scene.characters) return false;

    const index = scene.characters.indexOf(characterId);
    if (index !== -1) {
      scene.characters.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * 获取切换历史
   */
  getTransitionHistory(limit?: number): SceneTransitionRecord[] {
    if (limit) {
      return this.transitionHistory.slice(-limit);
    }
    return [...this.transitionHistory];
  }

  /**
   * 清除切换历史
   */
  clearTransitionHistory(): void {
    this.transitionHistory = [];
  }

  /**
   * 清除所有数据
   */
  clear(): void {
    this.scenes.clear();
    this.transitions.clear();
    this.transitionHistory = [];
  }

  /**
   * 检查切换条件
   */
  private checkCondition(
    worldState: WorldState,
    condition: SceneTransitionCondition,
    characterIds: string[]
  ): { satisfied: boolean; reason?: string } {
    switch (condition.type) {
      case 'item_required': {
        const requiredItemId = condition.parameters.itemId as string;
        const hasItem = worldState.worldItems
          ? Object.values(worldState.worldItems).some(
              (inst) =>
                inst.itemId === requiredItemId &&
                characterIds.includes(inst.ownerId || '')
            )
          : false;

        if (!hasItem) {
          return { satisfied: false, reason: `需要道具: ${requiredItemId}` };
        }
        break;
      }

      case 'character_present': {
        const requiredCharacterId = condition.parameters.characterId as string;
        if (!characterIds.includes(requiredCharacterId)) {
          return {
            satisfied: false,
            reason: `需要角色在场: ${requiredCharacterId}`,
          };
        }
        break;
      }

      case 'plot_node': {
        const requiredNodeId = condition.parameters.nodeId as string;
        if (worldState.currentPlotNodeId !== requiredNodeId) {
          return {
            satisfied: false,
            reason: `需要剧情节点: ${requiredNodeId}`,
          };
        }
        break;
      }

      case 'custom': {
        // 自定义条件需要外部实现
        return { satisfied: true };
      }
    }

    return { satisfied: true };
  }

  /**
   * 应用切换效果
   */
  private applyEffect(
    worldState: WorldState,
    effect: SceneTransitionEffect
  ): void {
    switch (effect.type) {
      case 'time_advance': {
        const turns = (effect.parameters.turns as number) || 1;
        worldState.timeline.currentTurn += turns;
        worldState.timeline.timestamp = Date.now();
        break;
      }

      case 'event_trigger': {
        // 事件触发需要外部处理
        break;
      }

      case 'state_change': {
        // 状态变化需要外部处理
        break;
      }
    }
  }
}
