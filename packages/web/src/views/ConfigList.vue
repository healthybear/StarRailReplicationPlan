<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const searchQuery = ref('');
const selectedType = ref('全部');

const typeFilters = ['全部', '场景包', '人物包', '势力包', '完整包'];

// 模拟配置包数据
const configs = ref([
  {
    id: 'config-001',
    name: '贝洛伯格完整配置包',
    type: '完整包',
    description: '包含贝洛伯格所有场景、人物和势力的完整配置，适用于永冬篇剧情复现。',
    version: '1.2.0',
    scenes: 8,
    characters: 12,
    factions: 3,
    size: '2.4 MB',
    updatedAt: '2026-02-18',
    status: 'active',
  },
  {
    id: 'config-002',
    name: '仙舟罗浮场景包',
    type: '场景包',
    description: '仙舟罗浮的核心场景配置，包含星槎海中枢、丹鼎司等主要区域。',
    version: '0.9.1',
    scenes: 6,
    characters: 0,
    factions: 0,
    size: '0.8 MB',
    updatedAt: '2026-02-15',
    status: 'active',
  },
  {
    id: 'config-003',
    name: '开拓者人物包',
    type: '人物包',
    description: '开拓者及其核心同伴的人物状态配置，包含性格特质和能力值设定。',
    version: '1.0.0',
    scenes: 0,
    characters: 5,
    factions: 0,
    size: '0.3 MB',
    updatedAt: '2026-02-10',
    status: 'draft',
  },
  {
    id: 'config-004',
    name: '星核猎手势力包',
    type: '势力包',
    description: '星核猎手势力的完整配置，包含成员关系和势力目标设定。',
    version: '0.5.0',
    scenes: 0,
    characters: 0,
    factions: 1,
    size: '0.2 MB',
    updatedAt: '2026-02-08',
    status: 'archived',
  },
]);

const filteredConfigs = computed(() => {
  return configs.value.filter(c => {
    const matchType = selectedType.value === '全部' || c.type === selectedType.value;
    const matchSearch =
      !searchQuery.value ||
      c.name.includes(searchQuery.value) ||
      c.description.includes(searchQuery.value);
    return matchType && matchSearch;
  });
});

const stats = computed(() => ({
  total: configs.value.length,
  active: configs.value.filter(c => c.status === 'active').length,
  draft: configs.value.filter(c => c.status === 'draft').length,
  archived: configs.value.filter(c => c.status === 'archived').length,
}));

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    active: 'success',
    draft: 'warning',
    archived: 'grey',
  };
  return map[status] || 'grey';
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: '已发布',
    draft: '草稿',
    archived: '已归档',
  };
  return map[status] || status;
};

const typeColor = (type: string) => {
  const map: Record<string, string> = {
    完整包: 'primary',
    场景包: 'teal',
    人物包: 'purple',
    势力包: 'orange',
  };
  return map[type] || 'grey';
};

const typeIcon = (type: string) => {
  const map: Record<string, string> = {
    完整包: 'mdi-package-variant-closed',
    场景包: 'mdi-map-marker-multiple',
    人物包: 'mdi-account-group',
    势力包: 'mdi-shield-half-full',
  };
  return map[type] || 'mdi-file-tree';
};

const exportConfig = (id: string) => {
  console.log('导出配置包', id);
};

const importConfig = () => {
  console.log('导入配置包');
};
</script>

