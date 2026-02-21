import { injectable } from 'tsyringe';
import type {
  Faction,
  FactionConfig,
  FactionRelationship,
  Character,
} from '@star-rail/types';
import {
  FactionSchema,
  createDefaultFactionRelationship,
} from '@star-rail/types';

/**
 * 势力服务
 * 管理势力实体的创建、成员关系和势力间关系
 */
@injectable()
export class FactionService {
  private factions: Map<string, Faction> = new Map();

  /**
   * 从配置创建势力
   */
  createFactionFromConfig(config: FactionConfig): Faction {
    const faction: Faction = FactionSchema.parse({
      id: config.id,
      name: config.name,
      description: config.description,
      members: config.initialMembers ?? [],
      goals: config.goals,
      relationships: config.initialRelationships ?? {},
      tags: config.tags,
    });
    this.factions.set(faction.id, faction);
    return faction;
  }

  /**
   * 注册势力
   */
  registerFaction(faction: Faction): void {
    this.factions.set(faction.id, faction);
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
  addMember(factionId: string, characterId: string): void {
    const faction = this.factions.get(factionId);
    if (!faction) return;
    if (!faction.members.includes(characterId)) {
      faction.members.push(characterId);
    }
  }

  /**
   * 从势力移除成员
   */
  removeMember(factionId: string, characterId: string): void {
    const faction = this.factions.get(factionId);
    if (!faction) return;
    faction.members = faction.members.filter((id) => id !== characterId);
  }

  /**
   * 获取人物所属势力列表
   */
  getCharacterFactions(characterId: string): Faction[] {
    return Array.from(this.factions.values()).filter((f) =>
      f.members.includes(characterId)
    );
  }

  /**
   * 同步人物的 faction 字段到势力成员列表
   * 当人物的 faction 字段变更时调用
   */
  syncCharacterFaction(character: Character): void {
    if (!character.faction) return;
    // 确保势力存在
    if (!this.factions.has(character.faction)) return;
    this.addMember(character.faction, character.id);
  }

  /**
   * 获取两个势力之间的关系
   */
  getFactionRelationship(
    factionId: string,
    targetFactionId: string
  ): FactionRelationship {
    const faction = this.factions.get(factionId);
    if (!faction?.relationships?.[targetFactionId]) {
      return createDefaultFactionRelationship();
    }
    return faction.relationships[targetFactionId];
  }

  /**
   * 更新两个势力之间的关系
   */
  updateFactionRelationship(
    factionId: string,
    targetFactionId: string,
    updates: Partial<FactionRelationship>
  ): void {
    const faction = this.factions.get(factionId);
    if (!faction) return;

    if (!faction.relationships) {
      faction.relationships = {};
    }

    const existing =
      faction.relationships[targetFactionId] ??
      createDefaultFactionRelationship();

    faction.relationships[targetFactionId] = {
      ...existing,
      ...updates,
      attitude:
        updates.attitude !== undefined
          ? Math.max(-1, Math.min(1, updates.attitude))
          : existing.attitude,
    };
  }

  /**
   * 获取与指定势力结盟的所有势力
   */
  getAllies(factionId: string): Faction[] {
    const faction = this.factions.get(factionId);
    if (!faction?.relationships) return [];

    return Object.entries(faction.relationships)
      .filter(([, rel]) => rel.alliance === true)
      .map(([id]) => this.factions.get(id))
      .filter((f): f is Faction => f !== undefined);
  }

  /**
   * 获取与指定势力敌对的所有势力（态度 < -0.5）
   */
  getEnemies(factionId: string): Faction[] {
    const faction = this.factions.get(factionId);
    if (!faction?.relationships) return [];

    return Object.entries(faction.relationships)
      .filter(([, rel]) => rel.attitude < -0.5)
      .map(([id]) => this.factions.get(id))
      .filter((f): f is Faction => f !== undefined);
  }

  /**
   * 清除所有势力数据
   */
  clear(): void {
    this.factions.clear();
  }
}
