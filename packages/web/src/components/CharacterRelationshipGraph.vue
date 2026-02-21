<script setup lang="ts">
import { computed } from 'vue';

interface CharacterNode {
  id: string;
  name: string;
  color?: string;
  isMain?: boolean;
}

interface RelationshipEdge {
  sourceId: string;
  targetId: string;
  trust: number; // -1 to 1
  label?: string;
}

const props = withDefaults(
  defineProps<{
    characters: CharacterNode[];
    relationships: RelationshipEdge[];
    width?: number;
    height?: number;
  }>(),
  {
    width: 480,
    height: 320,
  }
);

// 简单圆形布局
const nodePositions = computed(() => {
  const n = props.characters.length;
  const cx = props.width / 2;
  const cy = props.height / 2;
  const r = Math.min(props.width, props.height) * 0.35;

  return props.characters.map((char) => {
    if (char.isMain) {
      return { ...char, x: cx, y: cy };
    }
    // 非主角色均匀分布在圆上（跳过主角位置）
    const mainCount = props.characters.filter(c => c.isMain).length;
    const nonMainChars = props.characters.filter(c => !c.isMain);
    const idx = nonMainChars.findIndex(c => c.id === char.id);
    const angle = (360 / (n - mainCount)) * idx - 90;
    const rad = angle * (Math.PI / 180);
    return {
      ...char,
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  });
});

const posMap = computed(() => {
  const m = new Map<string, { x: number; y: number }>();
  nodePositions.value.forEach(n => m.set(n.id, { x: n.x, y: n.y }));
  return m;
});

function edgeColor(trust: number) {
  if (trust > 0.5) return '#22c55e';
  if (trust > 0) return '#86efac';
  if (trust > -0.3) return '#fbbf24';
  return '#ef4444';
}

function edgeWidth(trust: number) {
  return Math.max(1, Math.abs(trust) * 4);
}

function edgeDash(trust: number) {
  return trust < 0 ? '6 3' : 'none';
}

// 边的中点（用于标签）
function edgeMidpoint(src: { x: number; y: number }, tgt: { x: number; y: number }) {
  return { x: (src.x + tgt.x) / 2, y: (src.y + tgt.y) / 2 };
}

const nodeRadius = 22;
const mainNodeRadius = 28;
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    class="relationship-graph"
  >
    <!-- 边 -->
    <g v-for="edge in relationships" :key="`${edge.sourceId}-${edge.targetId}`">
      <template v-if="posMap.get(edge.sourceId) && posMap.get(edge.targetId)">
        <line
          :x1="posMap.get(edge.sourceId)!.x"
          :y1="posMap.get(edge.sourceId)!.y"
          :x2="posMap.get(edge.targetId)!.x"
          :y2="posMap.get(edge.targetId)!.y"
          :stroke="edgeColor(edge.trust)"
          :stroke-width="edgeWidth(edge.trust)"
          :stroke-dasharray="edgeDash(edge.trust)"
          stroke-linecap="round"
          opacity="0.7"
        />
        <!-- 关系标签 -->
        <text
          v-if="edge.label"
          :x="edgeMidpoint(posMap.get(edge.sourceId)!, posMap.get(edge.targetId)!).x"
          :y="edgeMidpoint(posMap.get(edge.sourceId)!, posMap.get(edge.targetId)!).y - 6"
          text-anchor="middle"
          font-size="10"
          fill="#64748b"
        >
          {{ edge.label }}
        </text>
      </template>
    </g>

    <!-- 节点 -->
    <g
      v-for="node in nodePositions"
      :key="node.id"
    >
      <circle
        :cx="node.x"
        :cy="node.y"
        :r="node.isMain ? mainNodeRadius : nodeRadius"
        :fill="(node.color ?? '#6366f1') + '22'"
        :stroke="node.color ?? '#6366f1'"
        :stroke-width="node.isMain ? 2.5 : 1.5"
      />
      <text
        :x="node.x"
        :y="node.y"
        text-anchor="middle"
        dominant-baseline="middle"
        :font-size="node.isMain ? 12 : 11"
        :font-weight="node.isMain ? '700' : '500'"
        :fill="node.color ?? '#6366f1'"
      >
        {{ node.name.length > 3 ? node.name.slice(0, 3) : node.name }}
      </text>
      <text
        :x="node.x"
        :y="node.y + (node.isMain ? mainNodeRadius : nodeRadius) + 12"
        text-anchor="middle"
        font-size="10"
        fill="#475569"
      >
        {{ node.name }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.relationship-graph {
  display: block;
}
</style>
