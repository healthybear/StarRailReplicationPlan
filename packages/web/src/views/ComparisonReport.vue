<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const sessionId = computed(() => route.params.sessionId as string);

interface DimensionResult {
  name: string;
  divergence: number;
  differences: string[];
}

interface CharacterReport {
  characterId: string;
  characterName: string;
  color: string;
  overallDivergence: number;
  dimensions: DimensionResult[];
  summary: string;
}

const anchorInfo = ref({
  id: 'anchor-001',
  name: '开场对话锚点',
  nodeIndex: 3,
  createdAt: '2026-02-18 14:32',
});

const reports = ref<CharacterReport[]>([
  {
    characterId: 'char-trailblazer',
    characterName: '开拓者',
    color: 'primary',
    overallDivergence: 0.15,
    dimensions: [
      { name: '视野', divergence: 0.1, differences: ['已知信息增加：卡芙卡的真实身份'] },
      { name: '关系', divergence: 0.2, differences: ['与卡芙卡的关系从「陌生」变为「警惕」'] },
      { name: '判断', divergence: 0.0, differences: [] },
    ],
    summary: '开拓者状态与原剧情基本一致，信息积累略有差异。',
  },
  {
    characterId: 'char-kafka',
    characterName: '卡芙卡',
    color: 'purple',
    overallDivergence: 0.45,
    dimensions: [
      { name: '视野', divergence: 0.3, differences: ['已知信息减少：未获取开拓者的星核信息'] },
      { name: '关系', divergence: 0.4, differences: ['与银狼的协作关系出现裂痕'] },
      { name: '判断', divergence: 0.5, differences: ['卡芙卡的判断与原剧情不同：原为「开拓者是关键目标」，当前为「开拓者价值存疑」'] },
    ],
    summary: '卡芙卡状态与原剧情存在中等程度偏差，判断维度差异显著。',
  },
  {
    characterId: 'char-silverwolf',
    characterName: '银狼',
    color: 'teal',
    overallDivergence: 0.08,
    dimensions: [
      { name: '视野', divergence: 0.05, differences: [] },
      { name: '关系', divergence: 0.1, differences: [] },
      { name: '判断', divergence: 0.0, differences: [] },
    ],
    summary: '银狼状态与原剧情高度一致，偏差极小。',
  },
]);

const overallDivergence = computed(() => {
  if (reports.value.length === 0) return 0;
  return reports.value.reduce((sum, r) => sum + r.overallDivergence, 0) / reports.value.length;
});

const divergenceColor = (val: number) => {
  if (val < 0.2) return 'success';
  if (val < 0.5) return 'warning';
  return 'error';
};

const divergenceLabel = (val: number) => {
  if (val < 0.2) return '高度一致';
  if (val < 0.5) return '中等偏差';
  return '显著偏差';
};

const selectedCharacter = ref<string | null>(null);

