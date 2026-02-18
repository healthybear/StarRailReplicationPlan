<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 步骤控制
const currentStep = ref(1);
const totalSteps = 4;

// 步骤 1: 基本信息
const sessionName = ref('');
const sessionDescription = ref('');

// 步骤 2: 配置加载
const selectedTemplate = ref('general');
const uploadedFile = ref<File | null>(null);
const searchQuery = ref('');

// 模板列表
const templates = ref([
  {
    id: 'general',
    name: '通用助手',
    description: '适用于日常任务、问答和一般文本处理的平衡配置。',
    icon: 'mdi-chat',
    color: 'primary',
  },
  {
    id: 'code',
    name: '代码专家',
    description: '针对调试、代码生成和技术文档优化。',
    icon: 'mdi-code-tags',
    color: 'blue',
  },
  {
    id: 'creative',
    name: '创意写作',
    description: '高温度设置，适合富有想象力的故事创作和营销文案。',
    icon: 'mdi-pencil',
    color: 'purple',
  },
  {
    id: 'analyst',
    name: '数据分析',
    description: '专注于结构化输出、数据解析和洞察生成。',
    icon: 'mdi-chart-line',
    color: 'green',
  },
  {
    id: 'support',
    name: '支持机器人',
    description: '礼貌、富有同理心的语气，严格遵守系统指南。',
    icon: 'mdi-face-agent',
    color: 'orange',
  },
  {
    id: 'custom',
    name: '自定义空白',
    description: '从头开始，手动配置所有内容。',
    icon: 'mdi-plus',
    color: 'grey',
  },
]);

// 步骤 3: 参数配置
const parameters = ref({
  temperature: 0.7,
  maxTokens: 2000,
  topP: 0.9,
  frequencyPenalty: 0,
  presencePenalty: 0,
});

// 步骤 4: 审核
const isCreating = ref(false);

