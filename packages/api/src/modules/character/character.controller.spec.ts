import { Test, TestingModule } from '@nestjs/testing';
import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';

describe('CharacterController', () => {
  let controller: CharacterController;
  let service: CharacterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharacterController],
      providers: [CharacterService],
    }).compile();

    controller = module.get<CharacterController>(CharacterController);
    service = module.get<CharacterService>(CharacterService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a character', async () => {
      const createDto = {
        characterId: 'char_001',
        name: '三月七',
        personality: {},
        initialState: {},
      };

      const result = await controller.create(createDto);

      expect(result.characterId).toBe('char_001');
      expect(result.name).toBe('三月七');
    });
  });

  describe('findAll', () => {
    it('should return all characters', async () => {
      const result = await controller.findAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a character', async () => {
      await service.create({
        characterId: 'char_001',
        name: '三月七',
        personality: {},
        initialState: {},
      });

      const result = await controller.findOne('char_001');
      expect(result.characterId).toBe('char_001');
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

      const result = await controller.update('char_001', {
        name: '三月七（更新）',
      });
      expect(result.name).toBe('三月七（更新）');
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

      await controller.remove('char_001');

      await expect(service.findOne('char_001')).rejects.toThrow();
    });
  });
});
