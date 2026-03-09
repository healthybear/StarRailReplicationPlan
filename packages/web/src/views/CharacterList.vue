<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { characterApi, type Character } from '@/api';

const router = useRouter();

// 搜索和筛选
const searchQuery = ref('');
const selectedFaction = ref('all');

// 人物数据
const characters = ref<Character[]>([]);
const loading = ref(false);
const error = ref<string>('');

// Load characters from API
const loadCharacters = async () => {
  try {
    loading.value = true;
    error.value = '';
    const data = await characterApi.getAll();
    characters.value = data;
  } catch (e: any) {
    error.value = `加载人物列表失败: ${e.message}`;
    console.error('Failed to load characters:', e);
  } finally {
    loading.value = false;
  }
};

// 势力列表
const allFactions = computed(() => {
  const factions = new Set<string>();
  characters.value.forEach(char => {
    if (char.metadata?.faction) {
      factions.add(char.metadata.faction as string);
    }
  });
  return ['all', ...Array.from(factions)];
});

// 筛选后的人物
const filteredCharacters = computed(() => {
  return characters.value.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesFaction = selectedFaction.value === 'all' ||
                          char.metadata?.faction === selectedFaction.value;
    return matchesSearch && matchesFaction;
  });
});

// 统计数据
const stats = computed(() => ({
  total: characters.value.length,
  active: characters.value.length,
  draft: 0,
  factions: allFactions.value.length - 1,
}));

// 方法
const viewCharacter = (character: Character) => {
  router.push({ name: 'CharacterDetail', params: { characterId: character.characterId } });
};

const createCharacter = () => {
  router.push({ name: 'CharacterDetail', params: { characterId: 'new' } });
};

const editCharacter = (character: Character) => {
  router.push({ name: 'CharacterDetail', params: { characterId: character.characterId }, query: { mode: 'edit' } });
};

const deleteCharacter = async (character: Character) => {
  if (!confirm(`确定要删除人物"${character.name}"吗？`)) {
    return;
  }
  try {
    await characterApi.delete(character.characterId);
    await loadCharacters();
  } catch (e: any) {
    error.value = `删除人物失败: ${e.message}`;
    console.error('Failed to delete character:', e);
  }
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    draft: 'warning',
    archived: 'grey',
  };
  return colors[status] || 'grey';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: '活跃',
    draft: '草稿',
    archived: '已归档',
  };
  return texts[status] || status;
};

const getPersonalityColor = (value: number) => {
  if (value >= 0.7) return 'success';
  if (value >= 0.4) return 'warning';
  return 'error';
};

// Helper function to get personality trait value
const getPersonalityTrait = (character: Character, trait: string): number => {
  if (typeof character.personality === 'object' && character.personality !== null) {
    return (character.personality as any)[trait] || 0;
  }
  return 0;
};

// Helper function to get ability value
const getAbility = (character: Character, ability: string): number => {
  if (character.initialState && typeof character.initialState === 'object') {
    const abilities = (character.initialState as any).abilities;
    if (abilities && typeof abilities === 'object') {
      return abilities[ability] || 0;
    }
  }
  return 0;
};

onMounted(() => {
  loadCharacters();
});
</script>

