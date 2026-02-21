<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AbilityRadarChart from '@/components/AbilityRadarChart.vue';
import CharacterRelationshipGraph from '@/components/CharacterRelationshipGraph.vue';
import VisionTimeline from '@/components/VisionTimeline.vue';
import DimensionComparisonView from '@/components/DimensionComparisonView.vue';

const route = useRoute();
const router = useRouter();
const sessionId = computed(() => route.params.sessionId as string);

const activeTab = ref('abilities');

// ── 模拟数据 ──────────────────────────────────────────────────────────────────

const characters = ref([
  { id: 'trailblazer', name: '开拓者', color: '#6366f1', isMain: true },
  { id: 'kafka', name: '卡芙卡', color: '#a855f7' },
  { id: 'silverwolf', name: '银狼', color: '#14b8a6' },
  { id: 'march7', name: '三月七', color: '#ec4899' },
]);

const selectedCharacterId = ref('trailblazer');

const selectedCharacter = computed(
  () => characters.value.find(c => c.id === selectedCharacterId.value) ?? characters.value[0]!
);

// 各角色能力数据
const abilitiesMap: Record<string, { name: string; value: number; originalValue: number }[]> = {
  trailblazer: [
    { name: '战斗', value: 72, originalValue: 70 },
    { name: '社交', value: 65, originalValue: 60 },
    { name: '调查', value: 58, originalValue: 55 },
    { name: '摄影', value: 40, originalValue: 40 },
    { name: '生存', value: 80, originalValue: 75 },
    { name: '感知', value: 68, originalValue: 65 },
  ],
  kafka: [
    { name: '战斗', value: 90, originalValue: 92 },
    { name: '社交', value: 85, originalValue: 88 },
    { name: '调查', value: 78, originalValue: 80 },
    { name: '摄影', value: 30, originalValue: 30 },
    { name: '生存', value: 95, originalValue: 95 },
    { name: '感知', value: 88, originalValue: 90 },
  ],
  silverwolf: [
    { name: '战斗', value: 75, originalValue: 75 },
    { name: '社交', value: 60, originalValue: 62 },
    { name: '调查', value: 95, originalValue: 95 },
    { name: '摄影', value: 50, originalValue: 50 },
    { name: '生存', value: 70, originalValue: 70 },
    { name: '感知', value: 92, originalValue: 92 },
  ],
  march7: [
    { name: '战斗', value: 68, originalValue: 65 },
    { name: '社交', value: 90, originalValue: 88 },
    { name: '调查', value: 55, originalValue: 55 },
    { name: '摄影', value: 95, originalValue: 95 },
    { name: '生存', value: 60, originalValue: 60 },
    { name: '感知', value: 72, originalValue: 70 },
  ],
};

const currentAbilities = computed(
  () => abilitiesMap[selectedCharacterId.value] ?? abilitiesMap['trailblazer']
);

// 关系图数据
const relationships = ref([
  { sourceId: 'trailblazer', targetId: 'kafka', trust: -0.3, label: '警惕' },
  { sourceId: 'trailblazer', targetId: 'silverwolf', trust: -0.1, label: '陌生' },
  { sourceId: 'trailblazer', targetId: 'march7', trust: 0.9, label: '信任' },
  { sourceId: 'kafka', targetId: 'silverwolf', trust: 0.7, label: '协作' },
]);

