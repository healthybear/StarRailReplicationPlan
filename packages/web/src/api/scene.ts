import apiClient from './client';

export interface Scene {
  sceneId: string;
  name: string;
  description: string;
  environment?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSceneDto {
  sceneId: string;
  name: string;
  description: string;
  environment?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export const sceneApi = {
  // 获取所有场景
  getAll: () => {
    return apiClient.get<Scene[]>('/scenes');
  },

  // 获取单个场景
  getById: (id: string) => {
    return apiClient.get<Scene>(`/scenes/${id}`);
  },

  // 创建场景
  create: (data: CreateSceneDto) => {
    return apiClient.post<Scene>('/scenes', data);
  },

  // 更新场景
  update: (id: string, data: Partial<CreateSceneDto>) => {
    return apiClient.put<Scene>(`/scenes/${id}`, data);
  },

  // 删除场景
  delete: (id: string) => {
    return apiClient.delete(`/scenes/${id}`);
  },
};
