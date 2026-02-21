<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const sessionId = computed(() => route.params.sessionId as string);

interface CharacterResponse {
  characterId: string;
  characterName: string;
  avatar: string;
  color: string;
  type: 'dialogue' | 'action';
  content: string;
  action?: string;
  dialogue?: string;
  hasConflict: boolean;
  conflictWith?: string[];
}

interface ConflictResult {
  type: string;
  characterIds: string[];
  description: string;
  severity: number;
  winnerId?: string;
  strategy: string;
}

const currentNode = ref({
  id: 'node-12',
  name: '审讯室对峙',
  description: '开拓者被带到审讯室，与卡芙卡的第一次正面交锋。',
  index: 12,
});

const responses = ref<CharacterResponse[]>([
  {
    characterId: 'char-trailblazer',
    characterName: '开拓者',
    avatar: 'mdi-account-star',
    color: 'primary',
    type: 'dialogue',
    content: '你们到底想要什么？我什么都不知道。',
    dialogue: '你们到底想要什么？我什么都不知道。',
    hasConflict: false,
  },
  {
    characterId: 'char-kafka',
    characterName: '卡芙卡',
    avatar: 'mdi-account-cowboy-hat',
    color: 'purple',
    type: 'action',
    content: '占据审讯室主导权，向开拓者施压',
    action: '占据审讯室主导权，向开拓者施压',
    hasConflict: true,
    conflictWith: ['char-silverwolf'],
  },
  {
    characterId: 'char-silverwolf',
    characterName: '银狼',
    avatar: 'mdi-account-badge',
    color: 'teal',
    type: 'action',
    content: '控制审讯室信息流，监控开拓者反应',
    action: '控制审讯室信息流，监控开拓者反应',
    hasConflict: true,
    conflictWith: ['char-kafka'],
  },
]);

const conflicts = ref<ConflictResult[]>([
  {
    type: 'action_conflict',
    characterIds: ['char-kafka', 'char-silverwolf'],
    description: '卡芙卡与银狼对审讯室控制权存在行动冲突',
    severity: 0.6,
    winnerId: 'char-kafka',
    strategy: 'priority',
  },
]);

const showConflictPanel = ref(true);
const selectedStrategy = ref<'priority' | 'compromise' | 'first_wins' | 'random'>('priority');

const strategyOptions = [
  { value: 'priority', label: '优先级', icon: 'mdi-trophy', color: 'amber' },
  { value: 'compromise', label: '折中', icon: 'mdi-handshake', color: 'teal' },
  { value: 'first_wins', label: '先到先得', icon: 'mdi-flag-checkered', color: 'blue' },
  { value: 'random', label: '随机', icon: 'mdi-dice-multiple', color: 'purple' },
];

const conflictCount = computed(() => conflicts.value.length);

const getCharacterById = (id: string) =>
  responses.value.find(r => r.characterId === id);

const goBack = () => {
  router.push({ name: 'StoryAdvance', params: { sessionId: sessionId.value } });
};

const reArbitrate = () => {
  // TODO: 调用 ConflictArbitrator.resolveAll
  console.log('重新裁决，策略:', selectedStrategy.value);
};
</script>

