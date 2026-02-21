<script setup lang="ts">
import { ref } from 'vue';

const selectedPeriod = ref('近7天');
const periods = ['近7天', '近30天', '全部'];

// 会话统计
const sessionStats = ref({
  total: 12,
  completed: 8,
  inProgress: 4,
  avgNodes: 18,
});

// 锚点对比统计
const comparisonStats = ref({
  total: 6,
  avgDiff: 3.2,
  maxDiff: 7,
  minDiff: 1,
});

// 角色参与度
const characterParticipation = ref([
  { name: '开拓者', sessions: 12, nodes: 216, color: 'primary' },
  { name: '布洛妮娅', sessions: 5, nodes: 63, color: 'blue' },
  { name: '希儿', sessions: 4, nodes: 48, color: 'purple' },
  { name: '卡芙卡', sessions: 3, nodes: 31, color: 'red' },
  { name: '杰帕德', sessions: 3, nodes: 27, color: 'teal' },
  { name: '娜塔莎', sessions: 2, nodes: 18, color: 'green' },
]);

// 最近对比记录
const recentComparisons = ref([
  {
    id: 'cmp-001',
    anchorName: '审讯室对峙',
    sessionA: '贝洛伯格初遇（原版）',
    sessionB: '贝洛伯格初遇（变体A）',
    diffCount: 5,
    createdAt: '2026-02-18',
    summary: '卡芙卡的态度差异显著，变体A中表现更为强硬',
  },
  {
    id: 'cmp-002',
    anchorName: '地下城入口',
    sessionA: '永冬之下（主线）',
    sessionB: '永冬之下（支线）',
    diffCount: 3,
    createdAt: '2026-02-17',
    summary: '希儿的心理状态在支线中更为复杂',
  },
  {
    id: 'cmp-003',
    anchorName: '开场对话锚点',
    sessionA: '贝洛伯格初遇（原版）',
    sessionB: '贝洛伯格初遇（变体B）',
    diffCount: 2,
    createdAt: '2026-02-16',
    summary: '初始信息量差异较小，主要体现在开拓者的已知信息上',
  },
]);

// 视野隔离验证结果
const isolationResults = ref([
  { character: '开拓者', passed: true, leaks: 0 },
  { character: '布洛妮娅', passed: true, leaks: 0 },
  { character: '卡芙卡', passed: true, leaks: 0 },
  { character: '希儿', passed: true, leaks: 0 },
]);

const maxNodes = Math.max(...characterParticipation.value.map(c => c.nodes));
</script>

