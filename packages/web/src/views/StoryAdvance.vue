<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { sessionApi, storyApi, snapshotApi } from '@/api';

const route = useRoute();
const router = useRouter();
const sessionId = computed(() => route.params.sessionId as string);

// 会话信息
const sessionInfo = ref({
  name: '',
  lastUpdate: '',
});
const loading = ref(false);
const error = ref<string>('');

// 对话历史
interface Message {
  id: string;
  type: 'ai' | 'user';
  sender: string;
  content: string;
  timestamp: string;
  avatar?: string;
}

const messages = ref<Message[]>([]);

// 用户输入
const userInput = ref('');
const isProcessing = ref(false);

// 加载会话信息
const loadSession = async () => {
  try {
    loading.value = true;
    error.value = '';
    const session = await sessionApi.getById(sessionId.value);
    sessionInfo.value = {
      name: session.sessionName,
      lastUpdate: new Date(session.updatedAt || session.createdAt).toLocaleString('zh-CN'),
    };

    // 添加欢迎消息
    if (messages.value.length === 0) {
      messages.value.push({
        id: '1',
        type: 'ai',
        sender: 'AI Assistant',
        content: `欢迎来到会话「${session.sessionName}」！您可以开始输入指令来推进剧情。`,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      });
    }
  } catch (e: any) {
    error.value = `加载会话失败: ${e.message}`;
    console.error('Failed to load session:', e);
  } finally {
    loading.value = false;
  }
};

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || isProcessing.value) return;

  const newMessage: Message = {
    id: Date.now().toString(),
    type: 'user',
    sender: 'User',
    content: userInput.value,
    timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  };

  messages.value.push(newMessage);
  const input = userInput.value;
  userInput.value = '';
  isProcessing.value = true;

  try {
    // 调用剧情推进 API
    const result = await storyApi.advance({
      sessionId: sessionId.value,
      userInput: input,
      characterId: '', // TODO: 从会话中获取当前角色
      sceneId: '', // TODO: 从会话中获取当前场景
    });

    // 添加 AI 响应
    messages.value.push({
      id: (Date.now() + 1).toString(),
      type: 'ai',
      sender: 'AI Assistant',
      content: result.response || '剧情推进成功',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    });

    // 刷新会话信息
    await loadSession();
  } catch (e: any) {
    error.value = `剧情推进失败: ${e.message}`;
    console.error('Failed to advance story:', e);

    // 添加错误消息
    messages.value.push({
      id: (Date.now() + 1).toString(),
      type: 'ai',
      sender: 'System',
      content: `错误: ${e.message}`,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    });
  } finally {
    isProcessing.value = false;
  }
};