// 视野时间线数据
const visionEvents = ref([
  {
    id: 'e1',
    timestamp: '节点 #1',
    characterId: 'trailblazer',
    characterName: '开拓者',
    characterColor: 'indigo',
    infoId: 'info-001',
    infoTitle: '卡芙卡的真实身份',
    infoType: 'acquired' as const,
    description: '通过对话获取：卡芙卡是星核猎手成员',
  },
  {
    id: 'e2',
    timestamp: '节点 #2',
    characterId: 'kafka',
    characterName: '卡芙卡',
    characterColor: 'purple',
    infoId: 'info-002',
    infoTitle: '开拓者的星核信息',
    infoType: 'lost' as const,
    description: '未能获取：开拓者成功隐藏了星核位置',
  },
  {
    id: 'e3',
    timestamp: '节点 #3',
    characterId: 'march7',
    characterName: '三月七',
    characterColor: 'pink',
    infoId: 'info-003',
    infoTitle: '银狼的黑客能力',
    infoType: 'acquired' as const,
    description: '通过观察获取：银狼能入侵任何系统',
  },
  {
    id: 'e4',
    timestamp: '节点 #4',
    characterId: 'trailblazer',
    characterName: '开拓者',
    characterColor: 'indigo',
    infoId: 'info-004',
    infoTitle: '星穹列车的目的地',
    infoType: 'updated' as const,
    description: '信息更新：目的地从「雅利洛-VI」变更为「仙舟罗浮」',
  },
  {
    id: 'e5',
    timestamp: '节点 #5',
    characterId: 'silverwolf',
    characterName: '银狼',
    characterColor: 'teal',
    infoId: 'info-005',
    infoTitle: '卡芙卡与开拓者的关系',
    infoType: 'acquired' as const,
    description: '通过监控获取：卡芙卡对开拓者的态度出现变化',
  },
]);

// 加权对比数据
const weightedResults = ref([
  {
    anchorId: 'anchor-001',
    anchorName: '开场对话锚点',
    fitScore: 0.85,
    overallDivergence: 0.15,
    overallAssessment: '当前剧情与原剧情高度贴合，信息积累略有差异但不影响主线走向。',
    dimensionScores: [
      { name: '视野', weight: 1.0, rawDivergence: 0.1, weightedScore: 0.9 },
      { name: '关系', weight: 1.5, rawDivergence: 0.2, weightedScore: 0.8 },
      { name: '判断', weight: 2.0, rawDivergence: 0.05, weightedScore: 0.95 },
    ],
    differences: ['开拓者已知信息增加：卡芙卡的真实身份（原剧情此时未知）'],
  },
  {
    anchorId: 'anchor-002',
    anchorName: '星核猎手遭遇战',
    fitScore: 0.62,
    overallDivergence: 0.38,
    overallAssessment: '卡芙卡的判断与原剧情存在中等程度偏差，关系维度差异显著。',
    dimensionScores: [
      { name: '视野', weight: 1.0, rawDivergence: 0.3, weightedScore: 0.7 },
      { name: '关系', weight: 1.5, rawDivergence: 0.4, weightedScore: 0.6 },
      { name: '判断', weight: 2.0, rawDivergence: 0.5, weightedScore: 0.5 },
    ],
    differences: [
      '卡芙卡判断变化：「开拓者是关键目标」→「开拓者价值存疑」',
      '与银狼的协作关系出现裂痕',
      '未能获取开拓者的星核信息',
    ],
  },
]);

const goBack = () => {
  router.push({ name: 'StoryAdvance', params: { sessionId: sessionId.value } });
};
</script>