const selectedReport = computed(() =>
  selectedCharacter.value
    ? reports.value.find(r => r.characterId === selectedCharacter.value) ?? null
    : null
);

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
        <div class="flex items-center gap-2">
          <v-icon color="purple">mdi-compare</v-icon>
          <span class="font-bold">对比报告</span>
          <v-chip size="x-small" variant="tonal" color="grey" class="ml-1">
            锚点：{{ anchorInfo.name }}
          </v-chip>
        </div>
      </v-app-bar-title>
    </v-app-bar>

    <v-main>
      <div class="pa-6 max-w-6xl mx-auto">
        <v-breadcrumbs
          :items="[
            { title: '首页', href: '/' },
            { title: '会话', href: '/sessions' },
            { title: sessionId, href: `/session/${sessionId}` },
            { title: '对比报告' },
          ]"
          class="pa-0 mb-6"
        />

        <!-- 总体偏差卡片 -->
        <v-card elevation="1" class="mb-6">
          <v-card-text class="pa-5">
            <div class="d-flex align-center gap-6">
              <div class="text-center">
                <v-progress-circular
                  :model-value="overallDivergence * 100"
                  :color="divergenceColor(overallDivergence)"
                  size="80"
                  width="8"
                >
                  <span class="text-h6 font-bold">{{ Math.round(overallDivergence * 100) }}%</span>
                </v-progress-circular>
                <div class="text-caption text-grey mt-1">总体偏差</div>
              </div>
              <div class="flex-1">
                <div class="text-subtitle-1 font-bold mb-1">
                  <v-chip :color="divergenceColor(overallDivergence)" size="small" variant="tonal">
                    {{ divergenceLabel(overallDivergence) }}
                  </v-chip>
                </div>
                <div class="text-body-2 text-grey-darken-1">
                  锚点：{{ anchorInfo.name }}（节点 #{{ anchorInfo.nodeIndex }}）·
                  创建于 {{ anchorInfo.createdAt }} ·
                  涉及 {{ reports.length }} 个角色
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-row>
          <!-- 角色列表 -->
          <v-col cols="12" md="4">
            <div class="text-subtitle-2 font-semibold text-grey-darken-2 mb-3">角色偏差概览</div>
            <div class="d-flex flex-column gap-3">
              <v-card
                v-for="report in reports"
                :key="report.characterId"
                elevation="1"
                :class="selectedCharacter === report.characterId ? 'border-2 border-primary' : ''"
                class="cursor-pointer"
                @click="selectedCharacter = report.characterId === selectedCharacter ? null : report.characterId"
              >
                <v-card-text class="pa-4">
                  <div class="d-flex align-center gap-3">
                    <v-avatar :color="report.color" variant="tonal" size="40">
                      <v-icon>mdi-account</v-icon>
                    </v-avatar>
                    <div class="flex-1">
                      <div class="text-subtitle-2 font-bold">{{ report.characterName }}</div>
                      <v-progress-linear
                        :model-value="report.overallDivergence * 100"
                        :color="divergenceColor(report.overallDivergence)"
                        height="6"
                        rounded
                        class="mt-1"
                      />
                    </div>
                    <div class="text-right">
                      <div
                        class="text-subtitle-2 font-bold"
                        :class="`text-${divergenceColor(report.overallDivergence)}`"
                      >
                        {{ Math.round(report.overallDivergence * 100) }}%
                      </div>
                      <div class="text-caption text-grey">偏差</div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-col>

          <!-- 详细报告 -->
          <v-col cols="12" md="8">
            <div class="text-subtitle-2 font-semibold text-grey-darken-2 mb-3">
              {{ selectedReport ? `${selectedReport.characterName} 详细报告` : '选择角色查看详细报告' }}
            </div>

            <!-- 未选择状态 -->
            <v-card v-if="!selectedReport" elevation="1">
              <v-card-text class="text-center py-16">
                <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-cursor-pointer</v-icon>
                <p class="text-body-1 text-grey">点击左侧角色查看详细对比报告</p>
              </v-card-text>
            </v-card>

            <!-- 详细报告内容 -->
            <template v-else>
              <!-- 摘要 -->
              <v-card elevation="1" class="mb-4">
                <v-card-text class="pa-4">
                  <div class="d-flex align-center gap-2 mb-2">
                    <v-icon size="16" color="primary">mdi-text-box-outline</v-icon>
                    <span class="text-caption font-semibold text-grey-darken-2">摘要</span>
                  </div>
                  <p class="text-body-2 text-grey-darken-1 ma-0">{{ selectedReport.summary }}</p>
                </v-card-text>
              </v-card>

              <!-- 各维度详情 -->
              <div class="d-flex flex-column gap-3">
                <v-card
                  v-for="dim in selectedReport.dimensions"
                  :key="dim.name"
                  elevation="1"
                >
                  <v-card-text class="pa-4">
                    <div class="d-flex align-center gap-3 mb-3">
                      <v-chip
                        :color="divergenceColor(dim.divergence)"
                        size="small"
                        variant="tonal"
                      >
                        {{ dim.name }}
                      </v-chip>
                      <v-progress-linear
                        :model-value="dim.divergence * 100"
                        :color="divergenceColor(dim.divergence)"
                        height="6"
                        rounded
                        class="flex-1"
                      />
                      <span
                        class="text-caption font-bold"
                        :class="`text-${divergenceColor(dim.divergence)}`"
                        style="min-width: 36px; text-align: right"
                      >
                        {{ Math.round(dim.divergence * 100) }}%
                      </span>
                    </div>

                    <div v-if="dim.differences.length > 0" class="d-flex flex-column gap-2">
                      <div
                        v-for="(diff, i) in dim.differences"
                        :key="i"
                        class="d-flex align-start gap-2"
                      >
                        <v-icon size="14" color="warning" class="mt-0.5">mdi-alert</v-icon>
                        <span class="text-caption text-grey-darken-2">{{ diff }}</span>
                      </div>
                    </div>
                    <div v-else class="d-flex align-center gap-2">
                      <v-icon size="14" color="success">mdi-check-circle</v-icon>
                      <span class="text-caption text-success">与原剧情一致，无差异</span>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </template>
          </v-col>
        </v-row>
      </div>
    </v-main>
  </div>
</template>
