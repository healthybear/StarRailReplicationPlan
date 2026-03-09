import 'reflect-metadata';
import { FactionService } from '../faction.service.js';
import type { Faction, FactionConfig } from '@star-rail/types';

describe('FactionService', () => {
  let service: FactionService;

  beforeEach(() => {
    service = new FactionService();
  });

  describe('registerFaction', () => {
    it('should register a faction', () => {
      const faction: Faction = {
        id: 'faction_test',
        name: 'Test Faction',
        members: [],
      };

      service.registerFaction(faction);
      const retrieved = service.getFaction('faction_test');

      expect(retrieved).toEqual(faction);
    });
  });

  describe('loadFactionConfig', () => {
    it('should load faction from config', () => {
      const config: FactionConfig = {
        id: 'faction_stellaron_hunters',
        name: '星核猎手',
        description: '追寻星核的神秘组织',
        goals: ['寻找星核', '改变命运'],
        initialMembers: ['character_kafka', 'character_blade'],
        initialRelationships: {
          faction_astral_express: {
            attitude: -0.2,
            alliance: false,
          },
        },
        tags: ['mysterious', 'powerful'],
      };

      service.loadFactionConfig(config);
      const faction = service.getFaction('faction_stellaron_hunters');

      expect(faction).toBeDefined();
      expect(faction?.name).toBe('星核猎手');
      expect(faction?.members).toEqual(['character_kafka', 'character_blade']);
      expect(faction?.relationships?.faction_astral_express.attitude).toBe(
        -0.2
      );
    });
  });

  describe('member management', () => {
    beforeEach(() => {
      service.registerFaction({
        id: 'faction_test',
        name: 'Test Faction',
        members: ['character_a'],
      });
    });

    it('should add member to faction', () => {
      const result = service.addMember('faction_test', 'character_b');

      expect(result).toBe(true);
      const faction = service.getFaction('faction_test');
      expect(faction?.members).toContain('character_b');
    });

    it('should not add duplicate member', () => {
      service.addMember('faction_test', 'character_a');
      const faction = service.getFaction('faction_test');

      expect(faction?.members.filter((m) => m === 'character_a').length).toBe(
        1
      );
    });

    it('should remove member from faction', () => {
      const result = service.removeMember('faction_test', 'character_a');

      expect(result).toBe(true);
      const faction = service.getFaction('faction_test');
      expect(faction?.members).not.toContain('character_a');
    });

    it('should get character faction', () => {
      const faction = service.getCharacterFaction('character_a');

      expect(faction).toBeDefined();
      expect(faction?.id).toBe('faction_test');
    });
  });

  describe('faction relationships', () => {
    beforeEach(() => {
      service.registerFaction({
        id: 'faction_a',
        name: 'Faction A',
        members: [],
      });
      service.registerFaction({
        id: 'faction_b',
        name: 'Faction B',
        members: [],
      });
    });

    it('should update faction relationship', () => {
      service.updateFactionRelationship('faction_a', 'faction_b', {
        attitude: 0.8,
        alliance: true,
      });

      const rel = service.getFactionRelationship('faction_a', 'faction_b');
      expect(rel.attitude).toBe(0.8);
      expect(rel.alliance).toBe(true);
    });

    it('should check if factions are allies', () => {
      service.updateFactionRelationship('faction_a', 'faction_b', {
        attitude: 0.5,
        alliance: true,
      });

      const areAllies = service.areAllies('faction_a', 'faction_b');
      expect(areAllies).toBe(true);
    });

    it('should check if factions are hostile', () => {
      service.updateFactionRelationship('faction_a', 'faction_b', {
        attitude: -0.8,
      });

      const areHostile = service.areHostile('faction_a', 'faction_b');
      expect(areHostile).toBe(true);
    });
  });
});
