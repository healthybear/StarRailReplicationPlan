<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 搜索
const searchQuery = ref('');

// 势力数据
interface Faction {
  id: string;
  name: string;
  description: string;
  leader: string;
  memberCount: number;
  territory: string;
  ideology: string;
  status: 'active' | 'neutral' | 'hostile';
  updatedAt: string;
}

const factions = ref<Faction[]>([
  {
    id: 'astral_express',
    name: '星穹列车',
    description: '穿梭于星海之间的列车，致力于开拓未知的世界，帮助各个星球解决危机。',
    leader: '姬子',
    memberCount: 6,
    territory: '星海',
    ideology: '开拓与探索',
    status: 'active',
    updatedAt: '2 小时前',
  },
  {
    id: 'belobog',
    name: '贝洛伯格',
    description: '雅利洛-VI 上最后的人类城市，在永冬的威胁下艰难生存。',
    leader: '布洛妮娅',
    memberCount: 15,
    territory: '雅利洛-VI',
    ideology: '守护与重建',
    status: 'active',
    updatedAt: '5 小时前',
  },
  {
    id: 'wildfire',
    name: '地火',
    description: '贝洛伯格地下城的抵抗组织，为下层区人民的生存而战。',
    leader: '奥列格',
    memberCount: 8,
    territory: '贝洛伯格地下城',
    ideology: '自由与平等',
    status: 'active',
    updatedAt: '昨天',
  },
  {
    id: 'xianzhou',
    name: '仙舟罗浮',
    description: '仙舟联盟的旗舰之一，拥有悠久的历史和强大的军事力量。',
    leader: '景元',
    memberCount: 20,
    territory: '仙舟罗浮',
    ideology: '长生与秩序',
    status: 'neutral',
    updatedAt: '3 天前',
  },
  {
    id: 'herta_station',
    name: '黑塔空间站',
    description: '由天才科学家黑塔建立的研究机构，收藏着无数珍贵的藏品。',
    leader: '黑塔',
    memberCount: 12,
    territory: '黑塔空间站',
    ideology: '知识与研究',
    status: 'neutral',
    updatedAt: '1 周前',
  },
  {
    id: 'stellaron_hunters',
    name: '星核猎手',
    description: '神秘的组织，追寻着星核的踪迹，目的不明。',
    leader: '艾丽欧',
    memberCount: 5,
    territory: '未知',
    ideology: '命运与预言',
    status: 'hostile',
    updatedAt: '2 周前',
  },
]);

// 筛选后的势力
const filteredFactions = computed(() => {
  return factions.value.filter(faction => {
    return faction.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
           faction.description.toLowerCase().includes(searchQuery.value.toLowerCase());
  });
});

// 统计数据
const stats = computed(() => ({
  total: factions.value.length,
  active: factions.value.filter(f => f.status === 'active').length,
  neutral: factions.value.filter(f => f.status === 'neutral').length,
  hostile: factions.value.filter(f => f.status === 'hostile').length,
}));

// 方法
const viewFaction = (faction: Faction) => {
  router.push({ name: 'FactionDetail', params: { factionId: faction.id } });
};

const createFaction = () => {
  router.push({ name: 'FactionDetail', params: { factionId: 'new' } });
};

const editFaction = (faction: Faction) => {
  router.push({ name: 'FactionDetail', params: { factionId: faction.id }, query: { mode: 'edit' } });
};

const deleteFaction = (faction: Faction) => {
  console.log('删除势力', faction);
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    neutral: 'info',
    hostile: 'error',
  };
  return colors[status] || 'grey';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: '友好',
    neutral: '中立',
    hostile: '敌对',
  };
  return texts[status] || status;
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, string> = {
    active: 'mdi-heart',
    neutral: 'mdi-minus-circle',
    hostile: 'mdi-alert-octagon',
  };
  return icons[status] || 'mdi-help-circle';
};
</script>

