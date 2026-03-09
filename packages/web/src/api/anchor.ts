import apiClient from './client';

export interface Anchor {
  anchorId: string;
  sessionId: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateAnchorDto {
  sessionId: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ComparisonResult {
  anchorId: string;
  sessionId: string;
  comparisonResult: {
    summary: string;
    differences: Array<{
      dimension: string;
      anchorValue: unknown;
      currentValue: unknown;
      description: string;
    }>;
    similarity: number;
  };
  comparedAt: string;
}

export const anchorApi = {
  // 获取会话的所有锚点
  getAll: (sessionId: string) => {
    return apiClient.get<Anchor[]>(`/anchors/${sessionId}`);
  },

  // 获取单个锚点
  getById: (sessionId: string, anchorId: string) => {
    return apiClient.get<Anchor>(`/anchors/${sessionId}/${anchorId}`);
  },

  // 创建锚点
  create: (data: CreateAnchorDto) => {
    return apiClient.post<Anchor>('/anchors', data);
  },

  // 删除锚点
  delete: (sessionId: string, anchorId: string) => {
    return apiClient.delete(`/anchors/${sessionId}/${anchorId}`);
  },

  // 对比锚点
  compare: (sessionId: string, anchorId: string) => {
    return apiClient.post<ComparisonResult>('/anchors/compare', {
      sessionId,
      anchorId,
    });
  },
};
