import apiClient from './client';

export interface Character {
  characterId: string;
  name: string;
  personality: Record<string, unknown>;
  initialState: Record<string, unknown>;
  behaviorConfig?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCharacterDto {
  characterId: string;
  name: string;
  personality: Record<string, unknown>;
  initialState: Record<string, unknown>;
  behaviorConfig?: Record<string, unknown>;
}

export const characterApi = {
  // 获取所有人物
  getAll: () => {
    return apiClient.get<Character[]>('/characters');
  },

  // 获取单个人物
  getById: (id: string) => {
    return apiClient.get<Character>(`/characters/${id}`);
  },

  // 创建人物
  create: (data: CreateCharacterDto) => {
    return apiClient.post<Character>('/characters', data);
  },

  // 更新人物
  update: (id: string, data: Partial<CreateCharacterDto>) => {
    return apiClient.put<Character>(`/characters/${id}`, data);
  },

  // 删除人物
  delete: (id: string) => {
    return apiClient.delete(`/characters/${id}`);
  },
};