// 快捷操作
const handleSnapshot = async () => {
  try {
    await snapshotApi.create(sessionId.value, {
      name: `快照 ${new Date().toLocaleString('zh-CN')}`,
      description: '手动创建的快照',
    });

    // 添加成功消息
    messages.value.push({
      id: Date.now().toString(),
      type: 'ai',
      sender: 'System',
      content: '快照创建成功！',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (e: any) {
    error.value = `创建快照失败: ${e.message}`;
    console.error('Failed to create snapshot:', e);
  }
};

const handleLoadSnapshot = () => {
  router.push({ name: 'SnapshotList', params: { sessionId: sessionId.value } });
};

onMounted(() => {
  loadSession();
});
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
    <!-- 顶部工具栏 -->
    <v-app-bar elevation="0" class="border-b border-slate-200 dark:border-slate-800">
      <template #prepend>
        <div class="flex items-center gap-3 ml-4">
          <div class="bg-primary/10 p-2 rounded-lg">
            <v-icon color="primary" size="24">mdi-schema</v-icon>
          </div>
          <div>
            <div class="text-lg font-bold">Session: {{ sessionInfo.name }}</div>
            <div class="text-xs text-slate-500">上次更新于 {{ sessionInfo.lastUpdate }}</div>
          </div>
        </div>
      </template>

      <template #append>
        <div class="flex gap-2 mr-4">
          <v-btn
            variant="text"
            color="default"
            prepend-icon="mdi-account-group"
            @click="router.push({ name: 'MultiCharacterView', params: { sessionId: sessionId } })"
          >
            多角色
          </v-btn>
          <v-btn
            variant="text"
            color="default"
            prepend-icon="mdi-compare"
            @click="router.push({ name: 'ComparisonReport', params: { sessionId: sessionId } })"
          >
            对比报告
          </v-btn>
          <v-btn
            variant="text"
            color="default"
            prepend-icon="mdi-chart-bubble"
            @click="router.push({ name: 'StateVisualization', params: { sessionId: sessionId } })"
          >
            状态可视化
          </v-btn>
          <v-btn
            variant="tonal"
            color="default"
            prepend-icon="mdi-history"
            @click="handleLoadSnapshot"
          >
            加载快照
          </v-btn>
          <v-btn
            variant="flat"
            color="primary"
            prepend-icon="mdi-plus-circle"
            @click="handleSnapshot"
          >
            新建快照
          </v-btn>
        </div>
      </template>
    </v-app-bar>

    <!-- 消息展示区 -->
    <v-main class="flex-1 overflow-hidden">
      <div class="h-full overflow-y-auto custom-scrollbar px-6 py-8">
        <div class="max-w-4xl mx-auto space-y-8">
          <!-- 消息列表 -->
          <div
            v-for="message in messages"
            :key="message.id"
            class="flex items-start gap-4"
            :class="message.type === 'user' ? 'flex-row-reverse ml-auto' : 'max-w-4xl'"
          >
            <!-- 头像 -->
            <v-avatar
              :color="message.type === 'ai' ? 'primary' : 'grey-lighten-1'"
              size="40"
              class="shrink-0"
            >
              <v-icon :color="message.type === 'ai' ? 'primary' : 'grey-darken-1'">
                {{ message.type === 'ai' ? 'mdi-robot' : 'mdi-account' }}
              </v-icon>
            </v-avatar>

            <!-- 消息内容 -->
            <div
              class="flex flex-col gap-2 flex-1"
              :class="message.type === 'user' ? 'items-end' : ''"
            >
              <!-- 发送者和时间 -->
              <div
                class="flex items-center gap-2 text-sm"
                :class="message.type === 'user' ? 'flex-row-reverse' : ''"
              >
                <span class="font-bold">{{ message.sender }}</span>
                <span class="text-xs text-slate-400 uppercase">{{ message.timestamp }}</span>
              </div>

              <!-- 消息气泡 -->
              <v-card
                :color="message.type === 'ai' ? 'white' : 'primary'"
                :class="[
                  'pa-4 shadow-sm',
                  message.type === 'ai'
                    ? 'rounded-2xl rounded-tl-none text-slate-700'
                    : 'rounded-2xl rounded-tr-none text-white',
                ]"
                elevation="1"
                :style="message.type === 'user' ? 'max-width: 85%' : ''"
              >
                <div class="text-sm leading-relaxed whitespace-pre-wrap">
                  {{ message.content }}
                </div>
              </v-card>
            </div>
          </div>

          <!-- 加载中指示器 -->
          <div v-if="isProcessing" class="flex items-center gap-3 max-w-4xl">
            <v-avatar color="primary" size="40" class="shrink-0">
              <v-icon color="primary">mdi-robot</v-icon>
            </v-avatar>
            <div class="flex gap-1">
              <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
          </div>
        </div>
      </div>
    </v-main>

    <!-- 固定输入区 -->
    <div class="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <div class="max-w-4xl mx-auto">
        <v-card
          elevation="1"
          class="overflow-hidden transition-all"
          :class="{ 'ring-2 ring-primary/50': userInput.length > 0 }"
        >
          <!-- 工具栏 -->
          <div class="flex items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-700">
            <v-btn icon size="small" variant="text" color="grey" title="附件">
              <v-icon size="20">mdi-paperclip</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="text" color="grey" title="表情">
              <v-icon size="20">mdi-emoticon-happy-outline</v-icon>
            </v-btn>
            <v-divider vertical class="mx-1" />
            <v-btn icon size="small" variant="text" color="grey" title="语音输入">
              <v-icon size="20">mdi-microphone</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="text" color="grey" title="代码块">
              <v-icon size="20">mdi-code-tags</v-icon>
            </v-btn>
          </div>

          <!-- 输入框 -->
          <v-textarea
            v-model="userInput"
            placeholder="输入消息或指令，使用 / 触发快捷菜单..."
            rows="3"
            auto-grow
            max-rows="8"
            variant="plain"
            hide-details
            class="px-4"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.shift.enter.exact="userInput += '\n'"
          />

          <!-- 底部操作栏 -->
          <div class="flex items-center justify-between px-4 pb-4">
            <div class="flex gap-2">
              <v-chip size="x-small" variant="outlined" color="grey">
                GPT-4o
              </v-chip>
              <v-chip size="x-small" variant="outlined" color="success">
                Connected
              </v-chip>
            </div>
            <v-btn
              color="primary"
              variant="flat"
              append-icon="mdi-send"
              :disabled="!userInput.trim() || isProcessing"
              :loading="isProcessing"
              @click="sendMessage"
            >
              发送
            </v-btn>
          </div>
        </v-card>

        <!-- 提示文本 -->
        <div class="mt-3 text-center">
          <p class="text-xs text-slate-400">按 Enter 发送，Shift + Enter 换行</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 10px;
  }

  .dark &::-webkit-scrollbar-thumb {
    background: #374151;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
</style>