<template>
  <!-- Header -->
  <v-app-bar elevation="0" class="border-b">
    <v-app-bar-title class="text-xl font-bold">人物列表</v-app-bar-title>

    <v-divider vertical class="mx-4" />

    <v-text-field
      v-model="searchQuery"
      prepend-inner-icon="mdi-magnify"
      placeholder="搜索人物..."
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
      @click="createCharacter"
    >
      新建人物
    </v-btn>
  </v-app-bar>

  <!-- Content Area -->
  <div class="pa-8 bg-grey-lighten-5">
    <!-- Error Alert -->
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <!-- Loading State -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- Stats Overview -->
    <v-row class="mb-8">
      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">总人物数</p>
              <p class="text-3xl font-bold">{{ stats.total }}</p>
            </div>
            <v-avatar color="primary-lighten-4" size="48">
              <v-icon color="primary">mdi-account-group</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">活跃人物</p>
              <p class="text-3xl font-bold text-success">{{ stats.active }}</p>
            </div>
            <v-avatar color="success-lighten-4" size="48">
              <v-icon color="success">mdi-check-circle</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">草稿</p>
              <p class="text-3xl font-bold text-warning">{{ stats.draft }}</p>
            </div>
            <v-avatar color="warning-lighten-4" size="48">
              <v-icon color="warning">mdi-pencil</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card elevation="1" class="pa-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-grey-darken-1 mb-1">势力数</p>
              <p class="text-3xl font-bold text-info">{{ stats.factions }}</p>
            </div>
            <v-avatar color="info-lighten-4" size="48">
              <v-icon color="info">mdi-shield</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Faction Filter -->
    <v-card elevation="1" class="mb-6 pa-4">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm font-semibold text-grey-darken-1">势力筛选：</span>
        <v-chip-group v-model="selectedFaction" mandatory>
          <v-chip
            v-for="faction in allFactions"
            :key="faction"
            :value="faction"
            variant="outlined"
            filter
          >
            {{ faction === 'all' ? '全部' : faction }}
          </v-chip>
        </v-chip-group>
      </div>
    </v-card>

    <!-- Character Grid -->
    <v-row>
      <v-col
        v-for="character in filteredCharacters"
        :key="character.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          elevation="1"
          class="h-full cursor-pointer transition-all hover:elevation-4"
          @click="viewCharacter(character)"
        >
          <!-- Header -->
          <div class="relative pa-6 bg-gradient-to-br from-primary-lighten-2 to-primary-darken-2">
            <div class="flex items-start justify-between">
              <v-avatar size="80" color="white" class="border-4 border-white shadow-lg">
                <v-icon size="48" color="primary">mdi-account</v-icon>
              </v-avatar>
              <v-chip
                :color="getStatusColor('active')"
                size="small"
              >
                {{ getStatusText('active') }}
              </v-chip>
            </div>
          </div>

          <v-card-title class="text-lg font-bold pt-4">
            {{ character.name }}
          </v-card-title>

          <v-card-subtitle class="text-sm">
            <v-chip size="x-small" variant="tonal" color="primary" class="mr-2">
              {{ character.metadata?.faction || '未知势力' }}
            </v-chip>
          </v-card-subtitle>

          <v-card-text>
            <p class="text-sm text-grey-darken-1 mb-4">
              {{ typeof character.personality === 'string' ? character.personality.substring(0, 80) : '暂无描述' }}
            </p>

            <!-- Personality Traits -->
            <div class="mb-4">
              <p class="text-xs font-semibold text-grey-darken-1 mb-2">性格特质</p>
              <div class="space-y-2">
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span>外向性</span>
                    <span>{{ Math.round(getPersonalityTrait(character, 'extraversion') * 100) }}%</span>
                  </div>
                  <v-progress-linear
                    :model-value="getPersonalityTrait(character, 'extraversion') * 100"
                    :color="getPersonalityColor(getPersonalityTrait(character, 'extraversion'))"
                    height="4"
                  />
                </div>
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span>宜人性</span>
                    <span>{{ Math.round(getPersonalityTrait(character, 'agreeableness') * 100) }}%</span>
                  </div>
                  <v-progress-linear
                    :model-value="getPersonalityTrait(character, 'agreeableness') * 100"
                    :color="getPersonalityColor(getPersonalityTrait(character, 'agreeableness'))"
                    height="4"
                  />
                </div>
              </div>
            </div>

            <!-- Abilities -->
            <div>
              <p class="text-xs font-semibold text-grey-darken-1 mb-2">能力值</p>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div>
                  <v-icon size="20" color="error">mdi-sword-cross</v-icon>
                  <p class="text-xs font-bold">{{ getAbility(character, 'combat') }}</p>
                  <p class="text-xs text-grey-darken-1">战斗</p>
                </div>
                <div>
                  <v-icon size="20" color="success">mdi-account-group</v-icon>
                  <p class="text-xs font-bold">{{ getAbility(character, 'social') }}</p>
                  <p class="text-xs text-grey-darken-1">社交</p>
                </div>
                <div>
                  <v-icon size="20" color="info">mdi-magnify</v-icon>
                  <p class="text-xs font-bold">{{ getAbility(character, 'investigation') }}</p>
                  <p class="text-xs text-grey-darken-1">调查</p>
                </div>
              </div>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              prepend-icon="mdi-eye"
              size="small"
              variant="tonal"
              color="primary"
              @click.stop="viewCharacter(character)"
            >
              查看
            </v-btn>
            <v-spacer />
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click.stop="editCharacter(character)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click.stop="deleteCharacter(character)"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-if="filteredCharacters.length === 0" elevation="1" class="pa-12 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-account-off
      </v-icon>
      <h3 class="text-xl font-bold mb-2">未找到人物</h3>
      <p class="text-grey-darken-1 mb-6">尝试调整搜索条件或创建新人物</p>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="createCharacter">
        新建人物
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

.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.gap-2 {
  gap: 0.5rem;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}
</style>
