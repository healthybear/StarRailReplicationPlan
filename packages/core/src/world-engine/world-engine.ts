import { injectable } from 'tsyringe';
import type { WorldState, EventRecord } from '@star-rail/types';
import { createDefaultWorldState } from '@star-rail/types';

/**
 * 世界引擎
 * 管理世界状态、场景和事件链
 */
@injectable()
export class WorldEngine {
  /**
   * 创建新的世界状态
   */
  createWorldState(sceneId: string): WorldState {
    return createDefaultWorldState(sceneId);
  }

  /**
   * 获取当前场景 ID
   */
  getCurrentSceneId(worldState: WorldState): string {
    return worldState.currentSceneId;
  }

  /**
   * 切换场景
   */
  changeScene(worldState: WorldState, newSceneId: string): void {
    worldState.currentSceneId = newSceneId;
  }

  /**
   * 推进回合
   */
  advanceTurn(worldState: WorldState): void {
    worldState.timeline.currentTurn += 1;
    worldState.timeline.timestamp = Date.now();
  }

  /**
   * 添加事件到事件链
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
   */
  getRecentEvents(worldState: WorldState, count: number = 10): EventRecord[] {
    return worldState.eventChain.slice(-count);
  }

  /**
   * 更新环境状态
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
   */
  setCurrentPlotNode(worldState: WorldState, nodeId: string): void {
    worldState.currentPlotNodeId = nodeId;
  }

  /**
   * 更新势力态度
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
    worldState.environment.social.factions[factionId].attitude = Math.max(
      -1,
      Math.min(1, attitude)
    );
  }
}
