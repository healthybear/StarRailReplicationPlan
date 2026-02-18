<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const characterId = computed(() => route.params.characterId as string);
const isNewCharacter = computed(() => characterId.value === 'new');
const isEditMode = ref(route.query.mode === 'edit' || isNewCharacter.value);

// 人物数据
const characterData = ref({
  id: '',
  name: '',
  faction: '',
  description: '',
  personality: {
    traits: {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5,
    },
    values: {
      selfDirection: 0.5,
      benevolence: 0.5,
      security: 0.5,
    },
  },
  initialAbilities: {
    combat: 50,
    social: 50,
    investigation: 50,
    photography: 50,
    survival: 50,
  },
  initialRelationships: {} as Record<string, {
    trust: number;
    hostility: number;
    intimacy: number;
    respect: number;
  }>,
  behaviorConfig: {
    speakingStyle: '',
    catchphrases: [] as string[],
  },
});

// 可用势力
const availableFactions = ref([
  '星穹列车',
  '贝洛伯格',
  '地火',
  '仙舟罗浮',
  '黑塔空间站',
  '匹诺康尼',
]);

// 可用人物（用于关系设置）
const availableCharacters = ref([
  { id: 'march7', name: '三月七' },
  { id: 'stelle', name: '星' },
  { id: 'danheng', name: '丹恒' },
  { id: 'welt', name: '瓦尔特' },
  { id: 'himeko', name: '姬子' },
  { id: 'bronya', name: '布洛妮娅' },
  { id: 'seele', name: '希儿' },
]);

// 新口头禅输入
const newCatchphrase = ref('');

// 新关系对象
const newRelationship = ref({
  characterId: '',
  trust: 0.5,
  hostility: 0,
  intimacy: 0.5,
  respect: 0.5,
});

// 加载人物数据
onMounted(() => {
  if (!isNewCharacter.value) {
    loadCharacterData();
  }
});

const loadCharacterData = () => {
  // TODO: 从后端加载人物数据
  if (characterId.value === 'march7') {
    characterData.value = {
      id: 'march7',
      name: '三月七',
      faction: '星穹列车',
      description: '星穹列车的成员，被发现时冰封在一块永恒冰中，失去了所有记忆。性格开朗活泼，喜欢拍照记录生活，对自己的过去充满好奇。',
      personality: {
        traits: {
          openness: 0.8,
          conscientiousness: 0.6,
          extraversion: 0.85,
          agreeableness: 0.75,
          neuroticism: 0.35,
        },
        values: {
          selfDirection: 0.7,
          benevolence: 0.8,
          security: 0.5,
        },
      },
      initialAbilities: {
        combat: 65,
        social: 80,
        investigation: 60,
        photography: 90,
        survival: 70,
      },
      initialRelationships: {
        stelle: {
          trust: 0.7,
          hostility: 0,
          intimacy: 0.6,
          respect: 0.6,
        },
        danheng: {
          trust: 0.65,
          hostility: 0,
          intimacy: 0.4,
          respect: 0.7,
        },
        welt: {
          trust: 0.6,
          hostility: 0,
          intimacy: 0.3,
          respect: 0.8,
        },
        himeko: {
          trust: 0.7,
          hostility: 0,
          intimacy: 0.5,
          respect: 0.75,
        },
      },
      behaviorConfig: {
        speakingStyle: '活泼可爱，经常使用感叹句和疑问句，喜欢用"哇"、"诶"等语气词',
        catchphrases: ['让我来拍张照！', '这个一定要记录下来！', '诶？真的吗？', '太棒了！'],
      },
    };
  }
};

// 方法
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
};

const saveCharacter = () => {
  // TODO: 保存到后端
  console.log('保存人物', characterData.value);
  isEditMode.value = false;
};

const cancelEdit = () => {
  if (isNewCharacter.value) {
    router.push({ name: 'CharacterList' });
  } else {
    loadCharacterData();
    isEditMode.value = false;
  }
};

