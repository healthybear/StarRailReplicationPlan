import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000, // E2E 测试可能需要更长时间
    setupFiles: ['./src/setup.ts'], // 添加设置文件
  },
});
