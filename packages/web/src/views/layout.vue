
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// 导航菜单项
const menuItems = [
  {
    icon: 'mdi-home',
    title: '首页',
    value: 'home',
    route: '/',
  },
  {
    icon: 'mdi-chat-processing',
    title: '会话',
    value: 'sessions',
    route: '/sessions',
  },
  {
    icon: 'mdi-map-marker',
    title: '场景',
    value: 'scenes',
    route: '/scenes',
  },
  {
    icon: 'mdi-account-group',
    title: '人物',
    value: 'characters',
    route: '/characters',
  },
  {
    icon: 'mdi-shield',
    title: '势力',
    value: 'factions',
    route: '/factions',
  },
  {
    icon: 'mdi-file-tree',
    title: '配置包',
    value: 'configs',
    route: '/configs',
  },
  {
    icon: 'mdi-bookmark-multiple',
    title: '锚点',
    value: 'anchors',
    route: '/anchors',
  },
  {
    icon: 'mdi-chart-bar',
    title: '分析',
    value: 'analytics',
    route: '/analytics',
  },
];

// 判断当前路由是否激活
const isActive = (itemRoute: string) => {
  if (itemRoute === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(itemRoute);
};
</script>

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
          v-for="item in menuItems"
          :key="item.value"
          :prepend-icon="item.icon"
          :title="item.title"
          :value="item.value"
          :active="isActive(item.route)"
          class="rounded-lg mb-1"
          @click="router.push(item.route)"
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
      <router-view />
    </v-main>
  </v-app>
</template>

<style scoped lang="scss">
.v-navigation-drawer {
  border-right: 1px solid rgb(var(--v-theme-surface-variant));
}
</style>
