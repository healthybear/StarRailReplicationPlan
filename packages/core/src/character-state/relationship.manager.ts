import { injectable } from 'tsyringe';
import type { Character, Relationship } from '@star-rail/types';
import { createDefaultRelationship } from '@star-rail/types';

/**
 * 关系事件类型
 * P2-CS-01: 支持更多关系变化事件
 */
export type RelationshipEventType =
  | 'trust_gain'
  | 'trust_loss'
  | 'hostility_increase'
  | 'hostility_decrease'
  | 'intimacy_increase'
  | 'intimacy_decrease'
  | 'respect_gain'
  | 'respect_loss'
  | 'affection_gain'
  | 'affection_loss'
  | 'fear_increase'
  | 'fear_decrease'
  | 'dependence_increase'
  | 'dependence_decrease'
  | 'tag_add'
  | 'tag_remove';

/**
 * 关系变更记录
 */
export interface RelationshipChangeRecord {
  timestamp: number;
  sourceCharacterId: string;
  targetCharacterId: string;
  eventType: RelationshipEventType;
  dimension: keyof Relationship;
  oldValue?: number | string[];
  newValue?: number | string[];
  reason?: string;
}

/**
 * 关系管理器
 * P2-CS-01: 多角色状态与势力/关系扩展
 * 管理人物间的多维度关系
 */
@injectable()
export class RelationshipManager {
  private changeHistory: RelationshipChangeRecord[] = [];

  /**
   * 获取关系（如不存在则创建默认关系）
   */
  getRelationship(character: Character, targetId: string): Relationship {
    if (!character.state.relationships[targetId]) {
      character.state.relationships[targetId] = createDefaultRelationship();
    }
    return character.state.relationships[targetId];
  }

  /**
   * 更新关系维度
   */
  updateRelationshipDimension(
    character: Character,
    targetId: string,
    dimension: keyof Relationship,
    value: number,
    reason?: string
  ): void {
    const relationship = this.getRelationship(character, targetId);

    if (dimension === 'custom' || dimension === 'tags') {
      throw new Error(`Use specific methods for ${dimension}`);
    }

    const oldValue = relationship[dimension] as number | undefined;
    const clampedValue = Math.max(0, Math.min(1, value));

    (relationship[dimension] as number) = clampedValue;

    this.recordChange({
      timestamp: Date.now(),
      sourceCharacterId: character.id,
      targetCharacterId: targetId,
      eventType: this.inferEventType(dimension, oldValue, clampedValue),
      dimension,
      oldValue,
      newValue: clampedValue,
      reason,
    });
  }

