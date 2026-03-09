// Mock for @star-rail/core
export const initializeContainer = jest.fn();
export const getContainer = jest.fn();

export interface SimpleLLMConfig {
  provider: string;
  model: string;
  baseURL?: string;
}
