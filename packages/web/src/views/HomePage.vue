<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 快捷入口数据
const quickActions = [
  {
    title: '会话管理',
    description: '查看和管理所有剧情会话',
    icon: 'mdi-chat-processing',
    color: 'primary',
    route: '/sessions',
  },
  {
    title: '场景库',
    description: '浏览和编辑场景配置',
    icon: 'mdi-map-marker',
    color: 'success',
    route: '/scenes',
  },
  {
    title: '人物档案',
    description: '管理角色信息和属性',
    icon: 'mdi-account-group',
    color: 'info',
    route: '/characters',
  },
  {
    title: '势力关系',
    description: '查看势力信息和关系网',
    icon: 'mdi-shield',
    color: 'warning',
    route: '/factions',
  },
];

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    type: 'session',
    title: '雅利洛-VI 初遇',
    action: '进入会话',
    time: '2 小时前',
    icon: 'mdi-play-circle',
    color: 'primary',
  },
  {
    id: 2,
    type: 'character',
    title: '三月七',
    action: '编辑人物',
    time: '5 小时前',
    icon: 'mdi-pencil',
    color: 'info',
  },
  {
    id: 3,
    type: 'scene',
    title: '黑塔空间站',
    action: '创建场景',
    time: '昨天',
    icon: 'mdi-plus-circle',
    color: 'success',
  },
]);

// 统计数据
const stats = ref({
  sessions: 24,
  scenes: 48,
  characters: 32,
  factions: 8,
});

const navigateTo = (route: string) => {
  router.push(route);
};
</script>

<template>
  <div class="pa-8 bg-grey-lighten-5 h-full overflow-auto">
    <!-- Welcome Section -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-2">欢迎回来</h1>
      <p class="text-lg text-grey-darken-1">星穹铁道剧情复现系统</p>
    </div>

    <!-- Stats Overview -->
    <v-row class="mb-8">
      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4 cursor-pointer hover:elevation-4 transition-all" @click="navigateTo('/sessions')">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">会话总数</p>
              <p class="text-3xl font-bold">{{ stats.sessions }}</p>
            </div>
            <v-avatar color="primary-lighten-4" size="56">
              <v-icon color="primary" size="32">mdi-chat-processing</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4 cursor-pointer hover:elevation-4 transition-all" @click="navigateTo('/scenes')">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">场景总数</p>
              <p class="text-3xl font-bold text-success">{{ stats.scenes }}</p>
            </div>
            <v-avatar color="success-lighten-4" size="56">
              <v-icon color="success" size="32">mdi-map-marker</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4 cursor-pointer hover:elevation-4 transition-all" @click="navigateTo('/characters')">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">人物总数</p>
              <p class="text-3xl font-bold text-info">{{ stats.characters }}</p>
            </div>
            <v-avatar color="info-lighten-4" size="56">
              <v-icon color="info" size="32">mdi-account-group</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4 cursor-pointer hover:elevation-4 transition-all" @click="navigateTo('/factions')">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">势力总数</p>
              <p class="text-3xl font-bold text-warning">{{ stats.factions }}</p>
            </div>
            <v-avatar color="warning-lighten-4" size="56">
              <v-icon color="warning" size="32">mdi-shield</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold mb-4">快捷入口</h2>
      <v-row>
        <v-col
          v-for="action in quickActions"
          :key="action.title"
          cols="12"
          md="6"
        >
          <v-card
            elevation="1"
            class="pa-6 cursor-pointer hover:elevation-4 transition-all"
            @click="navigateTo(action.route)"
          >
            <div class="flex items-center gap-4">
              <v-avatar :color="`${action.color}-lighten-4`" size="64">
                <v-icon :color="action.color" size="32">{{ action.icon }}</v-icon>
              </v-avatar>
              <div class="flex-1">
                <h3 class="text-lg font-bold mb-1">{{ action.title }}</h3>
                <p class="text-sm text-grey-darken-1">{{ action.description }}</p>
              </div>
              <v-icon color="grey-lighten-1">mdi-chevron-right</v-icon>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Recent Activities -->
    <div>
      <h2 class="text-2xl font-bold mb-4">最近活动</h2>
      <v-card elevation="1">
        <v-list>
          <v-list-item
            v-for="(activity, index) in recentActivities"
            :key="activity.id"
            :class="{ 'border-b': index < recentActivities.length - 1 }"
          >
            <template #prepend>
              <v-avatar :color="`${activity.color}-lighten-4`" size="40">
                <v-icon :color="activity.color" size="20">{{ activity.icon }}</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-semibold">
              {{ activity.title }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ activity.action }}
            </v-list-item-subtitle>

            <template #append>
              <span class="text-sm text-grey-darken-1">{{ activity.time }}</span>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hover\:elevation-4:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12) !important;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
