<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { sceneApi, type Scene } from '@/api';

const router = useRouter();

// 搜索和筛选
const searchQuery = ref('');
const selectedTag = ref('all');

// 场景数据
const scenes = ref<Scene[]>([]);
const loading = ref(false);
const error = ref<string>('');

// Load scenes from API
const loadScenes = async () => {
  try {
    loading.value = true;
    error.value = '';
    const data = await sceneApi.getAll();
    scenes.value = data;
  } catch (e: any) {
    error.value = `加载场景列表失败: ${e.message}`;
    console.error('Failed to load scenes:', e);
  } finally {
    loading.value = false;
  }
};

// 标签列表
const allTags = computed(() => {
  const tags = new Set<string>();
  scenes.value.forEach(scene => {
    if (scene.metadata?.tags && Array.isArray(scene.metadata.tags)) {
      (scene.metadata.tags as string[]).forEach(tag => tags.add(tag));
    }
  });
  return ['all', ...Array.from(tags)];
});

// 筛选后的场景
const filteredScenes = computed(() => {
  return scenes.value.filter(scene => {
    const matchesSearch = scene.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         scene.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesTag = selectedTag.value === 'all' ||
                      (scene.metadata?.tags && Array.isArray(scene.metadata.tags) &&
                       (scene.metadata.tags as string[]).includes(selectedTag.value));
    return matchesSearch && matchesTag;
  });
});

// 统计数据
const stats = computed(() => ({
  total: scenes.value.length,
  active: scenes.value.length,
  draft: 0,
  archived: 0,
}));

// 方法
const viewScene = (scene: Scene) => {
  router.push({ name: 'SceneDetail', params: { sceneId: scene.sceneId } });
};

const createScene = () => {
  router.push({ name: 'SceneDetail', params: { sceneId: 'new' } });
};

const editScene = (scene: Scene) => {
  router.push({ name: 'SceneDetail', params: { sceneId: scene.sceneId }, query: { mode: 'edit' } });
};

const deleteScene = async (scene: Scene) => {
  if (!confirm(`确定要删除场景"${scene.name}"吗？`)) {
    return;
  }
  try {
    await sceneApi.delete(scene.sceneId);
    await loadScenes();
  } catch (e: any) {
    error.value = `删除场景失败: ${e.message}`;
    console.error('Failed to delete scene:', e);
  }
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    draft: 'warning',
    archived: 'grey',
  };
  return colors[status] || 'grey';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: '活跃',
    draft: '草稿',
    archived: '已归档',
  };
  return texts[status] || status;
};

// Helper functions to get environment data
const getWeather = (scene: Scene): string => {
  if (scene.environment && typeof scene.environment === 'object') {
    return (scene.environment as any).weather || '未知';
  }
  return '未知';
};

const getTemperature = (scene: Scene): number => {
  if (scene.environment && typeof scene.environment === 'object') {
    return (scene.environment as any).temperature || 20;
  }
  return 20;
};

const getConnectedScenes = (scene: Scene): number => {
  if (scene.metadata && typeof scene.metadata === 'object') {
    const connected = (scene.metadata as any).connectedScenes;
    return Array.isArray(connected) ? connected.length : 0;
  }
  return 0;
};

const getUpdatedAt = (scene: Scene): string => {
  if (scene.updatedAt) {
    return new Date(scene.updatedAt).toLocaleString('zh-CN');
  }
  return '未知';
};

const getTags = (scene: Scene): string[] => {
  if (scene.metadata?.tags && Array.isArray(scene.metadata.tags)) {
    return scene.metadata.tags as string[];
  }
  return [];
};

onMounted(() => {
  loadScenes();
});
</script>

