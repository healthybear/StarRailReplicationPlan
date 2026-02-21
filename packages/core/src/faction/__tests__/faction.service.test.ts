import 'reflect-metadata';
import { FactionService } from '../faction.service.js';
import type { Faction, FactionConfig, Character } from '@star-rail/types';
import { createDefaultPersonality } from '@star-rail/types';

function makeConfig(overrides?: Partial<FactionConfig>): FactionConfig {
  return {
    id: 'faction-a',
    name: '星核猎手',
    description: '追逐星核的组织',
    goals: ['收集星核'],
    initialMembers: ['char-1'],
    initialRelationships: {},
    ...overrides,
  };
}

function makeCharacter(id: string, faction?: string): Character {
  return {
    id,
    name: `角色${id}`,
    faction,
    state: { relationships: {}, abilities: {}, knownInformation: [] },
    personality: createDefaultPersonality(),
  };
}

describe('FactionService', () => {
  let service: FactionService;

  beforeEach(() => {
    service = new FactionService();
  });

  describe('createFactionFromConfig', () => {
    it('从配置创建势力并注册', () => {
      const faction = service.createFactionFromConfig(makeConfig());
      expect(faction.id).toBe('faction-a');
      expect(faction.name).toBe('星核猎手');
      expect(faction.members).toEqual(['char-1']);
      expect(service.getFaction('faction-a')).toBe(faction);
    });

    it('无 initialMembers 时 members 为空数组', () => {
      const faction = service.createFactionFromConfig(
        makeConfig({ initialMembers: undefined })
      );
      expect(faction.members).toEqual([]);
    });
  });

  describe('registerFaction / getFaction / getAllFactions', () => {
    it('registerFaction 后可通过 getFaction 获取', () => {
      const faction: Faction = {
        id: 'f1',
        name: '测试势力',
        members: [],
      };
      service.registerFaction(faction);
      expect(service.getFaction('f1')).toBe(faction);
    });

    it('getFaction 不存在时返回 undefined', () => {
      expect(service.getFaction('nonexistent')).toBeUndefined();
    });

    it('getAllFactions 返回所有已注册势力', () => {
      service.createFactionFromConfig(makeConfig({ id: 'f1', name: 'A' }));
      service.createFactionFromConfig(makeConfig({ id: 'f2', name: 'B' }));
      expect(service.getAllFactions()).toHaveLength(2);
    });
  });

  describe('addMember / removeMember / getCharacterFactions', () => {
    beforeEach(() => {
      service.createFactionFromConfig(makeConfig({ initialMembers: [] }));
    });

    it('addMember 添加成员', () => {
      service.addMember('faction-a', 'char-2');
      expect(service.getFaction('faction-a')!.members).toContain('char-2');
    });

    it('addMember 不重复添加', () => {
      service.addMember('faction-a', 'char-2');
      service.addMember('faction-a', 'char-2');
      expect(
        service.getFaction('faction-a')!.members.filter((id) => id === 'char-2')
      ).toHaveLength(1);
    });

    it('addMember 势力不存在时不报错', () => {
      expect(() => service.addMember('nonexistent', 'char-1')).not.toThrow();
    });

    it('removeMember 移除成员', () => {
      service.addMember('faction-a', 'char-2');
      service.removeMember('faction-a', 'char-2');
      expect(service.getFaction('faction-a')!.members).not.toContain('char-2');
    });

    it('getCharacterFactions 返回人物所属势力', () => {
      service.addMember('faction-a', 'char-2');
      const factions = service.getCharacterFactions('char-2');
      expect(factions).toHaveLength(1);
      expect(factions[0].id).toBe('faction-a');
    });

    it('getCharacterFactions 人物不在任何势力时返回空数组', () => {
      expect(service.getCharacterFactions('nobody')).toEqual([]);
    });
  });

  describe('syncCharacterFaction', () => {
    it('同步人物 faction 字段到势力成员列表', () => {
      service.createFactionFromConfig(makeConfig({ initialMembers: [] }));
      const char = makeCharacter('char-x', 'faction-a');
      service.syncCharacterFaction(char);
      expect(service.getFaction('faction-a')!.members).toContain('char-x');
    });

    it('faction 字段为空时不操作', () => {
      service.createFactionFromConfig(makeConfig({ initialMembers: [] }));
      const char = makeCharacter('char-x');
      service.syncCharacterFaction(char);
      expect(service.getFaction('faction-a')!.members).toHaveLength(0);
    });

    it('势力不存在时不报错', () => {
      const char = makeCharacter('char-x', 'nonexistent');
      expect(() => service.syncCharacterFaction(char)).not.toThrow();
    });
  });

  describe('getFactionRelationship / updateFactionRelationship', () => {
    beforeEach(() => {
      service.createFactionFromConfig(
        makeConfig({ id: 'f1', name: 'A', initialMembers: [] })
      );
      service.createFactionFromConfig(
        makeConfig({ id: 'f2', name: 'B', initialMembers: [] })
      );
    });

    it('不存在关系时返回默认关系（attitude=0）', () => {
      const rel = service.getFactionRelationship('f1', 'f2');
      expect(rel.attitude).toBe(0);
    });

    it('updateFactionRelationship 更新态度', () => {
      service.updateFactionRelationship('f1', 'f2', { attitude: 0.8 });
      expect(service.getFactionRelationship('f1', 'f2').attitude).toBe(0.8);
    });

    it('态度被限制在 [-1, 1]', () => {
      service.updateFactionRelationship('f1', 'f2', { attitude: 2 });
      expect(service.getFactionRelationship('f1', 'f2').attitude).toBe(1);
      service.updateFactionRelationship('f1', 'f2', { attitude: -2 });
      expect(service.getFactionRelationship('f1', 'f2').attitude).toBe(-1);
    });

    it('updateFactionRelationship 设置结盟', () => {
      service.updateFactionRelationship('f1', 'f2', { alliance: true });
      expect(service.getFactionRelationship('f1', 'f2').alliance).toBe(true);
    });

    it('势力不存在时不报错', () => {
      expect(() =>
        service.updateFactionRelationship('nonexistent', 'f2', {
          attitude: 0.5,
        })
      ).not.toThrow();
    });
  });

  describe('getAllies / getEnemies', () => {
    beforeEach(() => {
      service.createFactionFromConfig(
        makeConfig({ id: 'f1', name: 'A', initialMembers: [] })
      );
      service.createFactionFromConfig(
        makeConfig({ id: 'f2', name: 'B', initialMembers: [] })
      );
      service.createFactionFromConfig(
        makeConfig({ id: 'f3', name: 'C', initialMembers: [] })
      );
    });

    it('getAllies 返回结盟势力', () => {
      service.updateFactionRelationship('f1', 'f2', {
        alliance: true,
        attitude: 0.9,
      });
      service.updateFactionRelationship('f1', 'f3', {
        alliance: false,
        attitude: 0.5,
      });
      const allies = service.getAllies('f1');
      expect(allies).toHaveLength(1);
      expect(allies[0].id).toBe('f2');
    });

    it('getEnemies 返回态度 < -0.5 的势力', () => {
      service.updateFactionRelationship('f1', 'f2', { attitude: -0.8 });
      service.updateFactionRelationship('f1', 'f3', { attitude: -0.3 });
      const enemies = service.getEnemies('f1');
      expect(enemies).toHaveLength(1);
      expect(enemies[0].id).toBe('f2');
    });

    it('势力无关系时返回空数组', () => {
      expect(service.getAllies('f1')).toEqual([]);
      expect(service.getEnemies('f1')).toEqual([]);
    });
  });

  describe('clear', () => {
    it('清除所有势力数据', () => {
      service.createFactionFromConfig(makeConfig());
      service.clear();
      expect(service.getAllFactions()).toHaveLength(0);
    });
  });
});
