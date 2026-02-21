<script setup lang="ts">
import { computed } from 'vue';

interface AbilityData {
  name: string;
  value: number; // 0-100
  originalValue?: number; // 原剧情值，用于对比
}

const props = withDefaults(
  defineProps<{
    abilities: AbilityData[];
    size?: number;
    color?: string;
    originalColor?: string;
    showOriginal?: boolean;
    title?: string;
  }>(),
  {
    size: 240,
    color: '#6366f1',
    originalColor: '#94a3b8',
    showOriginal: false,
    title: '',
  }
);

const cx = computed(() => props.size / 2);
const cy = computed(() => props.size / 2);
const radius = computed(() => props.size * 0.38);
const levels = 5;

// 计算各顶点坐标
function polarToCartesian(angle: number, r: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: cx.value + r * Math.cos(rad),
    y: cy.value + r * Math.sin(rad),
  };
}

const axes = computed(() => {
  const n = props.abilities.length;
  return props.abilities.map((ability, i) => {
    const angle = (360 / n) * i;
    const tip = polarToCartesian(angle, radius.value);
    const labelR = radius.value + 22;
    const label = polarToCartesian(angle, labelR);
    return { ...ability, angle, tip, label };
  });
});

// 生成网格多边形
const gridPolygons = computed(() => {
  const n = props.abilities.length;
  return Array.from({ length: levels }, (_, lvl) => {
    const r = (radius.value / levels) * (lvl + 1);
    const points = Array.from({ length: n }, (__, i) => {
      const angle = (360 / n) * i;
      const p = polarToCartesian(angle, r);
      return `${p.x},${p.y}`;
    }).join(' ');
    return points;
  });
});

// 数据多边形
function dataPolygon(key: 'value' | 'originalValue') {
  const n = props.abilities.length;
  return props.abilities
    .map((ability, i) => {
      const val = (ability[key] ?? 0) / 100;
      const r = val * radius.value;
      const angle = (360 / n) * i;
      const p = polarToCartesian(angle, r);
      return `${p.x},${p.y}`;
    })
    .join(' ');
}

const currentPolygon = computed(() => dataPolygon('value'));
const originalPolygon = computed(() => dataPolygon('originalValue'));
</script>

<template>
  <div class="radar-chart-wrapper">
    <div v-if="title" class="text-caption font-semibold text-grey-darken-2 text-center mb-2">
      {{ title }}
    </div>
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <!-- 网格 -->
      <polygon
        v-for="(pts, i) in gridPolygons"
        :key="i"
        :points="pts"
        fill="none"
        stroke="#e2e8f0"
        stroke-width="1"
      />
      <!-- 轴线 -->
      <line
        v-for="ax in axes"
        :key="ax.name"
        :x1="cx"
        :y1="cy"
        :x2="ax.tip.x"
        :y2="ax.tip.y"
        stroke="#e2e8f0"
        stroke-width="1"
      />
      <!-- 原剧情数据（背景） -->
      <polygon
        v-if="showOriginal"
        :points="originalPolygon"
        :fill="originalColor + '33'"
        :stroke="originalColor"
        stroke-width="1.5"
        stroke-dasharray="4 2"
      />
      <!-- 当前数据 -->
      <polygon
        :points="currentPolygon"
        :fill="color + '33'"
        :stroke="color"
        stroke-width="2"
      />
      <!-- 数据点 -->
      <circle
        v-for="(ax, i) in axes"
        :key="`dot-${i}`"
        :cx="polarToCartesian((360 / abilities.length) * i, (ax.value / 100) * radius).x"
        :cy="polarToCartesian((360 / abilities.length) * i, (ax.value / 100) * radius).y"
        r="3"
        :fill="color"
      />
      <!-- 标签 -->
      <text
        v-for="ax in axes"
        :key="`label-${ax.name}`"
        :x="ax.label.x"
        :y="ax.label.y"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="11"
        fill="#64748b"
      >
        {{ ax.name }}
      </text>
      <!-- 数值标签 -->
      <text
        v-for="(ax, i) in axes"
        :key="`val-${i}`"
        :x="polarToCartesian((360 / abilities.length) * i, (ax.value / 100) * radius + 10).x"
        :y="polarToCartesian((360 / abilities.length) * i, (ax.value / 100) * radius + 10).y"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="10"
        font-weight="600"
        :fill="color"
      >
        {{ ax.value }}
      </text>
    </svg>
    <!-- 图例 -->
    <div v-if="showOriginal" class="d-flex justify-center gap-4 mt-1">
      <div class="d-flex align-center gap-1">
        <div class="legend-line" :style="{ background: color }" />
        <span class="text-caption text-grey-darken-1">当前</span>
      </div>
      <div class="d-flex align-center gap-1">
        <div class="legend-line legend-dashed" :style="{ background: originalColor }" />
        <span class="text-caption text-grey-darken-1">原剧情</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.radar-chart-wrapper {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}
.legend-line {
  width: 20px;
  height: 2px;
  border-radius: 1px;
}
.legend-dashed {
  background: repeating-linear-gradient(
    to right,
    #94a3b8 0,
    #94a3b8 4px,
    transparent 4px,
    transparent 6px
  ) !important;
}
</style>