<template>
  <div class="bg-grey-lighten-5 min-h-screen">
    <v-app-bar elevation="0" class="border-b">
      <template #prepend>
        <v-btn icon @click="goBack">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </template>
      <v-app-bar-title>
        <div class="flex items-center gap-2">
          <v-icon color="primary">mdi-account-group</v-icon>
          <span class="font-bold">多角色视图</span>
          <v-chip size="x-small" variant="tonal" color="grey" class="ml-1">
            节点 #{{ currentNode.index }}
          </v-chip>
        </div>
      </v-app-bar-title>
      <template #append>
        <div class="flex gap-2 mr-4">
          <v-badge
            v-if="conflictCount > 0"
            :content="conflictCount"
            color="error"
          >
            <v-btn
              variant="tonal"
              :color="showConflictPanel ? 'error' : 'default'"
              prepend-icon="mdi-alert-circle"
              @click="showConflictPanel = !showConflictPanel"
            >
              冲突
            </v-btn>
          </v-badge>
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <div class="pa-6">
        <!-- 节点信息 -->
        <v-card elevation="1" class="mb-6">
          <v-card-text class="d-flex align-center gap-4 pa-4">
            <v-avatar color="primary" variant="tonal" size="44" rounded="lg">
              <v-icon>mdi-map-marker</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-bold">{{ currentNode.name }}</div>
              <div class="text-body-2 text-grey-darken-1">{{ currentNode.description }}</div>
            </div>
          </v-card-text>
        </v-card>

        <v-row>
          <!-- 角色响应面板 -->
          <v-col :cols="showConflictPanel && conflictCount > 0 ? 8 : 12">
            <div class="text-subtitle-2 font-semibold text-grey-darken-2 mb-3 d-flex align-center gap-2">
              <v-icon size="16">mdi-account-multiple</v-icon>
              角色响应（{{ responses.length }} 个角色）
            </div>
            <v-row>
              <v-col
                v-for="resp in responses"
                :key="resp.characterId"
                cols="12"
                md="6"
              >
                <v-card
                  elevation="1"
                  :class="resp.hasConflict ? 'border-2 border-error' : ''"
                >
                  <v-card-text class="pa-4">
                    <!-- 角色头部 -->
                    <div class="d-flex align-center gap-3 mb-3">
                      <v-avatar :color="resp.color" variant="tonal" size="40">
                        <v-icon>{{ resp.avatar }}</v-icon>
                      </v-avatar>
                      <div class="flex-1">
                        <div class="text-subtitle-2 font-bold">{{ resp.characterName }}</div>
                        <v-chip
                          :color="resp.type === 'action' ? 'orange' : 'blue'"
                          size="x-small"
                          variant="tonal"
                        >
                          {{ resp.type === 'action' ? '行动' : '对话' }}
                        </v-chip>
                      </div>
                      <v-icon v-if="resp.hasConflict" color="error" size="20">
                        mdi-alert-circle
                      </v-icon>
                    </div>

                    <!-- 响应内容 -->
                    <v-card
                      :color="resp.type === 'action' ? 'orange-lighten-5' : 'blue-lighten-5'"
                      flat
                      class="pa-3 rounded-lg"
                    >
                      <div class="d-flex align-start gap-2">
                        <v-icon
                          :color="resp.type === 'action' ? 'orange-darken-2' : 'blue-darken-2'"
                          size="16"
                          class="mt-0.5"
                        >
                          {{ resp.type === 'action' ? 'mdi-run' : 'mdi-chat' }}
                        </v-icon>
                        <p class="text-body-2 text-grey-darken-2 ma-0">{{ resp.content }}</p>
                      </div>
                    </v-card>

                    <!-- 冲突提示 -->
                    <div v-if="resp.hasConflict && resp.conflictWith" class="mt-2">
                      <v-chip
                        v-for="cid in resp.conflictWith"
                        :key="cid"
                        size="x-small"
                        color="error"
                        variant="tonal"
                        prepend-icon="mdi-sword-cross"
                      >
                        与 {{ getCharacterById(cid)?.characterName ?? cid }} 冲突
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-col>

          <!-- 冲突裁决面板 -->
          <v-col v-if="showConflictPanel && conflictCount > 0" cols="4">
            <div class="text-subtitle-2 font-semibold text-grey-darken-2 mb-3 d-flex align-center gap-2">
              <v-icon size="16" color="error">mdi-alert-circle</v-icon>
              冲突裁决（{{ conflictCount }} 个）
            </div>

            <!-- 策略选择 -->
            <v-card elevation="1" class="mb-4">
              <v-card-text class="pa-4">
                <div class="text-caption text-grey mb-2">裁决策略</div>
                <v-chip-group v-model="selectedStrategy" mandatory>
                  <v-chip
                    v-for="opt in strategyOptions"
                    :key="opt.value"
                    :value="opt.value"
                    :color="opt.color"
                    filter
                    variant="tonal"
                    size="small"
                  >
                    <v-icon start size="14">{{ opt.icon }}</v-icon>
                    {{ opt.label }}
                  </v-chip>
                </v-chip-group>
                <v-btn
                  block
                  variant="tonal"
                  color="primary"
                  class="mt-3"
                  prepend-icon="mdi-gavel"
                  @click="reArbitrate"
                >
                  重新裁决
                </v-btn>
              </v-card-text>
            </v-card>

            <!-- 冲突列表 -->
            <div class="d-flex flex-column gap-3">
              <v-card
                v-for="(conflict, idx) in conflicts"
                :key="idx"
                elevation="1"
              >
                <v-card-text class="pa-4">
                  <div class="d-flex align-center gap-2 mb-2">
                    <v-icon color="error" size="16">mdi-sword-cross</v-icon>
                    <span class="text-caption font-semibold text-error">行动冲突</span>
                    <v-spacer />
                    <v-chip size="x-small" :color="conflict.severity > 0.7 ? 'error' : 'warning'" variant="tonal">
                      严重度 {{ Math.round(conflict.severity * 100) }}%
                    </v-chip>
                  </div>

                  <p class="text-caption text-grey-darken-1 mb-3">{{ conflict.description }}</p>

                  <!-- 冲突角色 -->
                  <div class="d-flex gap-1 flex-wrap mb-3">
                    <v-chip
                      v-for="cid in conflict.characterIds"
                      :key="cid"
                      size="x-small"
                      :color="conflict.winnerId === cid ? 'success' : 'error'"
                      variant="tonal"
                    >
                      <v-icon start size="10">
                        {{ conflict.winnerId === cid ? 'mdi-trophy' : 'mdi-close' }}
                      </v-icon>
                      {{ getCharacterById(cid)?.characterName ?? cid }}
                    </v-chip>
                  </div>

                  <!-- 裁决结果 -->
                  <div v-if="conflict.winnerId" class="d-flex align-center gap-2">
                    <v-icon color="success" size="14">mdi-check-circle</v-icon>
                    <span class="text-caption text-success">
                      {{ getCharacterById(conflict.winnerId)?.characterName }} 获胜
                    </span>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-main>
  </div>
</template>