<template>
  <div class="bg-grey-lighten-5 min-h-screen">
    <!-- 顶部应用栏 -->
    <v-app-bar elevation="0" class="border-b">
      <v-app-bar-title>
        <div class="flex items-center gap-2">
          <v-icon color="primary">mdi-chart-bar</v-icon>
          <span class="font-bold">分析报告</span>
        </div>
      </v-app-bar-title>
      <template #append>
        <div class="d-flex gap-2 mr-4">
          <v-btn-toggle v-model="selectedPeriod" mandatory density="compact" variant="outlined">
            <v-btn v-for="p in periods" :key="p" :value="p" size="small">{{ p }}</v-btn>
          </v-btn-toggle>
          <v-btn variant="tonal" prepend-icon="mdi-download" size="small">导出报告</v-btn>
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <div class="pa-6">
        <!-- 面包屑 -->
        <v-breadcrumbs
          :items="[{ title: '首页', href: '/' }, { title: '分析' }]"
          class="pa-0 mb-6"
        />

        <!-- 核心指标 -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1">
              <v-card-text class="d-flex align-center gap-4">
                <v-avatar color="primary" variant="tonal" size="48">
                  <v-icon>mdi-chat-processing</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-bold">{{ sessionStats.total }}</div>
                  <div class="text-caption text-grey">总会话数</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1">
              <v-card-text class="d-flex align-center gap-4">
                <v-avatar color="success" variant="tonal" size="48">
                  <v-icon>mdi-check-circle</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-bold">{{ sessionStats.completed }}</div>
                  <div class="text-caption text-grey">已完成会话</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1">
              <v-card-text class="d-flex align-center gap-4">
                <v-avatar color="purple" variant="tonal" size="48">
                  <v-icon>mdi-compare</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-bold">{{ comparisonStats.total }}</div>
                  <div class="text-caption text-grey">对比分析次数</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1">
              <v-card-text class="d-flex align-center gap-4">
                <v-avatar color="orange" variant="tonal" size="48">
                  <v-icon>mdi-format-list-numbered</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-bold">{{ sessionStats.avgNodes }}</div>
                  <div class="text-caption text-grey">平均节点数</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <!-- 左列 -->
          <v-col cols="12" md="7">
            <!-- 角色参与度 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-subtitle-1 font-bold border-b pa-4">
                角色参与度
              </v-card-title>
              <v-card-text class="pa-4">
                <div
                  v-for="char in characterParticipation"
                  :key="char.name"
                  class="mb-4"
                >
                  <div class="d-flex align-center justify-space-between mb-1">
                    <div class="d-flex align-center gap-2">
                      <v-avatar :color="char.color" size="28" variant="tonal">
                        <v-icon size="14">mdi-account</v-icon>
                      </v-avatar>
                      <span class="text-body-2 font-semibold">{{ char.name }}</span>
                    </div>
                    <div class="text-caption text-grey">
                      {{ char.sessions }} 会话 · {{ char.nodes }} 节点
                    </div>
                  </div>
                  <v-progress-linear
                    :model-value="(char.nodes / maxNodes) * 100"
                    :color="char.color"
                    height="8"
                    rounded
                    bg-color="grey-lighten-3"
                  />
                </div>
              </v-card-text>
            </v-card>

            <!-- 最近对比记录 -->
            <v-card elevation="1">
              <v-card-title class="text-subtitle-1 font-bold border-b pa-4">
                最近对比记录
              </v-card-title>
              <v-list lines="three">
                <v-list-item
                  v-for="cmp in recentComparisons"
                  :key="cmp.id"
                  class="border-b"
                >
                  <template #prepend>
                    <v-avatar color="purple" variant="tonal" size="40" rounded="lg">
                      <v-icon size="20">mdi-compare</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-semibold mb-1">
                    {{ cmp.anchorName }}
                    <v-chip color="purple" size="x-small" variant="tonal" class="ml-2">
                      {{ cmp.diffCount }} 处差异
                    </v-chip>
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption mb-1">
                    {{ cmp.sessionA }} vs {{ cmp.sessionB }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle class="text-body-2 text-grey-darken-1">
                    {{ cmp.summary }}
                  </v-list-item-subtitle>
                  <template #append>
                    <span class="text-caption text-grey">{{ cmp.createdAt }}</span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>

          <!-- 右列 -->
          <v-col cols="12" md="5">
            <!-- 会话完成情况 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-subtitle-1 font-bold border-b pa-4">
                会话完成情况
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-center mb-4">
                  <div class="text-center">
                    <div class="text-h3 font-bold text-primary">
                      {{ Math.round((sessionStats.completed / sessionStats.total) * 100) }}%
                    </div>
                    <div class="text-caption text-grey">完成率</div>
                  </div>
                </div>
                <v-progress-linear
                  :model-value="(sessionStats.completed / sessionStats.total) * 100"
                  color="success"
                  height="12"
                  rounded
                  bg-color="grey-lighten-3"
                  class="mb-4"
                />
                <div class="d-flex justify-space-around">
                  <div class="text-center">
                    <div class="text-h6 font-bold text-success">{{ sessionStats.completed }}</div>
                    <div class="text-caption text-grey">已完成</div>
                  </div>
                  <v-divider vertical />
                  <div class="text-center">
                    <div class="text-h6 font-bold text-warning">{{ sessionStats.inProgress }}</div>
                    <div class="text-caption text-grey">进行中</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- 对比差异统计 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-subtitle-1 font-bold border-b pa-4">
                对比差异统计
              </v-card-title>
              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="4" class="text-center">
                    <div class="text-h5 font-bold text-purple">{{ comparisonStats.avgDiff }}</div>
                    <div class="text-caption text-grey">平均差异数</div>
                  </v-col>
                  <v-col cols="4" class="text-center">
                    <div class="text-h5 font-bold text-error">{{ comparisonStats.maxDiff }}</div>
                    <div class="text-caption text-grey">最大差异</div>
                  </v-col>
                  <v-col cols="4" class="text-center">
                    <div class="text-h5 font-bold text-success">{{ comparisonStats.minDiff }}</div>
                    <div class="text-caption text-grey">最小差异</div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- 视野隔离验证 -->
            <v-card elevation="1">
              <v-card-title class="text-subtitle-1 font-bold border-b pa-4">
                <div class="d-flex align-center gap-2">
                  视野隔离验证
                  <v-chip color="success" size="x-small" variant="tonal">全部通过</v-chip>
                </div>
              </v-card-title>
              <v-list density="compact">
                <v-list-item
                  v-for="result in isolationResults"
                  :key="result.character"
                >
                  <template #prepend>
                    <v-icon :color="result.passed ? 'success' : 'error'" size="20">
                      {{ result.passed ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                    </v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">{{ result.character }}</v-list-item-title>
                  <template #append>
                    <v-chip
                      :color="result.passed ? 'success' : 'error'"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ result.passed ? '无泄露' : `${result.leaks} 处泄露` }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-main>
  </div>
</template>
