import { Test, TestingModule } from '@nestjs/testing';
import { AnchorController } from './anchor.controller';
import { AnchorService } from './anchor.service';
import { ANCHOR_EVALUATOR } from '../../common/providers/core.provider';

describe('AnchorController', () => {
  let controller: AnchorController;
  let service: AnchorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnchorController],
      providers: [
        AnchorService,
        {
          provide: ANCHOR_EVALUATOR,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AnchorController>(AnchorController);
    service = module.get<AnchorService>(AnchorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an anchor', async () => {
      const createDto = {
        sessionId: 'session_001',
        name: '锚点1',
      };

      const result = await controller.create(createDto);
      expect(result.sessionId).toBe('session_001');
      expect(result.name).toBe('锚点1');
    });
  });

  describe('findAll', () => {
    it('should return all anchors for a session', async () => {
      await service.create({
        sessionId: 'session_001',
        name: '锚点1',
      });

      const result = await controller.findAll('session_001');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('compare', () => {
    it('should compare anchor with current state', async () => {
      const created = await service.create({
        sessionId: 'session_001',
        name: '锚点1',
      });

      const result = await controller.compare({
        sessionId: 'session_001',
        anchorId: created.anchorId,
      });

      expect(result.comparisonResult).toBeDefined();
    });
  });
});
