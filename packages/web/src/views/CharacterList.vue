<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 搜索和筛选
const searchQuery = ref('');
const selectedFaction = ref('all');

// 人物数据
interface Character {
  id: string;
  name: string;
  faction: string;
  description: string;
  avatar?: string;
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  abilities: {
    combat: number;
    social: number;
    investigation: number;
  };
  status: 'active' | 'draft' | 'archived';
  updatedAt: string;
}

const characters = ref<Character[]>([
  {
    id: 'march7',
    name: '三月七',
    faction: '星穹列车',
    description: '星穹列车的成员，被发现时冰封在一块永恒冰中，失去了所有记忆。性格开朗活泼，喜欢拍照记录生活。',
    personality: {
      openness: 0.8,
      conscientiousness: 0.6,
      extraversion: 0.85,
      agreeableness: 0.75,
      neuroticism: 0.35,
    },
    abilities: {
      combat: 65,
      social: 80,
      investigation: 60,
    },
    status: 'active',
    updatedAt: '2 小时前',
  },
  {
    id: 'stelle',
    name: '星',
    faction: '星穹列车',
    description: '开拓者，被植入了星核的特殊存在。拥有强大的力量，正在寻找自己的过去。',
    personality: {
      openness: 0.7,
      conscientiousness: 0.75,
      extraversion: 0.6,
      agreeableness: 0.7,
      neuroticism: 0.4,
    },
    abilities: {
      combat: 85,
      social: 65,
      investigation: 70,
    },
    status: 'active',
    updatedAt: '5 小时前',
  },
  {
    id: 'danheng',
    name: '丹恒',
    faction: '星穹列车',
    description: '星穹列车的守卫，沉默寡言但可靠。似乎隐藏着某些秘密。',
    personality: {
      openness: 0.5,
      conscientiousness: 0.85,
      extraversion: 0.3,
      agreeableness: 0.6,
      neuroticism: 0.45,
    },
    abilities: {
      combat: 90,
      social: 45,
      investigation: 75,
    },
    status: 'active',
    updatedAt: '昨天',
  },
  {
    id: 'bronya',
    name: '布洛妮娅',
    faction: '贝洛伯格',
    description: '贝洛伯格的大守护者继承人，冷静理智，肩负着城市的未来。',
    personality: {
      openness: 0.65,
      conscientiousness: 0.9,
      extraversion: 0.5,
      agreeableness: 0.65,
      neuroticism: 0.35,
    },
    abilities: {
      combat: 80,
      social: 75,
      investigation: 80,
    },
    status: 'active',
    updatedAt: '3 天前',
  },
  {
    id: 'seele',
    name: '希儿',
    faction: '地火',
    description: '地下城的战士，勇敢而坚强，为了保护下层区的人们而战斗。',
    personality: {
      openness: 0.6,
      conscientiousness: 0.7,
      extraversion: 0.55,
      agreeableness: 0.7,
      neuroticism: 0.5,
    },
    abilities: {
      combat: 88,
      social: 60,
      investigation: 65,
    },
    status: 'draft',
    updatedAt: '1 周前',
  },
]);

// 势力列表
const allFactions = computed(() => {
  const factions = new Set<string>();
  characters.value.forEach(char => factions.add(char.faction));
  return ['all', ...Array.from(factions)];
});

// 筛选后的人物
const filteredCharacters = computed(() => {
  return characters.value.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         char.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesFaction = selectedFaction.value === 'all' || char.faction === selectedFaction.value;
    return matchesSearch && matchesFaction;
  });
});

// 统计数据
const stats = computed(() => ({
  total: characters.value.length,
  active: characters.value.filter(c => c.status === 'active').length,
  draft: characters.value.filter(c => c.status === 'draft').length,
  factions: new Set(characters.value.map(c => c.faction)).size,
}));

// 方法
const viewCharacter = (character: Character) => {
  router.push({ name: 'CharacterDetail', params: { characterId: character.id } });
};

const createCharacter = () => {
  router.push({ name: 'CharacterDetail', params: { characterId: 'new' } });
};

const editCharacter = (character: Character) => {
  router.push({ name: 'CharacterDetail', params: { characterId: character.id }, query: { mode: 'edit' } });
};

const deleteCharacter = (character: Character) => {
  console.log('删除人物', character);
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
                :color="getStatusColor(character.status)"
                size="small"
              >
                {{ getStatusText(character.status) }}
              </v-chip>
            </div>
          </div>

          <v-card-title class="text-lg font-bold pt-4">
            {{ character.name }}
          </v-card-title>

          <v-card-subtitle class="text-sm">
            <v-chip size="x-small" variant="tonal" color="primary" class="mr-2">
              {{ character.faction }}
            </v-chip>
          </v-card-subtitle>

          <v-card-text>
            <p class="text-sm text-grey-darken-1 mb-4">
              {{ character.description.substring(0, 80) }}{{ character.description.length > 80 ? '...' : '' }}
            </p>

            <!-- Personality Traits -->
            <div class="mb-4">
              <p class="text-xs font-semibold text-grey-darken-1 mb-2">性格特质</p>
              <div class="space-y-2">
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span>外向性</span>
                    <span>{{ Math.round(character.personality.extraversion * 100) }}%</span>
                  </div>
                  <v-progress-linear
                    :model-value="character.personality.extraversion * 100"
                    :color="getPersonalityColor(character.personality.extraversion)"
                    height="4"
                  />
                </div>
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span>宜人性</span>
                    <span>{{ Math.round(character.personality.agreeableness * 100) }}%</span>
                  </div>
                  <v-progress-linear
                    :model-value="character.personality.agreeableness * 100"
                    :color="getPersonalityColor(character.personality.agreeableness)"
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
                  <p class="text-xs font-bold">{{ character.abilities.combat }}</p>
                  <p class="text-xs text-grey-darken-1">战斗</p>
                </div>
                <div>
                  <v-icon size="20" color="success">mdi-account-group</v-icon>
                  <p class="text-xs font-bold">{{ character.abilities.social }}</p>
                  <p class="text-xs text-grey-darken-1">社交</p>
                </div>
                <div>
                  <v-icon size="20" color="info">mdi-magnify</v-icon>
                  <p class="text-xs font-bold">{{ character.abilities.investigation }}</p>
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
