import apiClient from './client';

export interface AdvanceDto {
  sessionId: string;
  userInput: string;
  characterId: string;
  sceneId: string;
}

export interface AdvanceResponse {
  sessionId: string;
  turn: number;
  characterResponses: Array<{
    characterId: string;
    response: string;
  }>;
  worldState: unknown;
}

export const storyApi = {
  // 单角色推进
  advance: (data: AdvanceDto) => {
    return apiClient.post<AdvanceResponse>('/story/advance', data);
  },

  // 多角色推进
  advanceMulti: (data: {
    sessionId: string;
    userInput: string;
    characterIds: string[];
    sceneId: string;
  }) => {
    return apiClient.post<AdvanceResponse>('/story/advance-multi', data);
  },

  // 双角色推进
  advanceDual: (data: {
    sessionId: string;
    userInput: string;
    characterIds: [string, string];
    sceneId: string;
  }) => {
    return apiClient.post<AdvanceResponse>('/story/advance-dual', data);
  },
};
