<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const searchQuery = ref('');
const selectedSession = ref('全部');

const sessionFilters = ['全部', '会话-001', '会话-002', '会话-003'];

const anchors = ref([
  {
    id: 'anchor-001',
    name: '开场对话锚点',
    sessionId: '会话-001',
    sessionName: '贝洛伯格初遇',
    nodeIndex: 3,
    description: '开拓者与布洛妮娅初次见面的关键节点，记录了双方的第一印象和初始状态。',
    characters: ['开拓者', '布洛妮娅'],
    createdAt: '2026-02-18 14:32',
    comparedCount: 2,
    tags: ['初遇', '关键节点'],
  },
  {
    id: 'anchor-002',
    name: '审讯室对峙',
    sessionId: '会话-001',
    sessionName: '贝洛伯格初遇',
    nodeIndex: 12,
    description: '开拓者被带到审讯室，与卡芙卡的第一次正面交锋，双方信息不对等状态的典型节点。',
    characters: ['开拓者', '卡芙卡', '银狼'],
    createdAt: '2026-02-18 15:10',
    comparedCount: 1,
    tags: ['对峙', '信息隔离'],
  },
  {
    id: 'anchor-003',
    name: '地下城入口',
    sessionId: '会话-002',
    sessionName: '永冬之下',
    nodeIndex: 7,
    description: '队伍进入贝洛伯格地下城前的状态快照，记录了各角色的心理状态和已知信息。',
    characters: ['开拓者', '希儿', '娜塔莎'],
    createdAt: '2026-02-17 20:05',
    comparedCount: 3,
    tags: ['转折点', '地下城'],
  },
  {
    id: 'anchor-004',
    name: '真相揭露前',
    sessionId: '会话-003',
    sessionName: '星核危机',
    nodeIndex: 21,
    description: '星核真相即将揭露前的关键锚点，用于对比揭露前后各角色的认知变化。',
    characters: ['开拓者', '杰帕德', '桑博'],
    createdAt: '2026-02-16 11:30',
    comparedCount: 0,
    tags: ['真相', '高潮'],
  },
]);

const filteredAnchors = computed(() => {
  return anchors.value.filter(a => {
    const matchSession =
      selectedSession.value === '全部' || a.sessionName === selectedSession.value;
    const matchSearch =
      !searchQuery.value ||
      a.name.includes(searchQuery.value) ||
      a.description.includes(searchQuery.value);
    return matchSession && matchSearch;
  });
});

const stats = computed(() => ({
  total: anchors.value.length,
  sessions: new Set(anchors.value.map(a => a.sessionId)).size,
  compared: anchors.value.filter(a => a.comparedCount > 0).length,
  totalComparisons: anchors.value.reduce((sum, a) => sum + a.comparedCount, 0),
}));

const compareAnchor = (id: string) => {
  console.log('对比锚点', id);
};

const deleteAnchor = (id: string) => {
  anchors.value = anchors.value.filter(a => a.id !== id);
};
</script>

