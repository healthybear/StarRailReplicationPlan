<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const factionId = computed(() => route.params.factionId as string);
const isNewFaction = computed(() => factionId.value === 'new');
const isEditMode = ref(route.query.mode === 'edit' || isNewFaction.value);

// 势力数据
const factionData = ref({
  id: '',
  name: '',
  leader: '',
  description: '',
  territory: '',
  ideology: '',
  status: 'neutral' as 'active' | 'neutral' | 'hostile',
  members: [] as string[],
  allies: [] as string[],
  enemies: [] as string[],
  history: '',
  goals: [] as string[],
});

// 可用人物
const availableCharacters = ref([
  { id: 'march7', name: '三月七' },
  { id: 'stelle', name: '星' },
  { id: 'danheng', name: '丹恒' },
  { id: 'bronya', name: '布洛妮娅' },
  { id: 'seele', name: '希儿' },
]);

// 可用势力
const availableFactions = ref([
  { id: 'astral_express', name: '星穹列车' },
  { id: 'belobog', name: '贝洛伯格' },
  { id: 'wildfire', name: '地火' },
  { id: 'xianzhou', name: '仙舟罗浮' },
  { id: 'herta_station', name: '黑塔空间站' },
]);

// 状态选项
const statusOptions = [
  { value: 'active', title: '友好', icon: 'mdi-heart', color: 'success' },
  { value: 'neutral', title: '中立', icon: 'mdi-minus-circle', color: 'info' },
  { value: 'hostile', title: '敌对', icon: 'mdi-alert-octagon', color: 'error' },
];

// 新目标输入
const newGoal = ref('');

// 加载势力数据
onMounted(() => {
  if (!isNewFaction.value) {
    loadFactionData();
  }
});

const loadFactionData = () => {
  // TODO: 从后端加载势力数据
  if (factionId.value === 'astral_express') {
    factionData.value = {
      id: 'astral_express',
      name: '星穹列车',
      leader: '姬子',
      description: '穿梭于星海之间的列车，致力于开拓未知的世界，帮助各个星球解决危机。列车上的每一位成员都是勇敢的开拓者。',
      territory: '星海',
      ideology: '开拓与探索',
      status: 'active',
      members: ['march7', 'stelle', 'danheng'],
      allies: ['belobog', 'xianzhou'],
      enemies: [],
      history: '星穹列车是一个古老而神秘的组织，它的历史可以追溯到很久以前。列车在星海中穿梭，寻找需要帮助的世界。',
      goals: ['探索未知星球', '帮助各个世界解决危机', '寻找星核的秘密'],
    };
  }
};

// 方法
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
};

const saveFaction = () => {
  // TODO: 保存到后端
  console.log('保存势力', factionData.value);
  isEditMode.value = false;
};

const cancelEdit = () => {
  if (isNewFaction.value) {
    router.push({ name: 'FactionList' });
  } else {
    loadFactionData();
    isEditMode.value = false;
  }
};

const addGoal = () => {
  if (newGoal.value && !factionData.value.goals.includes(newGoal.value)) {
    factionData.value.goals.push(newGoal.value);
    newGoal.value = '';
  }
};

const removeGoal = (goal: string) => {
  factionData.value.goals = factionData.value.goals.filter(g => g !== goal);
};

