<template>
  <v-app>
    <!-- Sidebar -->
    <v-navigation-drawer permanent width="256" class="border-r">
      <div class="pa-6 flex items-center gap-3">
        <v-avatar color="primary" size="36">
          <v-icon>mdi-lightning-bolt</v-icon>
        </v-avatar>
        <div>
          <h1 class="text-lg font-bold">星穹铁道</h1>
          <p class="text-xs text-grey-darken-1 uppercase font-semibold">剧情复现</p>
        </div>
      </div>

      <v-list density="compact" class="px-4">
        <v-list-item
          prepend-icon="mdi-chat-processing"
          title="会话"
          value="sessions"
          active
          class="rounded-lg mb-1"
        />
        <v-list-item
          prepend-icon="mdi-file-tree"
          title="配置包"
          value="configs"
          class="rounded-lg mb-1"
        />
        <v-list-item
          prepend-icon="mdi-bookmark-multiple"
          title="锚点"
          value="anchors"
          class="rounded-lg mb-1"
        />
        <v-list-item
          prepend-icon="mdi-chart-bar"
          title="分析"
          value="analytics"
          class="rounded-lg mb-1"
        />
      </v-list>

      <template #append>
        <div class="pa-4 border-t">
          <v-list-item
            prepend-icon="mdi-cog"
            title="设置"
            value="settings"
            class="rounded-lg mb-4"
          />
          <v-card class="pa-3 bg-grey-lighten-4" elevation="0">
            <div class="flex items-center gap-3">
              <v-avatar size="40" color="grey-lighten-2">
                <v-icon>mdi-account</v-icon>
              </v-avatar>
              <div class="flex-1 overflow-hidden">
                <p class="text-sm font-semibold truncate">管理员</p>
                <p class="text-xs text-grey-darken-1 truncate">Pro Account</p>
              </div>
            </div>
          </v-card>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <!-- Header -->
      <v-app-bar elevation="0" class="border-b">
        <v-app-bar-title class="text-xl font-bold">会话列表</v-app-bar-title>

        <v-divider vertical class="mx-4" />

        <v-text-field
          prepend-inner-icon="mdi-magnify"
          placeholder="搜索会话..."
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
          <v-badge
            color="error"
            dot
            floating
          />
        </v-btn>

        <v-btn icon variant="text">
          <v-icon>mdi-help-circle-outline</v-icon>
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          class="ml-2"
          @click="createSession"
        >
          新建会话
        </v-btn>
      </v-app-bar>

      <!-- Content Area -->
      <div class="pa-8 bg-grey-lighten-5">
        <!-- Breadcrumbs -->
        <v-breadcrumbs
          :items="breadcrumbs"
          class="pa-0 mb-6"
        >
          <template #divider>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-breadcrumbs>

        <!-- Stats Overview -->
        <v-row class="mb-8">
          <v-col cols="12" md="3">
            <v-card class="pa-4">
              <p class="text-xs font-semibold text-grey-darken-1 uppercase">总会话数</p>
              <p class="text-2xl font-bold mt-1">{{ stats.total }}</p>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="pa-4">
              <p class="text-xs font-semibold text-grey-darken-1 uppercase">活跃中</p>
              <p class="text-2xl font-bold mt-1 text-primary">{{ stats.active }}</p>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="pa-4">
              <p class="text-xs font-semibold text-grey-darken-1 uppercase">存储使用</p>
              <p class="text-2xl font-bold mt-1">{{ stats.storage }}</p>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="pa-4">
              <p class="text-xs font-semibold text-grey-darken-1 uppercase">剩余额度</p>
              <p class="text-2xl font-bold mt-1 text-success">{{ stats.credits }}</p>
            </v-card>
          </v-col>
        </v-row>

        <!-- Sessions Table -->
        <v-card>
          <v-data-table
            :headers="headers"
            :items="sessions"
            :loading="loading"
            hover
            class="elevation-0"
          >
            <template #item.name="{ item }">
              <div class="flex items-center gap-3 py-2">
                <v-avatar :color="item.iconColor" size="32" rounded="lg">
                  <v-icon :icon="item.icon" size="small" />
                </v-avatar>
                <span class="font-medium">{{ item.name }}</span>
              </div>
            </template>

            <template #item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                variant="flat"
              >
                <v-icon start size="x-small">mdi-circle</v-icon>
                {{ getStatusText(item.status) }}
              </v-chip>
            </template>

            <template #item.updatedAt="{ item }">
              <span class="text-grey-darken-1">{{ item.updatedAt }}</span>
            </template>

            <template #item.actions="{ item }">
              <div class="flex items-center gap-1">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  @click="editSession(item)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="deleteSession(item)"
                />
                <v-btn
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="text"
                />
              </div>
            </template>

            <template #bottom>
              <div class="pa-4 bg-grey-lighten-4 border-t flex items-center justify-between">
                <p class="text-sm text-grey-darken-1">
                  显示 {{ (page - 1) * itemsPerPage + 1 }} 到 {{ Math.min(page * itemsPerPage, totalItems) }} 共 {{ totalItems }} 个会话
                </p>
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(totalItems / itemsPerPage)"
                  :total-visible="5"
                  density="comfortable"
                />
              </div>
            </template>
          </v-data-table>
        </v-card>

        <!-- Footer -->
        <footer class="mt-12 flex items-center justify-center gap-8 py-6 text-sm text-grey-darken-1">
          <div class="flex items-center gap-2">
            <v-icon size="small">mdi-shield-check</v-icon>
            <span>企业级安全</span>
          </div>
          <div class="flex items-center gap-2">
            <v-icon size="small">mdi-speedometer</v-icon>
            <span>实时同步</span>
          </div>
        </footer>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Breadcrumbs
