<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { sessionApi, characterApi, sceneApi, type Character, type Scene } from '@/api';

const router = useRouter();

// 步骤控制
const currentStep = ref(1);
const totalSteps = 3;

// 步骤 1: 基本信息
const sessionName = ref('');
const sessionDescription = ref('');

// 步骤 2: 选择场景和角色
const selectedSceneId = ref('');
const selectedCharacterIds = ref<string[]>([]);
const scenes = ref<Scene[]>([]);
const characters = ref<Character[]>([]);
const loadingScenes = ref(false);
const loadingCharacters = ref(false);

// 步骤 3: 审核
const isCreating = ref(false);
const error = ref<string>('');

// Load data
const loadScenes = async () => {
  try {
    loadingScenes.value = true;
    const data = await sceneApi.getAll();
    scenes.value = data;
  } catch (e: any) {
    error.value = `加载场景列表失败: ${e.message}`;
  } finally {
    loadingScenes.value = false;
  }
};

const loadCharacters = async () => {
  try {
    loadingCharacters.value = true;
    const data = await characterApi.getAll();
    characters.value = data;
  } catch (e: any) {
    error.value = `加载人物列表失败: ${e.message}`;
  } finally {
    loadingCharacters.value = false;
  }
};

// 计算属性
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return sessionName.value.trim().length > 0;
    case 2:
      return selectedSceneId.value && selectedCharacterIds.value.length > 0;
    case 3:
      return true;
    default:
      return false;
  }
});

const selectedScene = computed(() => {
  return scenes.value.find(s => s.sceneId === selectedSceneId.value);
});

const selectedCharacters = computed(() => {
  return characters.value.filter(c => selectedCharacterIds.value.includes(c.characterId));
});