const addCatchphrase = () => {
  if (newCatchphrase.value && !characterData.value.behaviorConfig.catchphrases.includes(newCatchphrase.value)) {
    characterData.value.behaviorConfig.catchphrases.push(newCatchphrase.value);
    newCatchphrase.value = '';
  }
};

const removeCatchphrase = (phrase: string) => {
  characterData.value.behaviorConfig.catchphrases = characterData.value.behaviorConfig.catchphrases.filter(p => p !== phrase);
};

const addRelationship = () => {
  if (newRelationship.value.characterId && !characterData.value.initialRelationships[newRelationship.value.characterId]) {
    characterData.value.initialRelationships[newRelationship.value.characterId] = {
      trust: newRelationship.value.trust,
      hostility: newRelationship.value.hostility,
      intimacy: newRelationship.value.intimacy,
      respect: newRelationship.value.respect,
    };
    newRelationship.value = {
      characterId: '',
      trust: 0.5,
      hostility: 0,
      intimacy: 0.5,
      respect: 0.5,
    };
  }
};

const removeRelationship = (charId: string) => {
  delete characterData.value.initialRelationships[charId];
};

const getCharacterName = (charId: string) => {
  return availableCharacters.value.find(c => c.id === charId)?.name || charId;
};

const getTraitLabel = (trait: string) => {
  const labels: Record<string, string> = {
    openness: '开放性',
    conscientiousness: '尽责性',
    extraversion: '外向性',
    agreeableness: '宜人性',
    neuroticism: '神经质',
  };
  return labels[trait] || trait;
};