<template>
  <!-- Header -->
  <v-app-bar elevation="0" class="border-b">
    <v-app-bar-title class="text-xl font-bold">势力列表</v-app-bar-title>

    <v-divider vertical class="mx-4" />

    <v-text-field
      v-model="searchQuery"
      prepend-inner-icon="mdi-magnify"
      placeholder="搜索势力..."
      variant="solo-filled"
      flat
      density="compact"
      hide-details
      class="max-w-md"
      bg-color="grey-lighten-4"
    />

    <v-spacer />

    <v-btn
      color="primary"
      prepend-icon="mdi-plus"
      class="ml-2"
      @click="createFaction"
    >
      新建势力
    </v-btn>
  </v-app-bar>

  <!-- Content Area -->
  <div class="pa-8 bg-grey-lighten-5">
    <!-- Stats Overview -->
    <v-row class="mb-8">
      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">总势力数</p>
              <p class="text-3xl font-bold">{{ stats.total }}</p>
            </div>
            <v-avatar color="primary-lighten-4" size="48">
              <v-icon color="primary">mdi-shield</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">友好势力</p>
              <p class="text-3xl font-bold text-success">{{ stats.active }}</p>
            </div>
            <v-avatar color="success-lighten-4" size="48">
              <v-icon color="success">mdi-heart</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">中立势力</p>
              <p class="text-3xl font-bold text-info">{{ stats.neutral }}</p>
            </div>
            <v-avatar color="info-lighten-4" size="48">
              <v-icon color="info">mdi-minus-circle</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">敌对势力</p>
              <p class="text-3xl font-bold text-error">{{ stats.hostile }}</p>
            </div>
            <v-avatar color="error-lighten-4" size="48">
              <v-icon color="error">mdi-alert-octagon</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Faction Grid -->
    <v-row>
      <v-col
        v-for="faction in filteredFactions"
        :key="faction.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          elevation="1"
          class="h-full cursor-pointer transition-all hover:elevation-4"
          @click="viewFaction(faction)"
        >
          <!-- Header -->
          <div class="relative pa-6 bg-gradient-to-br from-primary-lighten-2 to-primary-darken-2">
            <div class="flex items-start justify-between">
              <v-avatar size="80" color="white" class="border-4 border-white shadow-lg">
                <v-icon size="48" color="primary">mdi-shield</v-icon>
              </v-avatar>
              <v-chip
                :color="getStatusColor(faction.status)"
                size="small"
                :prepend-icon="getStatusIcon(faction.status)"
              >
                {{ getStatusText(faction.status) }}
              </v-chip>
            </div>
          </div>

          <v-card-title class="text-lg font-bold pt-4">
            {{ faction.name }}
          </v-card-title>

          <v-card-subtitle class="text-sm">
            <div class="flex items-center gap-2">
              <v-icon size="16">mdi-account-tie</v-icon>
              <span>领袖：{{ faction.leader }}</span>
            </div>
          </v-card-subtitle>

          <v-card-text>
            <p class="text-sm text-grey-darken-1 mb-4">
              {{ faction.description.substring(0, 80) }}{{ faction.description.length > 80 ? '...' : '' }}
            </p>

            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="flex items-center gap-2">
                <v-icon size="16" color="grey">mdi-account-group</v-icon>
                <span class="text-grey-darken-1">{{ faction.memberCount }} 成员</span>
              </div>
              <div class="flex items-center gap-2">
                <v-icon size="16" color="grey">mdi-map-marker</v-icon>
                <span class="text-grey-darken-1">{{ faction.territory }}</span>
              </div>
              <div class="flex items-center gap-2 col-span-2">
                <v-icon size="16" color="grey">mdi-lightbulb</v-icon>
                <span class="text-grey-darken-1">{{ faction.ideology }}</span>
              </div>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              prepend-icon="mdi-eye"
              size="small"
              variant="tonal"
              color="primary"
              @click.stop="viewFaction(faction)"
            >
              查看
            </v-btn>
            <v-spacer />
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click.stop="editFaction(faction)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click.stop="deleteFaction(faction)"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-if="filteredFactions.length === 0" elevation="1" class="pa-12 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-shield-off
      </v-icon>
      <h3 class="text-xl font-bold mb-2">未找到势力</h3>
      <p class="text-grey-darken-1 mb-6">尝试调整搜索条件或创建新势力</p>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="createFaction">
        新建势力
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

.col-span-2 {
  grid-column: span 2 / span 2;
}

.gap-3 {
  gap: 0.75rem;
}
</style>
