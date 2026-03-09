import { Test, TestingModule } from '@nestjs/testing';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import type { SessionState, WorldState } from '@star-rail/types';

describe('SessionController', () => {
  let controller: SessionController;
  let service: SessionService;

  const mockWorldState: WorldState = {
    currentSceneId: 'scene_001',
    timeline: { currentTurn: 0, timestamp: Date.now() },
    environment: {
      physical: {},
      social: { factions: {} },
      atmosphere: { tension: 0 },
    },
    eventChain: [],
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        {
          provide: SessionService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SessionController>(SessionController);
    service = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a session', async () => {
      const createDto = {
        sessionName: 'Test Session',
        sceneId: 'scene_001',
        characterIds: ['char_001'],
      };

      const mockSession: SessionState = {
        metadata: {
          sessionId: 'session_1',
          sessionName: 'Test Session',
          createdAt: Date.now(),
          lastSaved: Date.now(),
          version: '1.0.0',
        },
        worldState: mockWorldState,
        characters: {},
        information: { global: [], byCharacter: {} },
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockSession);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockSession);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated sessions', async () => {
      const query = { page: 1, limit: 10 };
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a session', async () => {
      const mockSession: SessionState = {
        metadata: {
          sessionId: 'session_1',
          sessionName: 'Test Session',
          createdAt: Date.now(),
          lastSaved: Date.now(),
          version: '1.0.0',
        },
        worldState: mockWorldState,
        characters: {},
        information: { global: [], byCharacter: {} },
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockSession);

      const result = await controller.findOne('session_1');

      expect(result).toEqual(mockSession);
      expect(service.findOne).toHaveBeenCalledWith('session_1');
    });
  });

  describe('remove', () => {
    it('should delete a session', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove('session_1');

      expect(service.remove).toHaveBeenCalledWith('session_1');
    });
  });
});
