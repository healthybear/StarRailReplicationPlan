import { injectable } from 'tsyringe';
import type { WorldState, EventRecord } from '@star-rail/types';
import { createDefaultWorldState } from '@star-rail/types';

/**
 * 世界引擎 - 世界状态与事件管理
 *
 * 职责：
 * 1. 管理世界状态（场景、时间线、环境）
 * 2. 处理场景切换
 * 3. 推进回合（时间流逝）
 * 4. 管理事件链（记录所有发生的事件）
 * 5. 更新环境状态（物理、社会、氛围）
 * 6. 管理情节节点和势力态度
 *
 * 世界状态包含：
 * - 当前场景 ID
 * - 时间线（当前回合、时间戳）
 * - 事件链（所有历史事件）
 * - 环境状态（物理环境、社会环境、氛围）
 * - 当前情节节点 ID
 *
 * 对应 WBS：P1-WE-01（世界状态管理）、P1-WE-02（事件链管理）
 */
@injectable()
export class WorldEngine {
  /**
   * 创建新的世界状态
   *
   * 初始化一个新的世界状态，包含默认的环境设置。
   *
   * @param sceneId 初始场景 ID
   * @returns 新创建的世界状态
   */
  createWorldState(sceneId: string): WorldState {
    return createDefaultWorldState(sceneId);
  }

  /**
   * 获取当前场景 ID
   *
   * @param worldState 世界状态
   * @returns 当前场景 ID
   */
  getCurrentSceneId(worldState: WorldState): string {
    return worldState.currentSceneId;
  }

  /**
   * 切换场景
   *
   * 改变当前场景，用于场景转换。
   * 场景切换会影响角色的可见信息和可执行动作。
   *
   * @param worldState 世界状态
   * @param newSceneId 新场景 ID
   */
  changeScene(worldState: WorldState, newSceneId: string): void {
    worldState.currentSceneId = newSceneId;
  }

  /**
   * 推进回合
   *
   * 每次故事推进后调用，用于：
   * 1. 增加回合计数
   * 2. 更新时间戳
   * 3. 触发基于回合的规则（如遗忘、模糊）
   *
   * @param worldState 世界状态
   */
  advanceTurn(worldState: WorldState): void {
    worldState.timeline.currentTurn += 1;
    worldState.timeline.timestamp = Date.now();
  }

  /**
   * 添加事件到事件链
   *
   * 记录发生的事件，用于：
   * 1. 提供上下文给 LLM（最近事件）
   * 2. 触发信息归属规则
   * 3. 追踪故事发展历史
   *
   * @param worldState 世界状态
   * @param event 事件对象（不含时间戳）
   * @returns 完整的事件记录（含时间戳）
   */
  addEvent(
    worldState: WorldState,
    event: Omit<EventRecord, 'timestamp'>
  ): EventRecord {
    const eventRecord: EventRecord = {
      ...event,
      timestamp: Date.now(),
    };
    worldState.eventChain.push(eventRecord);
    return eventRecord;
  }

  /**
   * 获取最近的事件
   *
   * 返回最近 N 条事件，用于提供上下文给 LLM。
   * 默认返回最近 10 条事件。
   *
   * @param worldState 世界状态
   * @param count 返回的事件数量（默认 10）
   * @returns 最近的事件列表
   */
  getRecentEvents(worldState: WorldState, count: number = 10): EventRecord[] {
    return worldState.eventChain.slice(-count);
  }

  /**
   * 更新环境状态
   *
   * 更新世界的环境属性，包括：
   * - 物理环境：天气、温度、光照、时间段、场景状况
   * - 社会环境：势力态度、公共情绪、安全等级
   * - 氛围：紧张度、神秘感、危险感
   *
   * @param worldState 世界状态
   * @param updates 环境更新（部分更新）
   */
  updateEnvironment(
    worldState: WorldState,
    updates: Partial<WorldState['environment']>
  ): void {
    if (updates.physical) {
      Object.assign(worldState.environment.physical, updates.physical);
    }
    if (updates.social) {
      Object.assign(worldState.environment.social, updates.social);
    }
    if (updates.atmosphere) {
      Object.assign(worldState.environment.atmosphere, updates.atmosphere);
    }
  }

  /**
   * 设置当前情节节点
   *
   * 用于追踪故事进度，标记当前所在的情节节点。
   *
   * @param worldState 世界状态
   * @param nodeId 情节节点 ID
   */
  setCurrentPlotNode(worldState: WorldState, nodeId: string): void {
    worldState.currentPlotNodeId = nodeId;
  }

  /**
   * 更新势力态度
   *
   * 更新特定势力对玩家/主角的态度。
   * 态度范围：-1（敌对）到 1（友好）。
   *
   * @param worldState 世界状态
   * @param factionId 势力 ID
   * @param attitude 态度值（-1 到 1）
   */
  updateFactionAttitude(
    worldState: WorldState,
    factionId: string,
    attitude: number
  ): void {
    if (!worldState.environment.social.factions[factionId]) {
      worldState.environment.social.factions[factionId] = {
        attitude: 0,
        control: 0,
      };
    }
    // 限制态度值在 -1 到 1 之间
    worldState.environment.social.factions[factionId].attitude = Math.max(
      -1,
      Math.min(1, attitude)
    );
  }
}
