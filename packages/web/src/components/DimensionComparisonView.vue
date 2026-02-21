<script setup lang="ts">
interface DimensionScore {
  name: string;
  weight: number;
  rawDivergence: number;
  weightedScore: number;
}

interface WeightedResult {
  anchorId: string;
  anchorName: string;
  characterName?: string;
  fitScore: number;
  overallDivergence: number;
  overallAssessment: string;
  dimensionScores: DimensionScore[];
  differences: string[];
}

withDefaults(
  defineProps<{
    results: WeightedResult[];
    showCharacterName?: boolean;
  }>(),
  {
    showCharacterName: false,
  }
);

function fitColor(score: number) {
  if (score >= 0.8) return 'success';
  if (score >= 0.5) return 'warning';
  return 'error';
}

function dimensionColor(divergence: number) {
  if (divergence < 0.2) return 'success';
  if (divergence < 0.5) return 'warning';
  return 'error';
}
</script>

<template>
  <div class="dimension-comparison">
    <div v-if="results.length === 0" class="text-center py-8">
      <v-icon size="40" color="grey-lighten-2">mdi-chart-bar</v-icon>
      <p class="text-caption text-grey mt-2">暂无对比数据</p>
    </div>

    <div v-else class="d-flex flex-column gap-4">
      <v-card
        v-for="result in results"
        :key="result.anchorId"
        elevation="1"
        class="overflow-hidden"
      >
        <!-- 卡片头部 -->
        <div class="pa-4 border-b d-flex align-center gap-3">
          <div class="flex-1">
            <div class="d-flex align-center gap-2">
              <span class="text-subtitle-2 font-bold">{{ result.anchorName }}</span>
              <span v-if="showCharacterName && result.characterName" class="text-caption text-grey">
                · {{ result.characterName }}
              </span>
            </div>
            <p class="text-caption text-grey-darken-1 ma-0 mt-0.5">{{ result.overallAssessment }}</p>
          </div>
          <!-- 贴合度分数 -->
          <div class="text-center">
            <v-progress-circular
              :model-value="result.fitScore * 100"
              :color="fitColor(result.fitScore)"
              size="56"
              width="5"
            >
              <span class="text-caption font-bold">{{ Math.round(result.fitScore * 100) }}%</span>
            </v-progress-circular>
            <div class="text-caption text-grey mt-1">贴合度</div>
          </div>
        </div>

        <!-- 维度分数 -->
        <div class="pa-4">
          <div class="text-caption font-semibold text-grey-darken-2 mb-3">分维度加权得分</div>
          <div class="d-flex flex-column gap-2">
            <div
              v-for="dim in result.dimensionScores"
              :key="dim.name"
              class="d-flex align-center gap-3"
            >
              <div style="min-width: 60px">
                <v-chip size="x-small" :color="dimensionColor(dim.rawDivergence)" variant="tonal">
                  {{ dim.name }}
                </v-chip>
              </div>
              <v-progress-linear
                :model-value="(1 - dim.rawDivergence) * 100"
                :color="dimensionColor(dim.rawDivergence)"
                height="8"
                rounded
                class="flex-1"
              />
              <div class="text-right" style="min-width: 80px">
                <span class="text-caption font-bold" :class="`text-${dimensionColor(dim.rawDivergence)}`">
                  {{ Math.round((1 - dim.rawDivergence) * 100) }}%
                </span>
                <span class="text-caption text-grey ml-1">×{{ dim.weight.toFixed(1) }}</span>
              </div>
            </div>
          </div>

          <!-- 差异列表 -->
          <template v-if="result.differences.length > 0">
            <v-divider class="my-3" />
            <div class="text-caption font-semibold text-grey-darken-2 mb-2">差异说明</div>
            <div class="d-flex flex-column gap-1">
              <div
                v-for="(diff, i) in result.differences"
                :key="i"
                class="d-flex align-start gap-2"
              >
                <v-icon size="12" color="warning" class="mt-0.5 flex-shrink-0">mdi-alert-circle</v-icon>
                <span class="text-caption text-grey-darken-2">{{ diff }}</span>
              </div>
            </div>
          </template>
          <div v-else class="mt-3 d-flex align-center gap-2">
            <v-icon size="14" color="success">mdi-check-circle</v-icon>
            <span class="text-caption text-success">与原剧情完全一致</span>
          </div>
        </div>

        <!-- 底部权重说明 -->
        <div class="pa-3 bg-grey-lighten-5 border-t">
          <div class="d-flex align-center gap-4 flex-wrap">
            <span class="text-caption text-grey">权重配置：</span>
            <span
              v-for="dim in result.dimensionScores"
              :key="`w-${dim.name}`"
              class="text-caption text-grey-darken-1"
            >
              {{ dim.name }} ×{{ dim.weight.toFixed(1) }}
            </span>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>
