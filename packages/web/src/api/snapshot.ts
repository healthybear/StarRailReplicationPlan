import apiClient from './client';

export interface Snapshot {
  snapshotId: string;
  sessionId: string;
  name: string;
  description?: string;
  worldState: unknown;
  createdAt: string;
}

export interface CreateSnapshotDto {
  name: string;
  description?: string;
}

export const snapshotApi = {
  // 获取会话的所有快照
  getAll: (sessionId: string) => {
    return apiClient.get<Snapshot[]>(`/snapshots/${sessionId}`);
  },

  // 创建快照
  create: (sessionId: string, data: CreateSnapshotDto) => {
    return apiClient.post<Snapshot>(`/snapshots/${sessionId}`, data);
  },

  // 恢复快照
  restore: (sessionId: string, snapshotId: string) => {
    return apiClient.post<{ message: string }>(
      `/snapshots/${sessionId}/${snapshotId}/restore`
    );
  },

  // 删除快照
  delete: (sessionId: string, snapshotId: string) => {
    return apiClient.delete(`/snapshots/${sessionId}/${snapshotId}`);
  },
};
