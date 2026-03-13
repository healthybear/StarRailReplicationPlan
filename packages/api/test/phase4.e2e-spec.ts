import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Phase 4 端到端测试
 * 测试完整的用户流程：创建人物 → 创建场景 → 创建会话 → 推进剧情 → 创建快照 → 恢复快照
 */
describe('Phase 4 E2E Tests', () => {
  let app: INestApplication<App>;
  let characterId: string;
  let sceneId: string;
  let sessionId: string;
  let snapshotId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Character Management', () => {
    it('should create a character', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/characters')
        .send({
          characterId: 'test_char_001',
          name: '测试角色',
          personality: {
            traits: ['勇敢', '正直'],
            values: ['正义', '友情'],
            speechStyle: '直率',
          },
          initialState: {
            relationships: {},
            abilities: {
              combat: 80,
              intelligence: 70,
              charisma: 60,
            },
            cultivation: {},
            personality: {},
            vision: {
              knownInformation: [],
            },
          },
        })
        .expect(201);

      characterId = response.body.characterId;
      expect(characterId).toBe('test_char_001');
      expect(response.body.name).toBe('测试角色');
    });

    it('should get character list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/characters')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get character by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/characters/${characterId}`)
        .expect(200);

      expect(response.body.characterId).toBe(characterId);
      expect(response.body.name).toBe('测试角色');
    });
  });

  describe('2. Scene Management', () => {
    it('should create a scene', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/scenes')
        .send({
          sceneId: 'test_scene_001',
          name: '测试场景',
          description: '一个用于测试的场景',
          environment: {
            physical: {
              weather: '晴朗',
              temperature: 25,
              lighting: '明亮',
            },
            social: {
              crowdLevel: '稀少',
              atmosphere: '平静',
            },
          },
          tags: ['测试'],
        })
        .expect(201);

      sceneId = response.body.sceneId;
      expect(sceneId).toBe('test_scene_001');
      expect(response.body.name).toBe('测试场景');
    });

    it('should get scene list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/scenes')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get scene by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/scenes/${sceneId}`)
        .expect(200);

      expect(response.body.sceneId).toBe(sceneId);
      expect(response.body.name).toBe('测试场景');
    });
  });

  describe('3. Session Management', () => {
    it('should create a session', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/sessions')
        .send({
          sessionName: '测试会话',
          sceneId: sceneId,
          characterIds: [characterId],
        })
        .expect(201);

      sessionId = response.body.metadata.sessionId;
      expect(sessionId).toBeDefined();
      expect(response.body.metadata.sessionName).toBe('测试会话');
    });

    it('should get session list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sessions')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should get session by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(response.body.metadata.sessionId).toBe(sessionId);
      expect(response.body.metadata.sessionName).toBe('测试会话');
    });
  });

  describe('4. Story Advancement', () => {
    it('should advance story with single character', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/story/advance')
        .send({
          sessionId: sessionId,
          characterId: characterId,
          sceneId: sceneId,
          userInput: '你好，我是开拓者。',
        })
        .expect(201);

      expect(response.body.characterId).toBe(characterId);
      expect(response.body.response).toBeDefined();
      expect(typeof response.body.response).toBe('string');
    });
  });

  describe('5. Snapshot Management', () => {
    it('should create a snapshot', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/snapshots/${sessionId}`)
        .send({
          label: '测试快照',
          description: '第一个测试快照',
        })
        .expect(201);

      snapshotId = response.body.snapshotId;
      expect(snapshotId).toBeDefined();
      expect(response.body.label).toBe('测试快照');
    });

    it('should get snapshot list', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/snapshots/${sessionId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should restore a snapshot', async () => {
      await request(app.getHttpServer())
        .post(`/api/snapshots/${sessionId}/${snapshotId}/restore`)
        .send({
          strategy: 'overwrite',
        })
        .expect(200);
    });

    it('should delete a snapshot', async () => {
      await request(app.getHttpServer())
        .delete(`/api/snapshots/${sessionId}/${snapshotId}`)
        .expect(200);
    });
  });

  describe('6. Cleanup', () => {
    it('should delete session', async () => {
      await request(app.getHttpServer())
        .delete(`/api/sessions/${sessionId}`)
        .expect(204);
    });

    it('should delete character', async () => {
      await request(app.getHttpServer())
        .delete(`/api/characters/${characterId}`)
        .expect(204);
    });

    it('should delete scene', async () => {
      await request(app.getHttpServer())
        .delete(`/api/scenes/${sceneId}`)
        .expect(204);
    });
  });
});