const getStatusInfo = (status: string) => {
  return statusOptions.find(s => s.value === status) || statusOptions[1];
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
          @click="router.push({ name: 'FactionList' })"
        />
        <div class="flex items-center gap-3 ml-4">
          <v-avatar color="primary" size="32">
            <v-icon>mdi-shield</v-icon>
          </v-avatar>
          <div>
            <div class="text-lg font-bold">
              {{ isNewFaction ? '新建势力' : factionData.name }}
            </div>
            <div v-if="!isNewFaction" class="text-xs text-slate-500">
              势力 ID: {{ factionData.id }}
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
              @click="saveFaction"
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
          <!-- 左侧：基本信息和关系 -->
          <v-col cols="12" md="8">
            <!-- 基本信息 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                基本信息
              </v-card-title>
              <v-card-text class="pa-6">
                <div class="space-y-6">
                  <v-text-field
                    v-model="factionData.name"
                    label="势力名称"
                    placeholder="例如：星穹列车"
                    variant="outlined"
                    :readonly="!isEditMode"
                    required
                  />

                  <v-text-field
                    v-model="factionData.leader"
                    label="领袖"
                    placeholder="例如：姬子"
                    variant="outlined"
                    :readonly="!isEditMode"
                  />

                  <v-textarea
                    v-model="factionData.description"
                    label="势力描述"
                    placeholder="详细描述这个势力的背景、目标和特点..."
                    variant="outlined"
                    rows="4"
                    :readonly="!isEditMode"
                  />

                  <v-text-field
                    v-model="factionData.territory"
                    label="领地/活动范围"
                    placeholder="例如：星海"
                    variant="outlined"
                    :readonly="!isEditMode"
                  />

                  <v-text-field
                    v-model="factionData.ideology"
                    label="理念/信条"
                    placeholder="例如：开拓与探索"
                    variant="outlined"
                    :readonly="!isEditMode"
                  />

                  <div>
                    <label class="text-sm font-semibold mb-2 block">关系状态</label>
                    <v-select
                      v-model="factionData.status"
                      :items="statusOptions"
                      variant="outlined"
                      :readonly="!isEditMode"
                    >
                      <template #selection="{ item }">
                        <div class="flex items-center gap-2">
                          <v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>
                          <span>{{ item.raw.title }}</span>
                        </div>
                      </template>
                      <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                          <template #prepend>
                            <v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>
                          </template>
                        </v-list-item>
                      </template>
                    </v-select>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- 历史背景 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                历史背景
              </v-card-title>
              <v-card-text class="pa-6">
                <v-textarea
                  v-model="factionData.history"
                  placeholder="描述这个势力的历史和发展..."
                  variant="outlined"
                  rows="6"
                  :readonly="!isEditMode"
                />
              </v-card-text>
            </v-card>

            <!-- 目标 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                势力目标
              </v-card-title>
              <v-card-text class="pa-6">
                <div class="space-y-3">
                  <v-list v-if="factionData.goals.length > 0" density="compact">
                    <v-list-item
                      v-for="(goal, index) in factionData.goals"
                      :key="index"
                      :title="goal"
                      prepend-icon="mdi-target"
                    >
                      <template v-if="isEditMode" #append>
                        <v-btn
                          icon="mdi-close"
                          size="x-small"
                          variant="text"
                          @click="removeGoal(goal)"
                        />
                      </template>
                    </v-list-item>
                  </v-list>
                  <div v-else class="text-center text-slate-500 py-4">
                    <v-icon size="48" color="grey-lighten-1" class="mb-2">
                      mdi-target-variant
                    </v-icon>
                    <p class="text-sm">暂无目标</p>
                  </div>
                  <v-text-field
                    v-if="isEditMode"
                    v-model="newGoal"
                    placeholder="添加新目标..."
                    variant="outlined"
                    density="compact"
                    append-inner-icon="mdi-plus"
                    @click:append-inner="addGoal"
                    @keydown.enter="addGoal"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 右侧：成员和关系 -->
          <v-col cols="12" md="4">
            <!-- 势力预览 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                势力预览
              </v-card-title>
              <v-card-text class="pa-0">
                <div class="relative h-64 bg-gradient-to-br from-primary-lighten-2 to-primary-darken-2">
                  <div class="absolute inset-0 flex items-center justify-center">
                    <v-avatar size="120" color="white" class="border-4 border-white shadow-lg">
                      <v-icon size="80" color="primary">mdi-shield</v-icon>
                    </v-avatar>
                  </div>
                  <div class="absolute top-4 right-4">
                    <v-chip
                      :color="getStatusInfo(factionData.status).color"
                      :prepend-icon="getStatusInfo(factionData.status).icon"
                    >
                      {{ getStatusInfo(factionData.status).title }}
                    </v-chip>
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div class="text-white text-center">
                      <h3 class="text-xl font-bold mb-1">{{ factionData.name || '未命名' }}</h3>
                      <p class="text-sm">{{ factionData.leader ? `领袖：${factionData.leader}` : '未设置领袖' }}</p>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- 成员 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                成员
              </v-card-title>
              <v-card-text class="pa-6">
                <v-select
                  v-if="isEditMode"
                  v-model="factionData.members"
                  :items="availableCharacters"
                  item-title="name"
                  item-value="id"
                  label="选择成员"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                />
                <v-list v-else density="compact">
                  <v-list-item
                    v-for="memberId in factionData.members"
                    :key="memberId"
                    :title="availableCharacters.find(c => c.id === memberId)?.name || memberId"
                    prepend-icon="mdi-account"
                  />
                  <v-list-item v-if="factionData.members.length === 0">
                    <div class="text-center text-slate-500 py-4">
                      <v-icon size="48" color="grey-lighten-1" class="mb-2">
                        mdi-account-off
                      </v-icon>
                      <p class="text-sm">暂无成员</p>
                    </div>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- 盟友 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                盟友
              </v-card-title>
              <v-card-text class="pa-6">
                <v-select
                  v-if="isEditMode"
                  v-model="factionData.allies"
                  :items="availableFactions.filter(f => f.id !== factionData.id)"
                  item-title="name"
                  item-value="id"
                  label="选择盟友"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                />
                <v-list v-else density="compact">
                  <v-list-item
                    v-for="allyId in factionData.allies"
                    :key="allyId"
                    :title="availableFactions.find(f => f.id === allyId)?.name || allyId"
                    prepend-icon="mdi-handshake"
                  />
                  <v-list-item v-if="factionData.allies.length === 0">
                    <div class="text-center text-slate-500 py-4">
                      <p class="text-sm">暂无盟友</p>
                    </div>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- 敌对势力 -->
            <v-card elevation="1">
              <v-card-title class="text-xl font-bold border-b">
                敌对势力
              </v-card-title>
              <v-card-text class="pa-6">
                <v-select
                  v-if="isEditMode"
                  v-model="factionData.enemies"
                  :items="availableFactions.filter(f => f.id !== factionData.id)"
                  item-title="name"
                  item-value="id"
                  label="选择敌对势力"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                />
                <v-list v-else density="compact">
                  <v-list-item
                    v-for="enemyId in factionData.enemies"
                    :key="enemyId"
                    :title="availableFactions.find(f => f.id === enemyId)?.name || enemyId"
                    prepend-icon="mdi-sword-cross"
                  />
                  <v-list-item v-if="factionData.enemies.length === 0">
                    <div class="text-center text-slate-500 py-4">
                      <p class="text-sm">暂无敌对势力</p>
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
.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}
</style>
