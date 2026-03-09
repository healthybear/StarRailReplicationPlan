import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SessionService } from './session.service';
import { STORY_ORCHESTRATOR } from '../../common/providers/core.provider';
import type { SessionState, WorldState } from '@star-rail/types';

describe('SessionService', () => {
  let service: SessionService;
  let mockStoryOrchestrator: {
    initializeSession: jest.Mock;
    saveSession: jest.Mock;
    listSessions: jest.Mock;
    loadSession: jest.Mock;
    deleteSession: jest.Mock;
  };

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
    mockStoryOrchestrator = {
      initializeSession: jest.fn(),
      saveSession: jest.fn(),
      listSessions: jest.fn(),
      loadSession: jest.fn(),
      deleteSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: STORY_ORCHESTRATOR,
          useValue: mockStoryOrchestrator,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const createDto = {
        sessionName: 'Test Session',
        sceneId: 'scene_001',
        characterIds: ['char_001'],
      };

      mockStoryOrchestrator.initializeSession.mockResolvedValue(undefined);
      mockStoryOrchestrator.saveSession.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.metadata.sessionName).toBe('Test Session');
      expect(result.worldState.currentSceneId).toBe('scene_001');
      expect(mockStoryOrchestrator.initializeSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            sessionName: 'Test Session',
          }),
        }),
      );
      expect(mockStoryOrchestrator.saveSession).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated session list', async () => {
      const mockSession1: SessionState = {
        metadata: {
          sessionId: 'session_1',
          sessionName: 'Session 1',
          createdAt: Date.now(),
          lastSaved: Date.now(),
          version: '1.0.0',
        },
        worldState: mockWorldState,
        characters: {},
        information: { global: [], byCharacter: {} },
      };

      const mockSession2: SessionState = {
        metadata: {
          sessionId: 'session_2',
          sessionName: 'Session 2',
          createdAt: Date.now(),
          lastSaved: Date.now(),
          version: '1.0.0',
        },
        worldState: mockWorldState,
        characters: {},
        information: { global: [], byCharacter: {} },
      };

      mockStoryOrchestrator.listSessions.mockResolvedValue([
        'session_1',
        'session_2',
      ]);
      mockStoryOrchestrator.loadSession
        .mockResolvedValueOnce(mockSession1)
        .mockResolvedValueOnce(mockSession2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter sessions by search query', async () => {
      const mockSession1: SessionState = {
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

      const mockSession2: SessionState = {
        metadata: {
          sessionId: 'session_2',
          sessionName: 'Another Session',
          createdAt: Date.now(),
          lastSaved: Date.now(),
          version: '1.0.0',
        },
        worldState: mockWorldState,
        characters: {},
        information: { global: [], byCharacter: {} },
      };

      mockStoryOrchestrator.listSessions.mockResolvedValue([
        'session_1',
        'session_2',
      ]);
      mockStoryOrchestrator.loadSession
        .mockResolvedValueOnce(mockSession1)
        .mockResolvedValueOnce(mockSession2);

      const result = await service.findAll({ search: 'Test' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].metadata.sessionName).toBe('Test Session');
    });
  });

  describe('findOne', () => {
    it('should return a session by id', async () => {
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

      mockStoryOrchestrator.loadSession.mockResolvedValue(mockSession);

      const result = await service.findOne('session_1');

      expect(result).toEqual(mockSession);
      expect(mockStoryOrchestrator.loadSession).toHaveBeenCalledWith(
        'session_1',
      );
    });

    it('should throw NotFoundException if session not found', async () => {
      mockStoryOrchestrator.loadSession.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a session', async () => {
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

      mockStoryOrchestrator.loadSession.mockResolvedValue(mockSession);
      mockStoryOrchestrator.deleteSession.mockResolvedValue(undefined);

      await service.remove('session_1');

      expect(mockStoryOrchestrator.deleteSession).toHaveBeenCalledWith(
        'session_1',
      );
    });

    it('should throw NotFoundException if session not found', async () => {
      mockStoryOrchestrator.loadSession.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