<template>
  <!-- Header -->
  <v-app-bar elevation="0" class="border-b">
    <v-app-bar-title class="text-xl font-bold">场景列表</v-app-bar-title>

    <v-divider vertical class="mx-4" />

    <v-text-field
      v-model="searchQuery"
      prepend-inner-icon="mdi-magnify"
      placeholder="搜索场景..."
      variant="solo-filled"
      flat
      density="compact"
      hide-details
      class="max-w-md"
      bg-color="grey-lighten-4"
    />

    <v-spacer />

    <v-btn icon variant="text">
      <v-icon>mdi-bell-outline</v-icon>
      <v-badge color="error" dot floating />
    </v-btn>

    <v-btn icon variant="text">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>

    <v-btn
      color="primary"
      prepend-icon="mdi-plus"
      class="ml-2"
      @click="createScene"
    >
      新建场景
    </v-btn>
  </v-app-bar>

  <!-- Content Area -->
  <div class="pa-8 bg-grey-lighten-5">
    <!-- Breadcrumbs -->
    <v-breadcrumbs
      :items="[
        { title: '首页', disabled: false, href: '#' },
        { title: '场景列表', disabled: true },
      ]"
      class="pa-0 mb-6"
    >
      <template #divider>
        <v-icon>mdi-chevron-right</v-icon>
      </template>
    </v-breadcrumbs>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <!-- Loading State -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- Stats Overview -->
    <v-row class="mb-8">
      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">总场景数</p>
              <p class="text-3xl font-bold">{{ stats.total }}</p>
            </div>
            <v-avatar color="primary-lighten-4" size="48">
              <v-icon color="primary">mdi-map-marker</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">活跃场景</p>
              <p class="text-3xl font-bold text-success">{{ stats.active }}</p>
            </div>
            <v-avatar color="success-lighten-4" size="48">
              <v-icon color="success">mdi-check-circle</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">草稿</p>
              <p class="text-3xl font-bold text-warning">{{ stats.draft }}</p>
            </div>
            <v-avatar color="warning-lighten-4" size="48">
              <v-icon color="warning">mdi-pencil</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">已归档</p>
              <p class="text-3xl font-bold text-grey">{{ stats.archived }}</p>
            </div>
            <v-avatar color="grey-lighten-3" size="48">
              <v-icon color="grey">mdi-archive</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tag Filter -->
    <v-card elevation="1" class="mb-6 pa-4">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm font-semibold text-grey-darken-1">标签筛选：</span>
        <v-chip-group v-model="selectedTag" mandatory>
          <v-chip
            v-for="tag in allTags"
            :key="tag"
            :value="tag"
            variant="outlined"
            filter
          >
            {{ tag === 'all' ? '全部' : tag }}
          </v-chip>
        </v-chip-group>
      </div>
    </v-card>

    <!-- Scene Grid -->
    <v-row>
      <v-col
        v-for="scene in filteredScenes"
        :key="scene.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          elevation="1"
          class="h-full cursor-pointer transition-all hover:elevation-4"
          @click="viewScene(scene)"
        >
          <!-- Thumbnail -->
          <div class="relative h-48 bg-gradient-to-br from-primary-lighten-2 to-primary-darken-2">
            <div class="absolute inset-0 flex items-center justify-center">
              <v-icon size="64" color="white" class="opacity-50">
                mdi-map-marker-outline
              </v-icon>
            </div>
            <v-chip
              :color="getStatusColor('active')"
              size="small"
              class="absolute top-3 right-3"
            >
              {{ getStatusText('active') }}
            </v-chip>
          </div>

          <v-card-title class="text-lg font-bold">
            {{ scene.name }}
          </v-card-title>

          <v-card-subtitle class="text-sm">
            {{ scene.description.substring(0, 80) }}{{ scene.description.length > 80 ? '...' : '' }}
          </v-card-subtitle>

          <v-card-text>
            <div class="space-y-3">
              <!-- Tags -->
              <div class="flex flex-wrap gap-1">
                <v-chip
                  v-for="tag in getTags(scene)"
                  :key="tag"
                  size="x-small"
                  variant="tonal"
                  color="primary"
                >
                  {{ tag }}
                </v-chip>
              </div>

              <!-- Info -->
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="flex items-center gap-2">
                  <v-icon size="16" color="grey">mdi-weather-snowy</v-icon>
                  <span class="text-grey-darken-1">{{ getWeather(scene) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <v-icon size="16" color="grey">mdi-thermometer</v-icon>
                  <span class="text-grey-darken-1">{{ getTemperature(scene) }}°C</span>
                </div>
                <div class="flex items-center gap-2">
                  <v-icon size="16" color="grey">mdi-map-marker-path</v-icon>
                  <span class="text-grey-darken-1">{{ getConnectedScenes(scene) }} 个连接</span>
                </div>
                <div class="flex items-center gap-2">
                  <v-icon size="16" color="grey">mdi-clock-outline</v-icon>
                  <span class="text-grey-darken-1">{{ getUpdatedAt(scene) }}</span>
                </div>
              </div>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              prepend-icon="mdi-eye"
              size="small"
              variant="tonal"
              color="primary"
              @click.stop="viewScene(scene)"
            >
              查看
            </v-btn>
            <v-spacer />
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click.stop="editScene(scene)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click.stop="deleteScene(scene)"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-if="filteredScenes.length === 0" elevation="1" class="pa-12 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-map-marker-off
      </v-icon>
      <h3 class="text-xl font-bold mb-2">未找到场景</h3>
      <p class="text-grey-darken-1 mb-6">尝试调整搜索条件或创建新场景</p>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="createScene">
        新建场景
      </v-btn>
    </v-card>
  </div>
</template>

<style scoped lang="scss">
.v-app-bar {
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
}

.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gap-1 {
  gap: 0.25rem;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-3 {
  gap: 0.75rem;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}
</style>