  /**
   * 批量更新关系
   */
  updateRelationship(
    character: Character,
    targetId: string,
    updates: Partial<Relationship>,
    reason?: string
  ): void {
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'custom' || key === 'tags') continue;
      if (typeof value === 'number') {
        this.updateRelationshipDimension(
          character,
          targetId,
          key as keyof Relationship,
          value,
          reason
        );
      }
    }

    // 处理标签
    if (updates.tags) {
      this.setRelationshipTags(character, targetId, updates.tags);
    }
  }

  /**
   * 添加关系标签
   */
  addRelationshipTag(
    character: Character,
    targetId: string,
    tag: string
  ): void {
    const relationship = this.getRelationship(character, targetId);
    if (!relationship.tags) {
      relationship.tags = [];
    }
    if (!relationship.tags.includes(tag)) {
      const oldTags = [...relationship.tags];
      relationship.tags.push(tag);
      this.recordChange({
        timestamp: Date.now(),
        sourceCharacterId: character.id,
        targetCharacterId: targetId,
        eventType: 'tag_add',
        dimension: 'tags',
        oldValue: oldTags,
        newValue: [...relationship.tags],
      });
    }
  }

  /**
   * 移除关系标签
   */
  removeRelationshipTag(
    character: Character,
    targetId: string,
    tag: string
  ): void {
    const relationship = this.getRelationship(character, targetId);
    if (!relationship.tags) return;

    const index = relationship.tags.indexOf(tag);
    if (index !== -1) {
      const oldTags = [...relationship.tags];
      relationship.tags.splice(index, 1);
      this.recordChange({
        timestamp: Date.now(),
        sourceCharacterId: character.id,
        targetCharacterId: targetId,
        eventType: 'tag_remove',
        dimension: 'tags',
        oldValue: oldTags,
        newValue: [...relationship.tags],
      });
    }
  }

  /**
   * 设置关系标签（替换所有）
   */
  setRelationshipTags(
    character: Character,
    targetId: string,
    tags: string[]
  ): void {
    const relationship = this.getRelationship(character, targetId);
    const oldTags = relationship.tags || [];
    relationship.tags = [...tags];

    if (JSON.stringify(oldTags) !== JSON.stringify(tags)) {
      this.recordChange({
        timestamp: Date.now(),
        sourceCharacterId: character.id,
        targetCharacterId: targetId,
        eventType: 'tag_add',
        dimension: 'tags',
        oldValue: oldTags,
        newValue: [...tags],
      });
    }
  }

  /**
   * 检查是否有特定关系标签
   */
  hasRelationshipTag(
    character: Character,
    targetId: string,
    tag: string
  ): boolean {
    const relationship = this.getRelationship(character, targetId);
    return relationship.tags?.includes(tag) || false;
  }

  /**
   * 获取关系摘要
   */
  getRelationshipSummary(
    character: Character,
    targetId: string
  ): {
    overall: 'positive' | 'neutral' | 'negative';
    dominant: string;
    tags: string[];
  } {
    const rel = this.getRelationship(character, targetId);

    // 计算总体倾向
    const positive =
      (rel.trust + rel.intimacy + rel.respect + (rel.affection || 0)) / 4;
    const negative = (rel.hostility + (rel.fear || 0)) / 2;

    let overall: 'positive' | 'neutral' | 'negative';
    if (positive - negative > 0.2) {
      overall = 'positive';
    } else if (negative - positive > 0.2) {
      overall = 'negative';
    } else {
      overall = 'neutral';
    }

    // 找出主导维度
    const dimensions = {
      trust: rel.trust,
      hostility: rel.hostility,
      intimacy: rel.intimacy,
      respect: rel.respect,
      affection: rel.affection || 0,
      fear: rel.fear || 0,
      dependence: rel.dependence || 0,
    };

    const dominant = Object.entries(dimensions).sort(
      ([, a], [, b]) => b - a
    )[0][0];

    return {
      overall,
      dominant,
      tags: rel.tags || [],
    };
  }

  /**
   * 获取变更历史
   */
  getChangeHistory(
    characterId?: string,
    limit?: number
  ): RelationshipChangeRecord[] {
    let history = this.changeHistory;

    if (characterId) {
      history = history.filter(
        (record) =>
          record.sourceCharacterId === characterId ||
          record.targetCharacterId === characterId
      );
    }

    if (limit) {
      return history.slice(-limit);
    }
    return [...history];
  }

  /**
   * 清除变更历史
   */
  clearChangeHistory(): void {
    this.changeHistory = [];
  }

  /**
   * 推断事件类型
   */
  private inferEventType(
    dimension: keyof Relationship,
    oldValue: number | undefined,
    newValue: number
  ): RelationshipEventType {
    const old = oldValue || 0;
    const increased = newValue > old;

    const eventMap: Record<
      string,
      [RelationshipEventType, RelationshipEventType]
    > = {
      trust: ['trust_gain', 'trust_loss'],
      hostility: ['hostility_increase', 'hostility_decrease'],
      intimacy: ['intimacy_increase', 'intimacy_decrease'],
      respect: ['respect_gain', 'respect_loss'],
      affection: ['affection_gain', 'affection_loss'],
      fear: ['fear_increase', 'fear_decrease'],
      dependence: ['dependence_increase', 'dependence_decrease'],
    };

    const events = eventMap[dimension];
    return events ? events[increased ? 0 : 1] : 'trust_gain';
  }

  /**
   * 记录变更
   */
  private recordChange(change: RelationshipChangeRecord): void {
    this.changeHistory.push(change);
  }
}
