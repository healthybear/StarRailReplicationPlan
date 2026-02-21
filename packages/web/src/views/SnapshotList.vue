<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const sessionId = computed(() => route.params.sessionId as string);

interface Snapshot {
  id: string;
  name: string;
  nodeIndex: number;
  description: string;
  characters: string[];
  createdAt: string;
  size: string;
}

const snapshots = ref<Snapshot[]>([
  {
    id: 'snap-001',
    name: '初始状态快照',
    nodeIndex: 0,
    description: '会话开始时的初始状态，包含所有角色的初始属性和关系。',
    characters: ['开拓者', '布洛妮娅', '希儿'],
    createdAt: '2026-02-18 10:00',
    size: '12.4 KB',
  },
  {
    id: 'snap-002',
    name: '审讯室对峙后',
    nodeIndex: 12,
    description: '开拓者与卡芙卡对峙结束后的状态，角色关系发生了显著变化。',
    characters: ['开拓者', '卡芙卡', '银狼'],
    createdAt: '2026-02-18 14:32',
    size: '18.7 KB',
  },
  {
    id: 'snap-003',
    name: '地下城探索中',
    nodeIndex: 21,
    description: '队伍深入地下城后的状态快照，记录了探索过程中的信息积累。',
    characters: ['开拓者', '希儿', '娜塔莎'],
    createdAt: '2026-02-19 09:15',
    size: '24.1 KB',
  },
]);

const deleteDialog = ref(false);
const deleteTargetId = ref('');
const loadDialog = ref(false);
const loadTargetId = ref('');
const conflictStrategy = ref<'reject' | 'overwrite' | 'rename' | 'merge'>('merge');

const conflictOptions = [
  { value: 'merge', label: '合并', description: '合并角色状态（能力取最大值，关系取平均值）', icon: 'mdi-merge', color: 'primary' },
  { value: 'overwrite', label: '覆盖', description: '用快照数据覆盖现有角色状态', icon: 'mdi-content-copy', color: 'warning' },
  { value: 'rename', label: '重命名', description: '保留现有角色，以新 ID 导入快照角色', icon: 'mdi-rename-box', color: 'teal' },
  { value: 'reject', label: '跳过', description: '跳过已存在的角色，只导入新角色', icon: 'mdi-cancel', color: 'grey' },
];

const confirmDelete = (id: string) => {
  deleteTargetId.value = id;
  deleteDialog.value = true;
};

const doDelete = () => {
  snapshots.value = snapshots.value.filter(s => s.id !== deleteTargetId.value);
  deleteDialog.value = false;
};

const confirmLoad = (id: string) => {
  loadTargetId.value = id;
  loadDialog.value = true;
};

const doLoad = () => {
  // TODO: 调用 ExportImportService.importSnapshotToSession
  console.log('加载快照', loadTargetId.value, '策略:', conflictStrategy.value);
  loadDialog.value = false;
  router.push({ name: 'StoryAdvance', params: { sessionId: sessionId.value } });
};

const goBack = () => {
  router.push({ name: 'StoryAdvance', params: { sessionId: sessionId.value } });
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
          <v-icon color="primary">mdi-camera-burst</v-icon>
          <span class="font-bold">快照管理</span>
          <v-chip size="x-small" variant="tonal" color="grey" class="ml-1">
            会话 {{ sessionId }}
          </v-chip>
        </div>
      </v-app-bar-title>
    </v-app-bar>

    <v-main>
      <div class="pa-6 max-w-4xl mx-auto">
        <v-breadcrumbs
          :items="[
            { title: '首页', href: '/' },
            { title: '会话', href: '/sessions' },
            { title: sessionId, href: `/session/${sessionId}` },
            { title: '快照' },
          ]"
          class="pa-0 mb-6"
        />

        <!-- 空状态 -->
        <v-card v-if="snapshots.length === 0" elevation="1">
          <v-card-text class="text-center py-16">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-camera-off-outline</v-icon>
            <p class="text-h6 text-grey mb-2">暂无快照</p>
            <p class="text-body-2 text-grey-darken-1">在会话推进过程中点击「新建快照」即可保存当前状态</p>
          </v-card-text>
        </v-card>

        <!-- 快照列表 -->
        <div v-else class="d-flex flex-column gap-4">
          <v-card
            v-for="snap in snapshots"
            :key="snap.id"
            elevation="1"
          >
            <v-card-text class="pa-5">
              <div class="d-flex align-start justify-space-between">
                <div class="d-flex align-center gap-3">
                  <v-avatar color="primary" variant="tonal" size="48" rounded="lg">
                    <v-icon>mdi-camera</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-1 font-bold">{{ snap.name }}</div>
                    <div class="d-flex align-center gap-2 text-caption text-grey mt-1">
                      <v-icon size="12">mdi-map-marker</v-icon>
                      节点 #{{ snap.nodeIndex }}
                      <span class="mx-1">·</span>
                      <v-icon size="12">mdi-clock-outline</v-icon>
                      {{ snap.createdAt }}
                      <span class="mx-1">·</span>
                      <v-icon size="12">mdi-file-outline</v-icon>
                      {{ snap.size }}
                    </div>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="primary"
                    prepend-icon="mdi-restore"
                    @click="confirmLoad(snap.id)"
                  >
                    加载
                  </v-btn>
                  <v-btn
                    size="small"
                    variant="text"
                    color="error"
                    icon="mdi-delete-outline"
                    @click="confirmDelete(snap.id)"
                  />
                </div>
              </div>

              <p class="text-body-2 text-grey-darken-1 mt-3 mb-3">{{ snap.description }}</p>

              <div class="d-flex align-center gap-2">
                <v-icon size="14" color="grey">mdi-account-multiple</v-icon>
                <div class="d-flex gap-1 flex-wrap">
                  <v-chip
                    v-for="char in snap.characters"
                    :key="char"
                    size="x-small"
                    variant="outlined"
                  >
                    {{ char }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-main>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center gap-2 pa-5">
          <v-icon color="error">mdi-alert-circle-outline</v-icon>
          确认删除
        </v-card-title>
        <v-card-text class="px-5 pb-2">
          删除后无法恢复，确定要删除该快照吗？
        </v-card-text>
        <v-card-actions class="pa-5 pt-3">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="doDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 加载快照对话框 -->
    <v-dialog v-model="loadDialog" max-width="520">
      <v-card>
        <v-card-title class="d-flex align-center gap-2 pa-5">
          <v-icon color="primary">mdi-restore</v-icon>
          加载快照
        </v-card-title>
        <v-card-text class="px-5 pb-2">
          <p class="text-body-2 text-grey-darken-1 mb-4">
            选择角色冲突处理策略（当快照中的角色已存在于当前会话时）：
          </p>
          <v-radio-group v-model="conflictStrategy" hide-details>
            <v-radio
              v-for="opt in conflictOptions"
              :key="opt.value"
              :value="opt.value"
              class="mb-2"
            >
              <template #label>
                <div class="d-flex align-center gap-3 py-1">
                  <v-avatar :color="opt.color" variant="tonal" size="32">
                    <v-icon size="16">{{ opt.icon }}</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-body-2 font-semibold">{{ opt.label }}</div>
                    <div class="text-caption text-grey">{{ opt.description }}</div>
                  </div>
                </div>
              </template>
            </v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions class="pa-5 pt-3">
          <v-spacer />
          <v-btn variant="text" @click="loadDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-restore" @click="doLoad">
            确认加载
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
