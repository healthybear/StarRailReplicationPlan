import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { STORY_ORCHESTRATOR } from '../../common/providers/core.provider';
import type { StoryOrchestrator } from '@star-rail/core';
import type { SessionState } from '@star-rail/types';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionListQueryDto } from './dto/session-query.dto';

@Injectable()
export class SessionService {
  constructor(
    @Inject(STORY_ORCHESTRATOR)
    private readonly storyOrchestrator: StoryOrchestrator,
  ) {}

  /**
   * 创建新会话
   */
  async create(createSessionDto: CreateSessionDto): Promise<SessionState> {
    const { sessionName, sceneId } = createSessionDto;

    // 创建会话状态
    const session: SessionState = {
      worldState: {
        currentSceneId: sceneId,
        timeline: {
          currentTurn: 0,
          timestamp: Date.now(),
        },
        environment: {
          physical: {
            weather: 'sunny',
            temperature: 20,
            lighting: 'bright',
            timeOfDay: 'noon',
            sceneCondition: {
              accessible: true,
              damaged: false,
              crowded: false,
            },
          },
          social: {
            factions: {},
          },
          atmosphere: {
            tension: 0,
            mood: 'neutral',
          },
        },
        eventChain: [],
      },
      characters: {},
      information: {
        global: [],
        byCharacter: {},
      },
      metadata: {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionName,
        createdAt: Date.now(),
        lastSaved: Date.now(),
        version: '1.0.0',
      },
    };

    // 初始化会话
    this.storyOrchestrator.initializeSession(session);

    // 保存会话
    await this.storyOrchestrator.saveSession(session);

    return session;
  }

  /**
   * 获取会话列表
   */
  async findAll(query: SessionListQueryDto) {
    const sessionIds = await this.storyOrchestrator.listSessions();

    // 加载所有会话的完整数据
    const sessions = await Promise.all(
      sessionIds.map((id) => this.storyOrchestrator.loadSession(id)),
    );

    // 过滤掉加载失败的会话
    const validSessions = sessions.filter((s): s is SessionState => s !== null);

    // 简单的搜索过滤
    let filtered = validSessions;
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filtered = validSessions.filter((s) =>
        s.metadata.sessionName.toLowerCase().includes(searchLower),
      );
    }

    // 分页
    const total = filtered.length;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = filtered.slice(start, end);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取会话详情
   */
  async findOne(sessionId: string): Promise<SessionState> {
    const session = await this.storyOrchestrator.loadSession(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    return session;
  }

  /**
   * 删除会话
   */
  async remove(sessionId: string): Promise<void> {
    const session = await this.storyOrchestrator.loadSession(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    await this.storyOrchestrator.deleteSession(sessionId);
  }
}
