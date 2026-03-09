import { injectable } from 'tsyringe';
import type {
  Faction,
  FactionConfig,
  FactionRelationship,
} from '@star-rail/types';
import {
  FactionSchema,
  createDefaultFactionRelationship,
} from '@star-rail/types';

/**
 * 势力变更记录
 */
export interface FactionChangeRecord {
  /** 变更时间戳 */
  timestamp: number;
  /** 事件类型 */
  eventType: string;
  /** 变更目标势力 ID */
  factionId: string;
  /** 变更类型 */
  changeType:
    | 'member_join'
    | 'member_leave'
    | 'relationship_change'
    | 'property_change';
  /** 变更详情 */
  details: Record<string, unknown>;
}

/**
 * 势力服务
 * 管理势力定义、成员关系和势力间关系
 * P2-CS-01: 多角色状态与势力/关系扩展
 */
@injectable()
export class FactionService {
  private factions: Map<string, Faction> = new Map();
  private changeHistory: FactionChangeRecord[] = [];

  /**
   * 注册势力定义
   */
  registerFaction(faction: Faction): void {
    FactionSchema.parse(faction);
    this.factions.set(faction.id, faction);
  }

  /**
   * 从配置加载势力
   */
  loadFactionConfig(config: FactionConfig): void {
    const faction: Faction = {
      id: config.id,
      name: config.name,
      description: config.description,
      members: config.initialMembers || [],
      goals: config.goals,
      relationships: config.initialRelationships,
      tags: config.tags,
    };
    this.registerFaction(faction);
  }

  /**
   * 批量加载势力配置
   */
  loadFactionConfigs(configs: FactionConfig[]): void {
    for (const config of configs) {
      this.loadFactionConfig(config);
    }
  }

  /**
   * 获取势力
   */
  getFaction(factionId: string): Faction | undefined {
    return this.factions.get(factionId);
  }

  /**
   * 获取所有势力
   */
  getAllFactions(): Faction[] {
    return Array.from(this.factions.values());
  }

  /**
   * 添加成员到势力
   */
  addMember(factionId: string, characterId: string): boolean {
    const faction = this.factions.get(factionId);
    if (!faction) return false;

    if (!faction.members.includes(characterId)) {
      faction.members.push(characterId);
      this.recordChange({
        timestamp: Date.now(),
        eventType: 'member_join',
        factionId,
        changeType: 'member_join',
        details: { characterId },
      });
    }
    return true;
  }

  /**
   * 从势力移除成员
   */
  removeMember(factionId: string, characterId: string): boolean {
    const faction = this.factions.get(factionId);
    if (!faction) return false;

    const index = faction.members.indexOf(characterId);
    if (index !== -1) {
      faction.members.splice(index, 1);
      this.recordChange({
        timestamp: Date.now(),
        eventType: 'member_leave',
        factionId,
        changeType: 'member_leave',
        details: { characterId },
      });
      return true;
    }
    return false;
  }

  /**
   * 获取角色所属势力
   */
  getCharacterFaction(characterId: string): Faction | undefined {
    return Array.from(this.factions.values()).find((faction) =>
      faction.members.includes(characterId)
    );
  }

  /**
   * 获取势力间关系
   */
  getFactionRelationship(
    factionId: string,
    targetFactionId: string
  ): FactionRelationship {
    const faction = this.factions.get(factionId);
    if (!faction) return createDefaultFactionRelationship();

    if (!faction.relationships) {
      faction.relationships = {};
    }

    if (!faction.relationships[targetFactionId]) {
      faction.relationships[targetFactionId] =
        createDefaultFactionRelationship();
    }

    return faction.relationships[targetFactionId];
  }

  /**
   * 更新势力间关系
   */
  updateFactionRelationship(
    factionId: string,
    targetFactionId: string,
    updates: Partial<FactionRelationship>
  ): boolean {
    const faction = this.factions.get(factionId);
    if (!faction) return false;

    if (!faction.relationships) {
      faction.relationships = {};
    }

    const oldRelationship =
      faction.relationships[targetFactionId] ||
      createDefaultFactionRelationship();
    faction.relationships[targetFactionId] = {
      ...oldRelationship,
      ...updates,
    };

    this.recordChange({
      timestamp: Date.now(),
      eventType: 'faction_relationship_change',
      factionId,
      changeType: 'relationship_change',
      details: {
        targetFactionId,
        oldRelationship,
        newRelationship: faction.relationships[targetFactionId],
      },
    });

    return true;
  }

  /**
   * 检查两个势力是否为盟友
   */
  areAllies(factionId1: string, factionId2: string): boolean {
    const rel1 = this.getFactionRelationship(factionId1, factionId2);
    const rel2 = this.getFactionRelationship(factionId2, factionId1);
    return rel1.alliance === true || rel2.alliance === true;
  }

  /**
   * 检查两个势力是否敌对
   */
  areHostile(factionId1: string, factionId2: string): boolean {
    const rel1 = this.getFactionRelationship(factionId1, factionId2);
    const rel2 = this.getFactionRelationship(factionId2, factionId2);
    return rel1.attitude < -0.5 || rel2.attitude < -0.5;
  }

  /**
   * 获取势力的所有盟友
   */
  getAllies(factionId: string): Faction[] {
    const faction = this.factions.get(factionId);
    if (!faction || !faction.relationships) return [];

    return Object.entries(faction.relationships)
      .filter(([, rel]) => rel.alliance === true)
      .map(([targetId]) => this.factions.get(targetId))
      .filter((f): f is Faction => f !== undefined);
  }

  /**
   * 获取势力的所有敌对势力
   */
  getEnemies(factionId: string): Faction[] {
    const faction = this.factions.get(factionId);
    if (!faction || !faction.relationships) return [];

    return Object.entries(faction.relationships)
      .filter(([, rel]) => rel.attitude < -0.5)
      .map(([targetId]) => this.factions.get(targetId))
      .filter((f): f is Faction => f !== undefined);
  }

  /**
   * 获取变更历史
   */
  getChangeHistory(limit?: number): FactionChangeRecord[] {
    if (limit) {
      return this.changeHistory.slice(-limit);
    }
    return [...this.changeHistory];
  }

  /**
   * 清除变更历史
   */
  clearChangeHistory(): void {
    this.changeHistory = [];
  }

  /**
   * 清除所有势力数据
   */
  clear(): void {
    this.factions.clear();
    this.changeHistory = [];
  }

  /**
   * 记录变更
   */
  private recordChange(change: FactionChangeRecord): void {
    this.changeHistory.push(change);
  }
}