<template>
  <div class="bg-grey-lighten-5 min-h-screen">
    <!-- 顶部应用栏 -->
    <v-app-bar elevation="0" class="border-b">
      <v-app-bar-title>
        <div class="flex items-center gap-2">
          <v-icon color="primary">mdi-bookmark-multiple</v-icon>
          <span class="font-bold">锚点管理</span>
        </div>
      </v-app-bar-title>
      <template #append>
        <div class="flex gap-2 mr-4">
          <v-text-field
            v-model="searchQuery"
            placeholder="搜索锚点..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            style="width: 220px"
          />
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <div class="pa-6">
        <!-- 面包屑 -->
        <v-breadcrumbs
          :items="[{ title: '首页', href: '/' }, { title: '锚点' }]"
          class="pa-0 mb-6"
        />

        <!-- 统计卡片 -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1">
              <v-card-text class="d-flex align-center gap-4">
                <v-avatar color="primary" variant="tonal" size="48">
                  <v-icon>mdi-bookmark-multiple</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-bold">{{ stats.total }}</div>
                  <div class="text-caption text-grey">锚点总数</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1">
              <v-card-text class="d-flex align-center gap-4">
                <v-avatar color="teal" variant="tonal" size="48">
                  <v-icon>mdi-chat-processing</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-bold">{{ stats.sessions }}</div>
                  <div class="text-caption text-grey">涉及会话</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1">
              <v-card-text class="d-flex align-center gap-4">
                <v-avatar color="purple" variant="tonal" size="48">
                  <v-icon>mdi-compare</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-bold">{{ stats.compared }}</div>
                  <div class="text-caption text-grey">已对比锚点</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="1">
              <v-card-text class="d-flex align-center gap-4">
                <v-avatar color="orange" variant="tonal" size="48">
                  <v-icon>mdi-chart-bar</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-bold">{{ stats.totalComparisons }}</div>
                  <div class="text-caption text-grey">对比次数</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- 会话筛选 -->
        <v-card elevation="1" class="mb-6">
          <v-card-text class="d-flex align-center gap-3 flex-wrap">
            <span class="text-sm font-semibold text-grey-darken-1">会话筛选：</span>
            <v-chip-group v-model="selectedSession" mandatory>
              <v-chip
                v-for="s in sessionFilters"
                :key="s"
                :value="s"
                filter
                variant="tonal"
              >
                {{ s }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
        </v-card>

        <!-- 锚点列表 -->
        <v-row v-if="filteredAnchors.length > 0">
          <v-col
            v-for="anchor in filteredAnchors"
            :key="anchor.id"
            cols="12"
            md="6"
          >
            <v-card elevation="1" class="h-100">
              <v-card-text class="pa-5">
                <!-- 标题行 -->
                <div class="d-flex align-start justify-space-between mb-3">
                  <div class="d-flex align-center gap-3">
                    <v-avatar color="primary" variant="tonal" size="44" rounded="lg">
                      <v-icon>mdi-bookmark</v-icon>
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-1 font-bold">{{ anchor.name }}</div>
                      <div class="d-flex align-center gap-1 text-caption text-grey">
                        <v-icon size="12">mdi-chat-processing</v-icon>
                        {{ anchor.sessionName }}
                        <span class="mx-1">·</span>
                        节点 #{{ anchor.nodeIndex }}
                      </div>
                    </div>
                  </div>
                  <v-chip
                    v-if="anchor.comparedCount > 0"
                    color="purple"
                    size="x-small"
                    variant="tonal"
                  >
                    已对比 {{ anchor.comparedCount }} 次
                  </v-chip>
                </div>

                <!-- 描述 -->
                <p class="text-body-2 text-grey-darken-1 mb-3" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  {{ anchor.description }}
                </p>

                <!-- 涉及角色 -->
                <div class="d-flex align-center gap-2 mb-3">
                  <v-icon size="14" color="grey">mdi-account-multiple</v-icon>
                  <div class="d-flex gap-1 flex-wrap">
                    <v-chip
                      v-for="char in anchor.characters"
                      :key="char"
                      size="x-small"
                      variant="outlined"
                    >
                      {{ char }}
                    </v-chip>
                  </div>
                </div>

                <!-- 标签和时间 -->
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex gap-1">
                    <v-chip
                      v-for="tag in anchor.tags"
                      :key="tag"
                      size="x-small"
                      color="primary"
                      variant="tonal"
                    >
                      {{ tag }}
                    </v-chip>
                  </div>
                  <span class="text-caption text-grey">{{ anchor.createdAt }}</span>
                </div>
              </v-card-text>
              <v-divider />
              <v-card-actions class="px-5 py-3">
                <v-btn size="small" variant="text" prepend-icon="mdi-eye">查看详情</v-btn>
                <v-spacer />
                <v-btn
                  size="small"
                  variant="tonal"
                  color="purple"
                  prepend-icon="mdi-compare"
                  @click="compareAnchor(anchor.id)"
                >
                  对比分析
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  icon="mdi-delete-outline"
                  @click="deleteAnchor(anchor.id)"
                />
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- 空状态 -->
        <v-card v-else elevation="1">
          <v-card-text class="text-center py-16">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-bookmark-off-outline</v-icon>
            <p class="text-h6 text-grey mb-2">暂无锚点</p>
            <p class="text-body-2 text-grey-darken-1">
              {{ searchQuery ? '没有找到匹配的锚点' : '在会话推进过程中标记关键节点，即可在此查看和对比' }}
            </p>
          </v-card-text>
        </v-card>
      </div>
    </v-main>
  </div>
</template>
