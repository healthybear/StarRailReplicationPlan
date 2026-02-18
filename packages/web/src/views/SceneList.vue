<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 搜索和筛选
const searchQuery = ref('');
const selectedTag = ref('all');

// 场景数据
interface Scene {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  tags: string[];
  weather: string;
  temperature: number;
  connectedScenes: number;
  status: 'active' | 'draft' | 'archived';
  updatedAt: string;
}

const scenes = ref<Scene[]>([
  {
    id: 'belobog_plaza',
    name: '贝洛伯格中央广场',
    description: '贝洛伯格的中央广场，是城市的核心区域。广场中央矗立着一座巨大的雕像，周围是繁忙的商业区和行政区。',
    tags: ['公共区域', '贝洛伯格', '主城区'],
    weather: '下雪',
    temperature: -15,
    connectedScenes: 3,
    status: 'active',
    updatedAt: '2 小时前',
  },
  {
    id: 'belobog_admin',
    name: '贝洛伯格行政区',
    description: '城市的行政中心，大守护者办公的地方。建筑宏伟庄严，守卫森严。',
    tags: ['行政区', '贝洛伯格', '重要区域'],
    weather: '下雪',
    temperature: -15,
    connectedScenes: 2,
    status: 'active',
    updatedAt: '5 小时前',
  },
  {
    id: 'xianzhou_luofu',
    name: '仙舟罗浮 - 星槎海中枢',
    description: '仙舟罗浮的中央枢纽，连接着各个重要区域。这里是仙舟的交通要道。',
    tags: ['仙舟', '罗浮', '交通枢纽'],
    weather: '晴朗',
    temperature: 22,
    connectedScenes: 5,
    status: 'active',
    updatedAt: '昨天',
  },
  {
    id: 'herta_station',
    name: '黑塔空间站 - 主控舱段',
    description: '黑塔空间站的主控制区域，充满了先进的科技设备和全息投影。',
    tags: ['空间站', '黑塔', '科技区'],
    weather: '室内',
    temperature: 20,
    connectedScenes: 4,
    status: 'active',
    updatedAt: '3 天前',
  },
  {
    id: 'penacony_dream',
    name: '匹诺康尼 - 黄金时刻',
    description: '匹诺康尼的梦境世界，充满了奢华和迷幻的氛围。',
    tags: ['匹诺康尼', '梦境', '娱乐区'],
    weather: '梦境',
    temperature: 25,
    connectedScenes: 6,
    status: 'draft',
    updatedAt: '1 周前',
  },
]);

// 标签列表
const allTags = computed(() => {
  const tags = new Set<string>();
  scenes.value.forEach(scene => {
    scene.tags.forEach(tag => tags.add(tag));
  });
  return ['all', ...Array.from(tags)];
});

// 筛选后的场景
const filteredScenes = computed(() => {
  return scenes.value.filter(scene => {
    const matchesSearch = scene.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         scene.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesTag = selectedTag.value === 'all' || scene.tags.includes(selectedTag.value);
    return matchesSearch && matchesTag;
  });
});

// 统计数据
const stats = computed(() => ({
  total: scenes.value.length,
  active: scenes.value.filter(s => s.status === 'active').length,
  draft: scenes.value.filter(s => s.status === 'draft').length,
  archived: scenes.value.filter(s => s.status === 'archived').length,
}));

// 方法
const viewScene = (scene: Scene) => {
  router.push({ name: 'SceneDetail', params: { sceneId: scene.id } });
};

const createScene = () => {
  router.push({ name: 'SceneDetail', params: { sceneId: 'new' } });
};

const editScene = (scene: Scene) => {
  router.push({ name: 'SceneDetail', params: { sceneId: scene.id }, query: { mode: 'edit' } });
};

const deleteScene = (scene: Scene) => {
  console.log('删除场景', scene);
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
              :color="getStatusColor(scene.status)"
              size="small"
              class="absolute top-3 right-3"
            >
              {{ getStatusText(scene.status) }}
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
                  v-for="tag in scene.tags"
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
                  <span class="text-grey-darken-1">{{ scene.weather }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <v-icon size="16" color="grey">mdi-thermometer</v-icon>
                  <span class="text-grey-darken-1">{{ scene.temperature }}°C</span>
                </div>
                <div class="flex items-center gap-2">
                  <v-icon size="16" color="grey">mdi-map-marker-path</v-icon>
                  <span class="text-grey-darken-1">{{ scene.connectedScenes }} 个连接</span>
                </div>
                <div class="flex items-center gap-2">
                  <v-icon size="16" color="grey">mdi-clock-outline</v-icon>
                  <span class="text-grey-darken-1">{{ scene.updatedAt }}</span>
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
