<script setup lang="ts">
interface VisionEvent {
  id: string;
  timestamp: string;
  characterId: string;
  characterName: string;
  characterColor?: string;
  infoId: string;
  infoTitle: string;
  infoType: 'acquired' | 'lost' | 'updated';
  description?: string;
}

withDefaults(
  defineProps<{
    events: VisionEvent[];
    maxItems?: number;
  }>(),
  {
    maxItems: 20,
  }
);

function eventIcon(type: VisionEvent['infoType']) {
  if (type === 'acquired') return 'mdi-eye-plus';
  if (type === 'lost') return 'mdi-eye-minus';
  return 'mdi-eye-refresh';
}

function eventColor(type: VisionEvent['infoType']) {
  if (type === 'acquired') return 'success';
  if (type === 'lost') return 'error';
  return 'warning';
}

function eventLabel(type: VisionEvent['infoType']) {
  if (type === 'acquired') return '获取';
  if (type === 'lost') return '失去';
  return '更新';
}
</script>

<template>
  <div class="vision-timeline">
    <div v-if="events.length === 0" class="text-center py-8">
      <v-icon size="40" color="grey-lighten-2">mdi-timeline-outline</v-icon>
      <p class="text-caption text-grey mt-2">暂无视野变化记录</p>
    </div>

    <div v-else class="timeline-container">
      <div
        v-for="(event, i) in events.slice(0, maxItems)"
        :key="event.id"
        class="timeline-item"
        :class="{ 'timeline-item--last': i === Math.min(events.length, maxItems) - 1 }"
      >
        <!-- 时间轴线 -->
        <div class="timeline-line-col">
          <div class="timeline-dot" :class="`bg-${eventColor(event.infoType)}`">
            <v-icon size="12" color="white">{{ eventIcon(event.infoType) }}</v-icon>
          </div>
          <div v-if="i < Math.min(events.length, maxItems) - 1" class="timeline-connector" />
        </div>

        <!-- 内容 -->
        <div class="timeline-content pb-4">
          <div class="d-flex align-center gap-2 mb-1">
            <v-chip
              size="x-small"
              :color="event.characterColor ?? 'primary'"
              variant="tonal"
            >
              {{ event.characterName }}
            </v-chip>
            <v-chip
              size="x-small"
              :color="eventColor(event.infoType)"
              variant="tonal"
            >
              {{ eventLabel(event.infoType) }}
            </v-chip>
            <span class="text-caption text-grey ml-auto">{{ event.timestamp }}</span>
          </div>
          <div class="text-body-2 font-semibold text-grey-darken-2">{{ event.infoTitle }}</div>
          <div v-if="event.description" class="text-caption text-grey-darken-1 mt-0.5">
            {{ event.description }}
          </div>
        </div>
      </div>

      <div v-if="events.length > maxItems" class="text-caption text-grey text-center pt-2">
        还有 {{ events.length - maxItems }} 条记录未显示
      </div>
    </div>
  </div>
</template>

<style scoped>
.vision-timeline {
  width: 100%;
}
.timeline-container {
  display: flex;
  flex-direction: column;
}
.timeline-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.timeline-line-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-top: 2px;
}
.timeline-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.timeline-connector {
  width: 2px;
  flex: 1;
  min-height: 16px;
  background: #e2e8f0;
  margin-top: 4px;
}
.timeline-content {
  flex: 1;
  min-width: 0;
}
</style>
