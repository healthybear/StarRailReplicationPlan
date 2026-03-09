import apiClient from './client';

export interface Session {
  sessionId: string;
  sessionName: string;
  sceneId: string;
  characterIds: string[];
  worldState: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDto {
  sessionName: string;
  sceneId: string;
  characterIds: string[];
}

export const sessionApi = {
  // 获取所有会话
  getAll: (params?: { page?: number; limit?: number }) => {
    return apiClient.get<{
      data: Session[];
      total: number;
      page: number;
      limit: number;
    }>('/sessions', { params });
  },

  // 获取单个会话
  getById: (id: string) => {
    return apiClient.get<Session>(`/sessions/${id}`);
  },

  // 创建会话
  create: (data: CreateSessionDto) => {
    return apiClient.post<Session>('/sessions', data);
  },

  // 删除会话
  delete: (id: string) => {
    return apiClient.delete(`/sessions/${id}`);
  },
};
