import { Test, TestingModule } from '@nestjs/testing';
import { CharacterService } from './character.service';
import { NotFoundException } from '@nestjs/common';

describe('CharacterService', () => {
  let service: CharacterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CharacterService],
    }).compile();

    service = module.get<CharacterService>(CharacterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a character', async () => {
      const createDto = {
        characterId: 'char_001',
        name: '三月七',
        personality: { trait: 'cheerful' },
        initialState: { hp: 100 },
      };

      const result = await service.create(createDto);

      expect(result).toMatchObject(createDto);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error if character already exists', async () => {
      const createDto = {
        characterId: 'char_001',
        name: '三月七',
        personality: { trait: 'cheerful' },
        initialState: { hp: 100 },
      };

      await service.create(createDto);

      await expect(service.create(createDto)).rejects.toThrow(
        'Character with ID char_001 already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return empty array initially', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('should return all characters', async () => {
      await service.create({
        characterId: 'char_001',
        name: '三月七',
        personality: {},
        initialState: {},
      });
      await service.create({
        characterId: 'char_002',
        name: '丹恒',
        personality: {},
        initialState: {},
      });

      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a character by id', async () => {
      const createDto = {
        characterId: 'char_001',
        name: '三月七',
        personality: {},
        initialState: {},
      };

      await service.create(createDto);
      const result = await service.findOne('char_001');

      expect(result.characterId).toBe('char_001');
      expect(result.name).toBe('三月七');
    });

    it('should throw NotFoundException if character not found', async () => {
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a character', async () => {
      await service.create({
        characterId: 'char_001',
        name: '三月七',
        personality: {},
        initialState: {},
      });

      const updateDto = { name: '三月七（更新）' };
      const result = await service.update('char_001', updateDto);

      expect(result.name).toBe('三月七（更新）');
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw NotFoundException if character not found', async () => {
      await expect(
        service.update('nonexistent', { name: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a character', async () => {
      await service.create({
        characterId: 'char_001',
        name: '三月七',
        personality: {},
        initialState: {},
      });

      await service.remove('char_001');

      await expect(service.findOne('char_001')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if character not found', async () => {
      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
