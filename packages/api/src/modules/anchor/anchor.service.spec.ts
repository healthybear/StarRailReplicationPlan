import { Test, TestingModule } from '@nestjs/testing';
import { AnchorService } from './anchor.service';
import { NotFoundException } from '@nestjs/common';
import { ANCHOR_EVALUATOR } from '../../common/providers/core.provider';

describe('AnchorService', () => {
  let service: AnchorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnchorService,
        {
          provide: ANCHOR_EVALUATOR,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AnchorService>(AnchorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an anchor', async () => {
      const createDto = {
        sessionId: 'session_001',
        name: '锚点1',
        description: '测试锚点',
      };

      const result = await service.create(createDto);

      expect(result.anchorId).toBeDefined();
      expect(result.sessionId).toBe('session_001');
      expect(result.name).toBe('锚点1');
      expect(result.createdAt).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return anchors for a session', async () => {
      await service.create({
        sessionId: 'session_001',
        name: '锚点1',
      });
      await service.create({
        sessionId: 'session_001',
        name: '锚点2',
      });
      await service.create({
        sessionId: 'session_002',
        name: '锚点3',
      });

      const result = await service.findAll('session_001');
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return an anchor', async () => {
      const created = await service.create({
        sessionId: 'session_001',
        name: '锚点1',
      });

      const result = await service.findOne('session_001', created.anchorId);
      expect(result.anchorId).toBe(created.anchorId);
    });

    it('should throw NotFoundException if anchor not found', async () => {
      await expect(
        service.findOne('session_001', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an anchor', async () => {
      const created = await service.create({
        sessionId: 'session_001',
        name: '锚点1',
      });

      await service.remove('session_001', created.anchorId);

      await expect(
        service.findOne('session_001', created.anchorId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('compare', () => {
    it('should compare anchor with current state', async () => {
      const created = await service.create({
        sessionId: 'session_001',
        name: '锚点1',
      });

      const result = await service.compare({
        sessionId: 'session_001',
        anchorId: created.anchorId,
      });

      expect(result.anchorId).toBe(created.anchorId);
      expect(result.comparisonResult).toBeDefined();
      expect(result.comparisonResult.similarity).toBeGreaterThan(0);
    });
  });
});
