<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const sceneId = computed(() => route.params.sceneId as string);
const isNewScene = computed(() => sceneId.value === 'new');
const isEditMode = ref(route.query.mode === 'edit' || isNewScene.value);

// 场景数据
const sceneData = ref({
  id: '',
  name: '',
  description: '',
  tags: [] as string[],
  defaultEnvironment: {
    weather: 'sunny',
    temperature: 20,
    lighting: 'bright',
    timeOfDay: 'afternoon',
    sceneCondition: {
      damaged: false,
      accessible: true,
      crowded: false,
    },
  },
  connectedScenes: [] as string[],
});

// 可用的连接场景
const availableScenes = ref([
  { id: 'belobog_plaza', name: '贝洛伯格中央广场' },
  { id: 'belobog_admin', name: '贝洛伯格行政区' },
  { id: 'belobog_commercial', name: '贝洛伯格商业区' },
  { id: 'xianzhou_luofu', name: '仙舟罗浮 - 星槎海中枢' },
  { id: 'herta_station', name: '黑塔空间站 - 主控舱段' },
]);

// 天气选项
const weatherOptions = [
  { value: 'sunny', title: '晴朗', icon: 'mdi-weather-sunny' },
  { value: 'cloudy', title: '多云', icon: 'mdi-weather-cloudy' },
  { value: 'rainy', title: '下雨', icon: 'mdi-weather-rainy' },
  { value: 'snowy', title: '下雪', icon: 'mdi-weather-snowy' },
  { value: 'foggy', title: '雾天', icon: 'mdi-weather-fog' },
  { value: 'indoor', title: '室内', icon: 'mdi-home' },
  { value: 'dream', title: '梦境', icon: 'mdi-cloud' },
];

// 光照选项
const lightingOptions = [
  { value: 'bright', title: '明亮' },
  { value: 'dim', title: '昏暗' },
  { value: 'dark', title: '黑暗' },
];

// 时间选项
const timeOfDayOptions = [
  { value: 'morning', title: '早晨' },
  { value: 'afternoon', title: '下午' },
  { value: 'evening', title: '傍晚' },
  { value: 'night', title: '夜晚' },
];

// 新标签输入
const newTag = ref('');

// 加载场景数据
onMounted(() => {
  if (!isNewScene.value) {
    loadSceneData();
  }
});

const loadSceneData = () => {
  // TODO: 从后端加载场景数据
  // 模拟数据
  if (sceneId.value === 'belobog_plaza') {
    sceneData.value = {
      id: 'belobog_plaza',
      name: '贝洛伯格中央广场',
      description: '贝洛伯格的中央广场，是城市的核心区域。广场中央矗立着一座巨大的雕像，周围是繁忙的商业区和行政区。尽管永冬笼罩着这座城市，广场上依然人来人往。',
      tags: ['公共区域', '贝洛伯格', '主城区'],
      defaultEnvironment: {
        weather: 'snowy',
        temperature: -15,
        lighting: 'dim',
        timeOfDay: 'afternoon',
        sceneCondition: {
          damaged: false,
          accessible: true,
          crowded: true,
        },
      },
      connectedScenes: ['belobog_admin', 'belobog_commercial'],
    };
  }
};

// 方法
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
};

const saveScene = () => {
  // TODO: 保存到后端
  console.log('保存场景', sceneData.value);
  isEditMode.value = false;
};

const cancelEdit = () => {
  if (isNewScene.value) {
    router.push({ name: 'SceneList' });
  } else {
    loadSceneData();
    isEditMode.value = false;
  }
};

const addTag = () => {
  if (newTag.value && !sceneData.value.tags.includes(newTag.value)) {
    sceneData.value.tags.push(newTag.value);
    newTag.value = '';
  }
};

const removeTag = (tag: string) => {
  sceneData.value.tags = sceneData.value.tags.filter(t => t !== tag);
};

const getWeatherIcon = (weather: string) => {
  const option = weatherOptions.find(w => w.value === weather);
  return option?.icon || 'mdi-weather-sunny';
};