const getValueLabel = (value: string) => {
  const labels: Record<string, string> = {
    selfDirection: '自我导向',
    benevolence: '仁慈',
    security: '安全感',
  };
  return labels[value] || value;
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
          @click="router.push({ name: 'CharacterList' })"
        />
        <div class="flex items-center gap-3 ml-4">
          <v-avatar color="primary" size="32">
            <v-icon>mdi-account</v-icon>
          </v-avatar>
          <div>
            <div class="text-lg font-bold">
              {{ isNewCharacter ? '新建人物' : characterData.name }}
            </div>
            <div v-if="!isNewCharacter" class="text-xs text-slate-500">
              人物 ID: {{ characterData.id }}
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
              @click="saveCharacter"
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
          <!-- 左侧：基本信息和性格 -->
          <v-col cols="12" md="8">
            <!-- 基本信息 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                基本信息
              </v-card-title>
              <v-card-text class="pa-6">
                <div class="space-y-6">
                  <v-text-field
                    v-model="characterData.name"
                    label="人物名称"
                    placeholder="例如：三月七"
                    variant="outlined"
                    :readonly="!isEditMode"
                    required
                  />

                  <v-select
                    v-model="characterData.faction"
                    :items="availableFactions"
                    label="所属势力"
                    variant="outlined"
                    :readonly="!isEditMode"
                  />

                  <v-textarea
                    v-model="characterData.description"
                    label="人物描述"
                    placeholder="详细描述这个人物的背景、性格和特点..."
                    variant="outlined"
                    rows="6"
                    :readonly="!isEditMode"
                  />
                </div>
              </v-card-text>
            </v-card>

            <!-- 性格特质 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                性格特质（Big Five）
              </v-card-title>
              <v-card-text class="pa-6">
                <div class="space-y-6">
                  <div
                    v-for="(value, key) in characterData.personality.traits"
                    :key="key"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <label class="text-sm font-semibold">{{ getTraitLabel(key as string) }}</label>
                      <span class="text-sm text-slate-500">{{ Math.round(value * 100) }}%</span>
                    </div>
                    <v-slider
                      v-model="characterData.personality.traits[key as keyof typeof characterData.personality.traits]"
                      :min="0"
                      :max="1"
                      :step="0.05"
                      color="primary"
                      thumb-label
                      :readonly="!isEditMode"
                    />
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- 价值观 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                价值观
              </v-card-title>
              <v-card-text class="pa-6">
                <div class="space-y-6">
                  <div
                    v-for="(value, key) in characterData.personality.values"
                    :key="key"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <label class="text-sm font-semibold">{{ getValueLabel(key as string) }}</label>
                      <span class="text-sm text-slate-500">{{ Math.round(value * 100) }}%</span>
                    </div>
                    <v-slider
                      v-model="characterData.personality.values[key as keyof typeof characterData.personality.values]"
                      :min="0"
                      :max="1"
                      :step="0.05"
                      color="primary"
                      thumb-label
                      :readonly="!isEditMode"
                    />
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- 行为配置 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                行为配置
              </v-card-title>
              <v-card-text class="pa-6">
                <div class="space-y-6">
                  <v-textarea
                    v-model="characterData.behaviorConfig.speakingStyle"
                    label="说话风格"
                    placeholder="描述这个人物的说话方式和语气..."
                    variant="outlined"
                    rows="3"
                    :readonly="!isEditMode"
                  />

                  <div>
                    <label class="text-sm font-semibold mb-2 block">口头禅</label>
                    <div class="flex flex-wrap gap-2 mb-3">
                      <v-chip
                        v-for="phrase in characterData.behaviorConfig.catchphrases"
                        :key="phrase"
                        :closable="isEditMode"
                        color="primary"
                        variant="tonal"
                        @click:close="removeCatchphrase(phrase)"
                      >
                        {{ phrase }}
                      </v-chip>
                    </div>
                    <v-text-field
                      v-if="isEditMode"
                      v-model="newCatchphrase"
                      placeholder="添加新口头禅..."
                      variant="outlined"
                      density="compact"
                      append-inner-icon="mdi-plus"
                      @click:append-inner="addCatchphrase"
                      @keydown.enter="addCatchphrase"
                    />
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- 初始关系 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                初始关系
              </v-card-title>
              <v-card-text class="pa-6">
                <div class="space-y-4">
                  <!-- 现有关系列表 -->
                  <div
                    v-for="(relationship, charId) in characterData.initialRelationships"
                    :key="charId"
                    class="pa-4 border rounded-lg"
                  >
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="font-bold">{{ getCharacterName(charId as string) }}</h4>
                      <v-btn
                        v-if="isEditMode"
                        icon="mdi-close"
                        size="x-small"
                        variant="text"
                        @click="removeRelationship(charId as string)"
                      />
                    </div>
                    <div class="space-y-3">
                      <div>
                        <div class="flex justify-between text-xs mb-1">
                          <span>信任 (Trust)</span>
                          <span>{{ Math.round(relationship.trust * 100) }}%</span>
                        </div>
                        <v-progress-linear
                          :model-value="relationship.trust * 100"
                          color="success"
                          height="6"
                        />
                      </div>
                      <div>
                        <div class="flex justify-between text-xs mb-1">
                          <span>敌对 (Hostility)</span>
                          <span>{{ Math.round(relationship.hostility * 100) }}%</span>
                        </div>
                        <v-progress-linear
                          :model-value="relationship.hostility * 100"
                          color="error"
                          height="6"
                        />
                      </div>
                      <div>
                        <div class="flex justify-between text-xs mb-1">
                          <span>亲密 (Intimacy)</span>
                          <span>{{ Math.round(relationship.intimacy * 100) }}%</span>
                        </div>
                        <v-progress-linear
                          :model-value="relationship.intimacy * 100"
                          color="pink"
                          height="6"
                        />
                      </div>
                      <div>
                        <div class="flex justify-between text-xs mb-1">
                          <span>尊重 (Respect)</span>
                          <span>{{ Math.round(relationship.respect * 100) }}%</span>
                        </div>
                        <v-progress-linear
                          :model-value="relationship.respect * 100"
                          color="info"
                          height="6"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- 添加新关系 -->
                  <div v-if="isEditMode" class="pa-4 border-2 border-dashed rounded-lg">
                    <h4 class="font-bold mb-3">添加新关系</h4>
                    <div class="space-y-3">
                      <v-select
                        v-model="newRelationship.characterId"
                        :items="availableCharacters.filter(c => c.id !== characterData.id && !characterData.initialRelationships[c.id])"
                        item-title="name"
                        item-value="id"
                        label="选择人物"
                        variant="outlined"
                        density="compact"
                      />
                      <div>
                        <div class="flex justify-between text-xs mb-1">
                          <span>信任</span>
                          <span>{{ Math.round(newRelationship.trust * 100) }}%</span>
                        </div>
                        <v-slider
                          v-model="newRelationship.trust"
                          :min="0"
                          :max="1"
                          :step="0.05"
                          color="success"
                          hide-details
                        />
                      </div>
                      <div>
                        <div class="flex justify-between text-xs mb-1">
                          <span>敌对</span>
                          <span>{{ Math.round(newRelationship.hostility * 100) }}%</span>
                        </div>
                        <v-slider
                          v-model="newRelationship.hostility"
                          :min="0"
                          :max="1"
                          :step="0.05"
                          color="error"
                          hide-details
                        />
                      </div>
                      <div>
                        <div class="flex justify-between text-xs mb-1">
                          <span>亲密</span>
                          <span>{{ Math.round(newRelationship.intimacy * 100) }}%</span>
                        </div>
                        <v-slider
                          v-model="newRelationship.intimacy"
                          :min="0"
                          :max="1"
                          :step="0.05"
                          color="pink"
                          hide-details
                        />
                      </div>
                      <div>
                        <div class="flex justify-between text-xs mb-1">
                          <span>尊重</span>
                          <span>{{ Math.round(newRelationship.respect * 100) }}%</span>
                        </div>
                        <v-slider
                          v-model="newRelationship.respect"
                          :min="0"
                          :max="1"
                          :step="0.05"
                          color="info"
                          hide-details
                        />
                      </div>
                      <v-btn
                        block
                        color="primary"
                        variant="tonal"
                        prepend-icon="mdi-plus"
                        :disabled="!newRelationship.characterId"
                        @click="addRelationship"
                      >
                        添加关系
                      </v-btn>
                    </div>
                  </div>

                  <!-- 空状态 -->
                  <div v-if="Object.keys(characterData.initialRelationships).length === 0 && !isEditMode" class="text-center text-slate-500 py-8">
                    <v-icon size="48" color="grey-lighten-1" class="mb-2">
                      mdi-account-multiple-outline
                    </v-icon>
                    <p class="text-sm">暂无初始关系</p>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 右侧：能力值和预览 -->
          <v-col cols="12" md="4">
            <!-- 人物预览 -->
            <v-card elevation="1" class="mb-6">
              <v-card-title class="text-xl font-bold border-b">
                人物预览
              </v-card-title>
              <v-card-text class="pa-0">
                <div class="relative h-64 bg-gradient-to-br from-primary-lighten-2 to-primary-darken-2">
                  <div class="absolute inset-0 flex items-center justify-center">
                    <v-avatar size="120" color="white" class="border-4 border-white shadow-lg">
                      <v-icon size="80" color="primary">mdi-account</v-icon>
                    </v-avatar>
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div class="text-white text-center">
                      <h3 class="text-xl font-bold mb-1">{{ characterData.name || '未命名' }}</h3>
                      <p class="text-sm">{{ characterData.faction || '未设置势力' }}</p>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- 能力值 -->
            <v-card elevation="1">
              <v-card-title class="text-xl font-bold border-b">
                初始能力值
              </v-card-title>
              <v-card-text class="pa-6">
                <div class="space-y-6">
                  <div
                    v-for="(value, key) in characterData.initialAbilities"
                    :key="key"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <label class="text-sm font-semibold capitalize">{{ key }}</label>
                      <span class="text-sm text-slate-500">{{ value }}</span>
                    </div>
                    <v-slider
                      v-model="characterData.initialAbilities[key as keyof typeof characterData.initialAbilities]"
                      :min="0"
                      :max="100"
                      :step="5"
                      color="primary"
                      thumb-label
                      :readonly="!isEditMode"
                    />
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-main>
  </div>
</template>

<style scoped lang="scss">
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
</style>