// 方法
const nextStep = () => {
  if (currentStep.value < totalSteps && canProceed.value) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const toggleCharacter = (characterId: string) => {
  const index = selectedCharacterIds.value.indexOf(characterId);
  if (index > -1) {
    selectedCharacterIds.value.splice(index, 1);
  } else {
    selectedCharacterIds.value.push(characterId);
  }
};

const createSession = async () => {
  try {
    isCreating.value = true;
    error.value = '';

    await sessionApi.create({
      sessionName: sessionName.value,
      sceneId: selectedSceneId.value,
      characterIds: selectedCharacterIds.value,
    });

    router.push({ name: 'SessionList' });
  } catch (e: any) {
    error.value = `创建会话失败: ${e.message}`;
    isCreating.value = false;
  }
};

const getStepIcon = (step: number) => {
  const icons = ['mdi-information', 'mdi-account-group', 'mdi-eye'];
  return icons[step - 1];
};

const getStepTitle = (step: number) => {
  const titles = ['基本信息', '选择场景和角色', '审核确认'];
  return titles[step - 1];
};

const getStepStatus = (step: number) => {
  if (step < currentStep.value) return 'completed';
  if (step === currentStep.value) return 'active';
  return 'pending';
};

onMounted(() => {
  loadScenes();
  loadCharacters();
});
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
    <!-- 顶部导航栏 -->
    <v-app-bar elevation="0" class="border-b border-slate-200 dark:border-slate-800">
      <template #prepend>
        <div class="flex items-center gap-3 ml-4">
          <v-avatar color="primary" size="32">
            <v-icon>mdi-robot</v-icon>
          </v-avatar>
          <h2 class="text-lg font-bold">星穹铁道剧情复现</h2>
        </div>
      </template>

      <v-spacer />

      <div class="flex items-center gap-6 mr-4 text-sm">
        <a href="#" class="hover:text-primary transition-colors">仪表盘</a>
        <a href="#" class="hover:text-primary transition-colors">工作流</a>
        <a href="#" class="hover:text-primary transition-colors">模板</a>
        <a href="#" class="hover:text-primary transition-colors">历史</a>
      </div>

      <v-avatar size="40" class="mr-4">
        <v-icon>mdi-account</v-icon>
      </v-avatar>
    </v-app-bar>

    <!-- 主内容区 -->
    <v-main class="flex-1 overflow-y-auto">
      <div class="max-w-5xl mx-auto py-10 px-4">
        <v-card elevation="1" class="pa-8">
          <!-- 步骤指示器 -->
          <div class="grid grid-cols-3 gap-4 mb-10">
            <div
              v-for="step in totalSteps"
              :key="step"
              class="flex items-center gap-3"
              :class="{ 'opacity-50': getStepStatus(step) === 'pending' }"
            >
              <div class="flex flex-col items-center">
                <v-avatar
                  :color="
                    getStepStatus(step) === 'completed'
                      ? 'success'
                      : getStepStatus(step) === 'active'
                      ? 'primary'
                      : 'grey-lighten-2'
                  "
                  size="32"
                  :class="{ 'ring-4 ring-primary/20': getStepStatus(step) === 'active' }"
                >
                  <v-icon
                    :color="getStepStatus(step) === 'pending' ? 'grey-darken-1' : 'white'"
                    size="20"
                  >
                    {{ getStepStatus(step) === 'completed' ? 'mdi-check' : getStepIcon(step) }}
                  </v-icon>
                </v-avatar>
              </div>
              <div class="flex flex-col">
                <span
                  class="text-xs font-bold uppercase tracking-wider"
                  :class="
                    getStepStatus(step) === 'active'
                      ? 'text-primary'
                      : 'text-slate-500'
                  "
                >
                  步骤 {{ step }}
                </span>
                <span class="text-sm font-semibold">{{ getStepTitle(step) }}</span>
              </div>
            </div>
          </div>

          <!-- 步骤 1: 基本信息 -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold mb-2">基本信息</h1>
              <p class="text-slate-600">为您的剧情复现会话设置名称和描述</p>
            </div>

            <v-text-field
              v-model="sessionName"
              label="会话名称"
              placeholder="例如：雅利洛-VI 初遇"
              variant="outlined"
              required
              :rules="[(v) => !!v || '会话名称不能为空']"
            />

            <v-textarea
              v-model="sessionDescription"
              label="会话描述（可选）"
              placeholder="简要描述这个会话的目的和内容..."
              variant="outlined"
              rows="4"
            />
          </div>

          <!-- 步骤 2: 选择场景和角色 -->
          <div v-if="currentStep === 2" class="space-y-8">
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold mb-2">选择场景和角色</h1>
              <p class="text-slate-600">为您的会话选择场景和参与的角色</p>
            </div>

            <!-- 场景选择 -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-3">选择场景</label>
              <v-progress-linear v-if="loadingScenes" indeterminate color="primary" class="mb-4" />
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <v-card
                  v-for="scene in scenes"
                  :key="scene.sceneId"
                  :class="[
                    'cursor-pointer transition-all',
                    selectedSceneId === scene.sceneId
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50',
                  ]"
                  elevation="1"
                  @click="selectedSceneId = scene.sceneId"
                >
                  <v-card-text class="pa-5">
                    <div class="flex items-start justify-between mb-4">
                      <v-avatar color="primary-lighten-4" size="48">
                        <v-icon color="primary">mdi-map-marker</v-icon>
                      </v-avatar>
                      <v-icon
                        v-if="selectedSceneId === scene.sceneId"
                        color="primary"
                        size="24"
                      >
                        mdi-check-circle
                      </v-icon>
                    </div>
                    <h4 class="font-bold mb-2">{{ scene.name }}</h4>
                    <p class="text-xs text-slate-500 leading-relaxed">
                      {{ scene.description }}
                    </p>
                  </v-card-text>
                </v-card>
              </div>
            </div>

            <!-- 角色选择 -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-3">选择角色（可多选）</label>
              <v-progress-linear v-if="loadingCharacters" indeterminate color="primary" class="mb-4" />
              <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <v-card
                  v-for="character in characters"
                  :key="character.characterId"
                  :class="[
                    'cursor-pointer transition-all',
                    selectedCharacterIds.includes(character.characterId)
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50',
                  ]"
                  elevation="1"
                  @click="toggleCharacter(character.characterId)"
                >
                  <v-card-text class="pa-5">
                    <div class="flex items-start justify-between mb-4">
                      <v-avatar color="primary-lighten-4" size="48">
                        <v-icon color="primary">mdi-account</v-icon>
                      </v-avatar>
                      <v-icon
                        v-if="selectedCharacterIds.includes(character.characterId)"
                        color="primary"
                        size="24"
                      >
                        mdi-check-circle
                      </v-icon>
                    </div>
                    <h4 class="font-bold mb-2">{{ character.name }}</h4>
                    <p class="text-xs text-slate-500 leading-relaxed">
                      {{ typeof character.personality === 'string' ? character.personality.substring(0, 60) : '暂无描述' }}
                    </p>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </div>

          <!-- 步骤 3: 审核确认 -->
          <div v-if="currentStep === 3" class="space-y-6">
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold mb-2">审核确认</h1>
              <p class="text-slate-600">请检查您的配置并确认创建会话</p>
            </div>

            <v-card variant="outlined" class="pa-6">
              <h3 class="text-lg font-bold mb-4">会话信息</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-slate-600">会话名称：</span>
                  <span class="font-semibold">{{ sessionName }}</span>
                </div>
                <div v-if="sessionDescription" class="flex justify-between">
                  <span class="text-slate-600">描述：</span>
                  <span class="font-semibold">{{ sessionDescription }}</span>
                </div>
                <v-divider />
                <div class="flex justify-between">
                  <span class="text-slate-600">选择的场景：</span>
                  <span class="font-semibold">{{ selectedScene?.name || '未选择' }}</span>
                </div>
                <v-divider />
                <div class="flex justify-between">
                  <span class="text-slate-600">选择的角色：</span>
                  <span class="font-semibold">{{ selectedCharacters.length }} 个</span>
                </div>
                <div v-if="selectedCharacters.length > 0" class="pl-4">
                  <v-chip
                    v-for="char in selectedCharacters"
                    :key="char.characterId"
                    size="small"
                    class="mr-2 mb-2"
                  >
                    {{ char.name }}
                  </v-chip>
                </div>
              </div>
            </v-card>

            <v-alert type="info" variant="tonal">
              <template #prepend>
                <v-icon>mdi-information</v-icon>
              </template>
              创建会话后，您可以开始剧情推进和快照管理。
            </v-alert>

            <v-alert v-if="error" type="error" variant="tonal">
              {{ error }}
            </v-alert>
          </div>

          <!-- 底部导航按钮 -->
          <div class="flex items-center justify-between pt-8 mt-8 border-t border-slate-200">
            <v-btn
              variant="text"
              prepend-icon="mdi-arrow-left"
              :disabled="currentStep === 1"
              @click="prevStep"
            >
              上一步
            </v-btn>

            <div class="flex gap-3">
              <v-btn
                variant="outlined"
                @click="router.push({ name: 'Home' })"
              >
                取消
              </v-btn>
              <v-btn
                v-if="currentStep < totalSteps"
                color="primary"
                variant="flat"
                append-icon="mdi-arrow-right"
                :disabled="!canProceed"
                @click="nextStep"
              >
                下一步
              </v-btn>
              <v-btn
                v-else
                color="primary"
                variant="flat"
                prepend-icon="mdi-check"
                :loading="isCreating"
                @click="createSession"
              >
                创建会话
              </v-btn>
            </div>
          </div>
        </v-card>

        <!-- 底部版权信息 -->
        <p class="mt-8 text-xs text-center text-slate-500">
          © 2024 星穹铁道剧情复现计划. 专业自动化简化。
        </p>
      </div>
    </v-main>
  </div>
</template>

<style scoped lang="scss">
.custom-file-input {
  :deep(.v-field__input) {
    min-height: 200px;
  }
}

.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.gap-3 {
  gap: 0.75rem;
}

.gap-4 {
  gap: 1rem;
}

.gap-6 {
  gap: 1.5rem;
}
</style>