const getWeatherTitle = (weather: string) => {
  const option = weatherOptions.find(w => w.value === weather);
  return option?.title || weather;
};
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
    <!-- 顶部工具栏 -->
    <v-app-bar elevation="0" class="border-b border-slate-200 dark:border-slate-800">
      <template #prepend>
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          @click="router.push({ name: 'SceneList' })"
        />
        <div class="flex items-center gap-3 ml-4">
          <v-avatar color="primary" size="32">
            <v-icon>mdi-map-marker</v-icon>
          </v-avatar>
          <div>
            <div class="text-lg font-bold">
              {{ isNewScene ? '新建场景' : sceneData.name }}
            </div>
            <div v-if="!isNewScene" class="text-xs text-slate-500">
              场景 ID: {{ sceneData.id }}
            </div>
          </div>
        </div>
      </template>

      <template #append>
        <div class="flex gap-2 mr-4">
          <v-btn
            v-if="!isEditMode"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-pencil"
            @click="toggleEditMode"
          >
            编辑
          </v-btn>
          <template v-else>
            <v-btn
              variant="outlined"
              @click="cancelEdit"
            >
              取消
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-content-save"
              @click="saveScene"
            >
              保存
            </v-btn>
          </template>
        </div>
      </template>
    </v-app-bar>

    <!-- 主内容区 -->
    <v-main class="flex-1 overflow-y-auto">
      <div class="max-w-6xl mx-auto py-8 px-4">
        <v-row>
          <!-- 左侧：基本信息 -->
          <v-col cols="12" md="8">
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                基本信息
              </v-card-title>
              <v-card-text class="pa-6">
                <div class="space-y-6">
                  <!-- 场景名称 -->
                  <v-text-field
                    v-model="sceneData.name"
                    label="场景名称"
                    placeholder="例如：贝洛伯格中央广场"
                    variant="outlined"
                    :readonly="!isEditMode"
                    required
                  />

                  <!-- 场景描述 -->
                  <v-textarea
                    v-model="sceneData.description"
                    label="场景描述"
                    placeholder="详细描述这个场景的外观、氛围和特点..."
                    variant="outlined"
                    rows="6"
                    :readonly="!isEditMode"
                  />

                  <!-- 标签 -->
                  <div>
                    <label class="text-sm font-semibold mb-2 block">标签</label>
                    <div class="flex flex-wrap gap-2 mb-3">
                      <v-chip
                        v-for="tag in sceneData.tags"
                        :key="tag"
                        :closable="isEditMode"
                        color="primary"
                        variant="tonal"
                        @click:close="removeTag(tag)"
                      >
                        {{ tag }}
                      </v-chip>
                    </div>
                    <v-text-field
                      v-if="isEditMode"
                      v-model="newTag"
                      placeholder="添加新标签..."
                      variant="outlined"
                      density="compact"
                      append-inner-icon="mdi-plus"
                      @click:append-inner="addTag"
                      @keydown.enter="addTag"
                    />
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- 环境设置 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                环境设置
              </v-card-title>
              <v-card-text class="pa-6">
                <div class="space-y-6">
                  <!-- 天气 -->
                  <div>
                    <label class="text-sm font-semibold mb-2 block">天气</label>
                    <v-select
                      v-model="sceneData.defaultEnvironment.weather"
                      :items="weatherOptions"
                      variant="outlined"
                      :readonly="!isEditMode"
                    >
                      <template #selection="{ item }">
                        <div class="flex items-center gap-2">
                          <v-icon>{{ item.raw.icon }}</v-icon>
                          <span>{{ item.raw.title }}</span>
                        </div>
                      </template>
                      <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                          <template #prepend>
                            <v-icon>{{ item.raw.icon }}</v-icon>
                          </template>
                        </v-list-item>
                      </template>
                    </v-select>
                  </div>

                  <!-- 温度 -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <label class="text-sm font-semibold">温度</label>
                      <span class="text-sm text-slate-500">
                        {{ sceneData.defaultEnvironment.temperature }}°C
                      </span>
                    </div>
                    <v-slider
                      v-model="sceneData.defaultEnvironment.temperature"
                      :min="-30"
                      :max="50"
                      :step="1"
                      color="primary"
                      thumb-label
                      :readonly="!isEditMode"
                    />
                  </div>

                  <!-- 光照 -->
                  <div>
                    <label class="text-sm font-semibold mb-2 block">光照</label>
                    <v-select
                      v-model="sceneData.defaultEnvironment.lighting"
                      :items="lightingOptions"
                      variant="outlined"
                      :readonly="!isEditMode"
                    />
                  </div>

                  <!-- 时间 -->
                  <div>
                    <label class="text-sm font-semibold mb-2 block">时间</label>
                    <v-select
                      v-model="sceneData.defaultEnvironment.timeOfDay"
                      :items="timeOfDayOptions"
                      variant="outlined"
                      :readonly="!isEditMode"
                    />
                  </div>

                  <!-- 场景状态 -->
                  <div>
                    <label class="text-sm font-semibold mb-3 block">场景状态</label>
                    <div class="space-y-2">
                      <v-checkbox
                        v-model="sceneData.defaultEnvironment.sceneCondition.damaged"
                        label="损坏"
                        density="compact"
                        :readonly="!isEditMode"
                        hide-details
                      />
                      <v-checkbox
                        v-model="sceneData.defaultEnvironment.sceneCondition.accessible"
                        label="可访问"
                        density="compact"
                        :readonly="!isEditMode"
                        hide-details
                      />
                      <v-checkbox
                        v-model="sceneData.defaultEnvironment.sceneCondition.crowded"
                        label="拥挤"
                        density="compact"
                        :readonly="!isEditMode"
                        hide-details
                      />
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 右侧：连接场景和预览 -->
          <v-col cols="12" md="4">
            <!-- 场景预览 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                场景预览
              </v-card-title>
              <v-card-text class="pa-0">
                <div class="relative h-64 bg-gradient-to-br from-primary-lighten-2 to-primary-darken-2">
                  <div class="absolute inset-0 flex items-center justify-center">
                    <v-icon size="80" color="white" class="opacity-50">
                      {{ getWeatherIcon(sceneData.defaultEnvironment.weather) }}
                    </v-icon>
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div class="text-white">
                      <div class="flex items-center gap-2 mb-1">
                        <v-icon size="20" color="white">
                          {{ getWeatherIcon(sceneData.defaultEnvironment.weather) }}
                        </v-icon>
                        <span class="text-sm">
                          {{ getWeatherTitle(sceneData.defaultEnvironment.weather) }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <v-icon size="20" color="white">mdi-thermometer</v-icon>
                        <span class="text-sm">
                          {{ sceneData.defaultEnvironment.temperature }}°C
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- 连接场景 -->
            <v-card elevation="1">
              <v-card-title class="text-xl font-bold border-b">
                连接场景
              </v-card-title>
              <v-card-text class="pa-6">
                <v-select
                  v-if="isEditMode"
                  v-model="sceneData.connectedScenes"
                  :items="availableScenes"
                  item-title="name"
                  item-value="id"
                  label="选择连接的场景"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                />
                <v-list v-else density="compact">
                  <v-list-item
                    v-for="sceneId in sceneData.connectedScenes"
                    :key="sceneId"
                    :title="availableScenes.find(s => s.id === sceneId)?.name || sceneId"
                    prepend-icon="mdi-map-marker-path"
                  />
                  <v-list-item v-if="sceneData.connectedScenes.length === 0">
                    <div class="text-center text-slate-500 py-4">
                      <v-icon size="48" color="grey-lighten-1" class="mb-2">
                        mdi-map-marker-off
                      </v-icon>
                      <p class="text-sm">暂无连接场景</p>
                    </div>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-main>
  </div>
</template>

<style scoped lang="scss">
.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}
</style>