<template>
  <div class="bg-grey-lighten-5 min-h-screen">
    <v-app-bar elevation="0" class="border-b">
      <template #prepend>
        <v-btn icon @click="goBack">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </template>
      <v-app-bar-title>
        <div class="d-flex align-center gap-2">
          <v-icon color="indigo">mdi-chart-bubble</v-icon>
          <span class="font-bold">状态可视化</span>
          <v-chip size="x-small" variant="tonal" color="grey" class="ml-1">
            会话 {{ sessionId }}
          </v-chip>
        </div>
      </v-app-bar-title>
    </v-app-bar>

    <v-main>
      <div class="pa-6 max-w-7xl mx-auto">
        <v-breadcrumbs
          :items="[
            { title: '首页', href: '/' },
            { title: '会话', href: '/sessions' },
            { title: sessionId, href: `/session/${sessionId}` },
            { title: '状态可视化' },
          ]"
          class="pa-0 mb-6"
        />

        <!-- 标签页 -->
        <v-tabs v-model="activeTab" color="indigo" class="mb-6">
          <v-tab value="abilities">
            <v-icon start>mdi-radar</v-icon>
            能力雷达图
          </v-tab>
          <v-tab value="relationships">
            <v-icon start>mdi-graph</v-icon>
            人物关系图
          </v-tab>
          <v-tab value="vision">
            <v-icon start>mdi-timeline</v-icon>
            视野时间线
          </v-tab>
          <v-tab value="comparison">
            <v-icon start>mdi-scale-balance</v-icon>
            分维度对比
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab">
          <!-- 能力雷达图 -->
          <v-tabs-window-item value="abilities">
            <v-row>
              <!-- 角色选择 -->
              <v-col cols="12" md="3">
                <div class="text-subtitle-2 font-semibold text-grey-darken-2 mb-3">选择角色</div>
                <div class="d-flex flex-column gap-2">
                  <v-card
                    v-for="char in characters"
                    :key="char.id"
                    elevation="1"
                    :class="selectedCharacterId === char.id ? 'border-2' : ''"
                    :style="selectedCharacterId === char.id ? `border-color: ${char.color}` : ''"
                    class="cursor-pointer"
                    @click="selectedCharacterId = char.id"
                  >
                    <v-card-text class="pa-3 d-flex align-center gap-3">
                      <v-avatar :color="char.color" variant="tonal" size="36">
                        <v-icon size="18">mdi-account</v-icon>
                      </v-avatar>
                      <div>
                        <div class="text-subtitle-2 font-bold">{{ char.name }}</div>
                        <div v-if="char.isMain" class="text-caption text-grey">主角</div>
                      </div>
                      <v-icon v-if="selectedCharacterId === char.id" class="ml-auto" :color="char.color" size="16">
                        mdi-check-circle
                      </v-icon>
                    </v-card-text>
                  </v-card>
                </div>
              </v-col>

              <!-- 雷达图 -->
              <v-col cols="12" md="9">
                <v-card elevation="1">
                  <v-card-text class="pa-6">
                    <div class="d-flex align-center gap-2 mb-4">
                      <v-avatar :color="selectedCharacter.color" variant="tonal" size="32">
                        <v-icon size="16">mdi-account</v-icon>
                      </v-avatar>
                      <span class="text-subtitle-1 font-bold">{{ selectedCharacter.name }} 能力分布</span>
                      <v-chip size="x-small" variant="tonal" color="grey" class="ml-auto">
                        与原剧情对比
                      </v-chip>
                    </div>

                    <div class="d-flex justify-center">
                      <AbilityRadarChart
                        :abilities="currentAbilities"
                        :size="320"
                        :color="selectedCharacter.color"
                        :show-original="true"
                      />
                    </div>

                    <!-- 能力数值表格 -->
                    <v-divider class="my-4" />
                    <div class="text-caption font-semibold text-grey-darken-2 mb-3">能力数值明细</div>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th>能力</th>
                          <th>当前值</th>
                          <th>原剧情值</th>
                          <th>差异</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="ab in currentAbilities" :key="ab.name">
                          <td>{{ ab.name }}</td>
                          <td>
                            <span class="font-bold" :style="{ color: selectedCharacter.color }">
                              {{ ab.value }}
                            </span>
                          </td>
                          <td class="text-grey">{{ ab.originalValue }}</td>
                          <td>
                            <v-chip
                              size="x-small"
                              :color="ab.value > ab.originalValue ? 'success' : ab.value < ab.originalValue ? 'error' : 'grey'"
                              variant="tonal"
                            >
                              {{ ab.value > ab.originalValue ? '+' : '' }}{{ ab.value - ab.originalValue }}
                            </v-chip>
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-tabs-window-item>

          <!-- 人物关系图 -->
          <v-tabs-window-item value="relationships">
            <v-card elevation="1">
              <v-card-text class="pa-6">
                <div class="d-flex align-center gap-2 mb-4">
                  <v-icon color="indigo">mdi-graph-outline</v-icon>
                  <span class="text-subtitle-1 font-bold">人物关系网络</span>
                </div>

                <div class="d-flex justify-center overflow-x-auto">
                  <CharacterRelationshipGraph
                    :characters="characters"
                    :relationships="relationships"
                    :width="560"
                    :height="360"
                  />
                </div>

                <!-- 图例 -->
                <v-divider class="my-4" />
                <div class="d-flex flex-wrap gap-4 justify-center">
                  <div class="d-flex align-center gap-2">
                    <div style="width:24px;height:3px;background:#22c55e;border-radius:2px" />
                    <span class="text-caption text-grey-darken-1">高度信任（&gt;0.5）</span>
                  </div>
                  <div class="d-flex align-center gap-2">
                    <div style="width:24px;height:3px;background:#86efac;border-radius:2px" />
                    <span class="text-caption text-grey-darken-1">一般信任（0~0.5）</span>
                  </div>
                  <div class="d-flex align-center gap-2">
                    <div style="width:24px;height:3px;background:#fbbf24;border-radius:2px" />
                    <span class="text-caption text-grey-darken-1">中立（-0.3~0）</span>
                  </div>
                  <div class="d-flex align-center gap-2">
                    <div style="width:24px;height:2px;background:#ef4444;border-radius:2px;border-top:2px dashed #ef4444" />
                    <span class="text-caption text-grey-darken-1">敌对（&lt;-0.3）</span>
                  </div>
                </div>

                <!-- 关系列表 -->
                <v-divider class="my-4" />
                <div class="text-caption font-semibold text-grey-darken-2 mb-3">关系明细</div>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>角色 A</th>
                      <th>角色 B</th>
                      <th>关系标签</th>
                      <th>信任度</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="rel in relationships" :key="`${rel.sourceId}-${rel.targetId}`">
                      <td>{{ characters.find(c => c.id === rel.sourceId)?.name }}</td>
                      <td>{{ characters.find(c => c.id === rel.targetId)?.name }}</td>
                      <td>{{ rel.label }}</td>
                      <td>
                        <v-chip
                          size="x-small"
                          :color="rel.trust > 0.5 ? 'success' : rel.trust > 0 ? 'warning' : 'error'"
                          variant="tonal"
                        >
                          {{ rel.trust > 0 ? '+' : '' }}{{ rel.trust.toFixed(2) }}
                        </v-chip>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <!-- 视野时间线 -->
          <v-tabs-window-item value="vision">
            <v-card elevation="1">
              <v-card-text class="pa-6">
                <div class="d-flex align-center gap-2 mb-4">
                  <v-icon color="indigo">mdi-timeline-text</v-icon>
                  <span class="text-subtitle-1 font-bold">视野变化时间线</span>
                  <v-chip size="x-small" variant="tonal" color="grey" class="ml-auto">
                    {{ visionEvents.length }} 条记录
                  </v-chip>
                </div>
                <VisionTimeline :events="visionEvents" :max-items="10" />
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <!-- 分维度对比 -->
          <v-tabs-window-item value="comparison">
            <div class="d-flex align-center gap-2 mb-4">
              <v-icon color="indigo">mdi-scale-balance</v-icon>
              <span class="text-subtitle-1 font-bold">加权分维度对比报告</span>
              <v-chip size="x-small" variant="tonal" color="indigo" class="ml-auto">
                P3-AE-02 加权评分
              </v-chip>
            </div>
            <DimensionComparisonView :results="weightedResults" />
          </v-tabs-window-item>
        </v-tabs-window>
      </div>
    </v-main>
  </div>
</template>