const breadcrumbs = [
  { title: '首页', disabled: false, href: '#' },
  { title: '会话列表', disabled: true },
];

// Stats
const stats = ref({
  total: 24,
  active: 3,
  storage: '1.2 GB',
  credits: '84%',
});

// Table headers
const headers = [
  { title: '会话名称', key: 'name', sortable: true },
  { title: '状态', key: 'status', sortable: true },
  { title: '最后更新', key: 'updatedAt', sortable: true },
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
];

// Sessions data
const sessions = ref([
  {
    id: '1',
    name: '雅利洛-VI 初遇',
    status: 'active',
    updatedAt: '2 小时前',
    icon: 'mdi-account-voice',
    iconColor: 'primary',
  },
  {
    id: '2',
    name: '仙舟罗浮探索',
    status: 'idle',
    updatedAt: '5 小时前',
    icon: 'mdi-file-document',
    iconColor: 'orange',
  },
  {
    id: '3',
    name: '黑塔空间站',
    status: 'running',
    updatedAt: '昨天',
    icon: 'mdi-hub',
    iconColor: 'purple',
  },
  {
    id: '4',
    name: '匹诺康尼梦境',
    status: 'active',
    updatedAt: '3 天前',
    icon: 'mdi-chart-line',
    iconColor: 'blue',
  },
]);

const loading = ref(false);
const page = ref(1);
const itemsPerPage = ref(10);
const totalItems = computed(() => sessions.value.length);

// Methods
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'primary',
    idle: 'grey',
    running: 'success',
  };
  return colors[status] || 'grey';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: '活跃',
    idle: '空闲',
    running: '运行中',
  };
  return texts[status] || status;
};

const createSession = () => {
  console.log('创建新会话');
};

const editSession = (item: any) => {
  console.log('编辑会话', item);
};

const deleteSession = (item: any) => {
  console.log('删除会话', item);
};
</script>

<style scoped lang="scss">
// 自定义样式
.v-navigation-drawer {
  border-right: 1px solid rgb(var(--v-theme-surface-variant));
}

.v-app-bar {
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
}

// 表格行悬停效果
:deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

// 操作按钮默认隐藏，悬停显示
:deep(.v-data-table__tr) {
  .v-btn {
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .v-btn {
    opacity: 1;
  }
}
</style>