// 计算属性
const filteredTemplates = computed(() => {
  if (!searchQuery.value) return templates.value;
  return templates.value.filter(t =>
    t.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return sessionName.value.trim().length > 0;
    case 2:
      return selectedTemplate.value !== null || uploadedFile.value !== null;
    case 3:
      return true;
    case 4:
      return true;
    default:
      return false;
  }
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

const handleFileUpload = (files: File[]) => {
  if (files && files.length > 0) {
    uploadedFile.value = files[0];
  }
};

const selectTemplate = (templateId: string) => {
  selectedTemplate.value = templateId;
};

const createSession = async () => {
  isCreating.value = true;

  // TODO: 调用后端 API 创建会话
  setTimeout(() => {
    isCreating.value = false;
    router.push({ name: 'Home' });
  }, 2000);
};

const getStepIcon = (step: number) => {
  const icons = ['mdi-information', 'mdi-cog', 'mdi-tune', 'mdi-eye'];
  return icons[step - 1];
};

const getStepTitle = (step: number) => {
  const titles = ['基本信息', '配置加载', '参数设置', '审核确认'];
  return titles[step - 1];
};

const getStepStatus = (step: number) => {
  if (step < currentStep.value) return 'completed';
  if (step === currentStep.value) return 'active';
  return 'pending';
};
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
          <div class="grid grid-cols-4 gap-4 mb-10">
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

          <!-- 步骤 2: 配置加载 -->
          <div v-if="currentStep === 2" class="space-y-8">
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold mb-2">配置加载</h1>
              <p class="text-slate-600">选择预定义模板或上传自定义 JSON/YAML 配置文件</p>
            </div>

            <!-- 文件上传区 -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-3">上传自定义配置</label>
              <v-file-input
                v-model="uploadedFile"
                accept=".json,.yaml,.yml"
                prepend-icon=""
                prepend-inner-icon="mdi-upload"
                variant="outlined"
                placeholder="拖放文件或点击浏览"
                show-size
                class="custom-file-input"
                @update:model-value="handleFileUpload"
              >
                <template #prepend-inner>
                  <div class="flex flex-col items-center justify-center py-8 w-full">
                    <v-avatar color="primary" size="64" class="mb-4">
                      <v-icon size="32">mdi-upload</v-icon>
                    </v-avatar>
                    <h3 class="text-lg font-bold mb-1">拖放配置文件到这里</h3>
                    <p class="text-sm text-slate-500 mb-4">支持 .json 和 .yaml 文件（最大 5MB）</p>
                  </div>
                </template>
              </v-file-input>
            </div>

            <!-- 模板库 -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <label class="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  热门模板
                </label>
                <v-text-field
                  v-model="searchQuery"
                  prepend-inner-icon="mdi-magnify"
                  placeholder="搜索模板..."
                  variant="solo-filled"
                  flat
                  density="compact"
                  hide-details
                  class="max-w-xs"
                  bg-color="grey-lighten-4"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <v-card
                  v-for="template in filteredTemplates"
                  :key="template.id"
                  :class="[
                    'cursor-pointer transition-all',
                    selectedTemplate === template.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50',
                  ]"
                  elevation="1"
                  @click="selectTemplate(template.id)"
                >
                  <v-card-text class="pa-5">
                    <div class="flex items-start justify-between mb-4">
                      <v-avatar :color="`${template.color}-lighten-4`" size="48">
                        <v-icon :color="template.color">{{ template.icon }}</v-icon>
                      </v-avatar>
                      <v-icon
                        v-if="selectedTemplate === template.id"
                        color="primary"
                        size="24"
                      >
                        mdi-check-circle
                      </v-icon>
                    </div>
                    <h4 class="font-bold mb-2">{{ template.name }}</h4>
                    <p class="text-xs text-slate-500 leading-relaxed">
                      {{ template.description }}
                    </p>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </div>

          <!-- 步骤 3: 参数配置 -->
          <div v-if="currentStep === 3" class="space-y-6">
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold mb-2">参数设置</h1>
              <p class="text-slate-600">调整模型参数以优化输出质量</p>
            </div>

            <div class="space-y-6">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-semibold">Temperature</label>
                  <span class="text-sm text-slate-500">{{ parameters.temperature }}</span>
                </div>
                <v-slider
                  v-model="parameters.temperature"
                  :min="0"
                  :max="2"
                  :step="0.1"
                  color="primary"
                  thumb-label
                />
                <p class="text-xs text-slate-500">控制输出的随机性。较高的值会产生更多样化的输出。</p>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-semibold">Max Tokens</label>
                  <span class="text-sm text-slate-500">{{ parameters.maxTokens }}</span>
                </div>
                <v-slider
                  v-model="parameters.maxTokens"
                  :min="100"
                  :max="4000"
                  :step="100"
                  color="primary"
                  thumb-label
                />
                <p class="text-xs text-slate-500">生成的最大令牌数。</p>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-semibold">Top P</label>
                  <span class="text-sm text-slate-500">{{ parameters.topP }}</span>
                </div>
                <v-slider
                  v-model="parameters.topP"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  color="primary"
                  thumb-label
                />
                <p class="text-xs text-slate-500">核采样参数。较低的值会产生更集中的输出。</p>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-semibold">Frequency Penalty</label>
                  <span class="text-sm text-slate-500">{{ parameters.frequencyPenalty }}</span>
                </div>
                <v-slider
                  v-model="parameters.frequencyPenalty"
                  :min="0"
                  :max="2"
                  :step="0.1"
                  color="primary"
                  thumb-label
                />
                <p class="text-xs text-slate-500">降低重复相同词语的可能性。</p>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-semibold">Presence Penalty</label>
                  <span class="text-sm text-slate-500">{{ parameters.presencePenalty }}</span>
                </div>
                <v-slider
                  v-model="parameters.presencePenalty"
                  :min="0"
                  :max="2"
                  :step="0.1"
                  color="primary"
                  thumb-label
                />
                <p class="text-xs text-slate-500">增加讨论新主题的可能性。</p>
              </div>
            </div>
          </div>

          <!-- 步骤 4: 审核确认 -->
          <div v-if="currentStep === 4" class="space-y-6">
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
                  <span class="text-slate-600">配置模板：</span>
                  <span class="font-semibold">
                    {{ templates.find(t => t.id === selectedTemplate)?.name || '自定义' }}
                  </span>
                </div>
                <v-divider />
                <div class="flex justify-between">
                  <span class="text-slate-600">Temperature：</span>
                  <span class="font-semibold">{{ parameters.temperature }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-600">Max Tokens：</span>
                  <span class="font-semibold">{{ parameters.maxTokens }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-600">Top P：</span>
                  <span class="font-semibold">{{ parameters.topP }}</span>
                </div>
              </div>
            </v-card>

            <v-alert type="info" variant="tonal">
              <template #prepend>
                <v-icon>mdi-information</v-icon>
              </template>
              创建会话后，您可以随时在设置中修改这些参数。
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

.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