<template>
  <div class="bg-grey-lighten-5 min-h-screen">
    <!-- 顶部应用栏 -->
    <v-app-bar elevation="0" class="border-b">
      <v-app-bar-title>
        <div class="flex items-center gap-2">
          <v-icon color="primary">mdi-file-tree</v-icon>
          <span class="font-bold">配置包管理</span>
        </div>
      </v-app-bar-title>
      <template #append>
        <div class="flex gap-2 mr-4">
          <v-text-field
            v-model="searchQuery"
            placeholder="搜索配置包..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            style="width: 220px"
          />
          <v-btn
            variant="tonal"
            prepend-icon="mdi-upload"
            @click="importConfig"
          >
            导入
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
          >
            新建配置包
          </v-btn>
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <div class="pa-6">
        <!-- 面包屑 -->
        <v-breadcrumbs
          :items="[{ title: '首页', href: '/' }, { title: '配置包' }]"
          class="pa-0 mb-6"
        />

        <!-- 统计卡片 -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1">
              <v-card-text class="d-flex align-center gap-4">
                <v-avatar color="primary" variant="tonal" size="48">
                  <v-icon>mdi-package-variant-closed</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-bold">{{ stats.total }}</div>
                  <div class="text-caption text-grey">配置包总数</div>
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
                  <div class="text-h5 font-bold">{{ stats.active }}</div>
                  <div class="text-caption text-grey">已发布</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1">
              <v-card-text class="d-flex align-center gap-4">
                <v-avatar color="warning" variant="tonal" size="48">
                  <v-icon>mdi-pencil-circle</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-bold">{{ stats.draft }}</div>
                  <div class="text-caption text-grey">草稿</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1">
              <v-card-text class="d-flex align-center gap-4">
                <v-avatar color="grey" variant="tonal" size="48">
                  <v-icon>mdi-archive</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-bold">{{ stats.archived }}</div>
                  <div class="text-caption text-grey">已归档</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- 类型筛选 -->
        <v-card elevation="1" class="mb-6">
          <v-card-text class="d-flex align-center gap-3 flex-wrap">
            <span class="text-sm font-semibold text-grey-darken-1">类型筛选：</span>
            <v-chip-group v-model="selectedType" mandatory>
              <v-chip
                v-for="type in typeFilters"
                :key="type"
                :value="type"
                filter
                variant="tonal"
              >
                {{ type }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
        </v-card>

        <!-- 配置包列表 -->
        <v-row v-if="filteredConfigs.length > 0">
          <v-col
            v-for="config in filteredConfigs"
            :key="config.id"
            cols="12"
            md="6"
          >
            <v-card elevation="1" class="h-100">
              <v-card-text class="pa-5">
                <div class="d-flex align-start gap-4">
                  <v-avatar :color="typeColor(config.type)" variant="tonal" size="52" rounded="lg">
                    <v-icon size="28">{{ typeIcon(config.type) }}</v-icon>
                  </v-avatar>
                  <div class="flex-1 overflow-hidden">
                    <div class="d-flex align-center gap-2 mb-1">
                      <span class="text-subtitle-1 font-bold">{{ config.name }}</span>
                      <v-chip :color="statusColor(config.status)" size="x-small" variant="tonal">
                        {{ statusLabel(config.status) }}
                      </v-chip>
                    </div>
                    <div class="d-flex align-center gap-2 mb-2">
                      <v-chip :color="typeColor(config.type)" size="x-small" variant="outlined">
                        {{ config.type }}
                      </v-chip>
                      <span class="text-caption text-grey">v{{ config.version }}</span>
                      <span class="text-caption text-grey">{{ config.size }}</span>
                    </div>
                    <p class="text-body-2 text-grey-darken-1 mb-3" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      {{ config.description }}
                    </p>
                    <!-- 内容统计 -->
                    <div class="d-flex gap-4 mb-3">
                      <div v-if="config.scenes > 0" class="d-flex align-center gap-1">
                        <v-icon size="14" color="teal">mdi-map-marker</v-icon>
                        <span class="text-caption">{{ config.scenes }} 场景</span>
                      </div>
                      <div v-if="config.characters > 0" class="d-flex align-center gap-1">
                        <v-icon size="14" color="purple">mdi-account</v-icon>
                        <span class="text-caption">{{ config.characters }} 人物</span>
                      </div>
                      <div v-if="config.factions > 0" class="d-flex align-center gap-1">
                        <v-icon size="14" color="orange">mdi-shield</v-icon>
                        <span class="text-caption">{{ config.factions }} 势力</span>
                      </div>
                    </div>
                    <div class="text-caption text-grey">更新于 {{ config.updatedAt }}</div>
                  </div>
                </div>
              </v-card-text>
              <v-divider />
              <v-card-actions class="px-5 py-3">
                <v-btn size="small" variant="text" prepend-icon="mdi-eye">查看</v-btn>
                <v-btn size="small" variant="text" prepend-icon="mdi-pencil">编辑</v-btn>
                <v-spacer />
                <v-btn
                  size="small"
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-download"
                  @click="exportConfig(config.id)"
                >
                  导出
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- 空状态 -->
        <v-card v-else elevation="1">
          <v-card-text class="text-center py-16">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-file-tree-outline</v-icon>
            <p class="text-h6 text-grey mb-2">暂无配置包</p>
            <p class="text-body-2 text-grey-darken-1 mb-6">
              {{ searchQuery ? '没有找到匹配的配置包' : '创建第一个配置包来管理场景、人物和势力数据' }}
            </p>
            <v-btn color="primary" variant="flat" prepend-icon="mdi-plus">
              新建配置包
            </v-btn>
          </v-card-text>
        </v-card>
      </div>
    </v-main>
  </div>
</template>
