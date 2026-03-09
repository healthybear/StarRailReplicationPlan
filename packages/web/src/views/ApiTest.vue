<template>
  <v-container>
    <v-card>
      <v-card-title>API 测试页面</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <h3>会话管理测试</h3>
            <v-btn @click="testSessions" color="primary" class="mr-2">获取会话列表</v-btn>
            <v-btn @click="createSession" color="success" class="mr-2">创建会话</v-btn>
            <div v-if="sessions" class="mt-4">
              <pre>{{ JSON.stringify(sessions, null, 2) }}</pre>
            </div>
          </v-col>

          <v-col cols="12">
            <v-divider class="my-4"></v-divider>
            <h3>人物管理测试</h3>
            <v-btn @click="testCharacters" color="primary" class="mr-2">获取人物列表</v-btn>
            <v-btn @click="createCharacter" color="success" class="mr-2">创建人物</v-btn>
            <div v-if="characters" class="mt-4">
              <pre>{{ JSON.stringify(characters, null, 2) }}</pre>
            </div>
          </v-col>

          <v-col cols="12">
            <v-divider class="my-4"></v-divider>
            <h3>场景管理测试</h3>
            <v-btn @click="testScenes" color="primary" class="mr-2">获取场景列表</v-btn>
            <v-btn @click="createScene" color="success" class="mr-2">创建场景</v-btn>
            <div v-if="scenes" class="mt-4">
              <pre>{{ JSON.stringify(scenes, null, 2) }}</pre>
            </div>
          </v-col>

          <v-col cols="12">
            <v-divider class="my-4"></v-divider>
            <h3>错误信息</h3>
            <v-alert v-if="error" type="error" class="mt-4">
              {{ error }}
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { sessionApi, characterApi, sceneApi } from '@/api';

const sessions = ref<any>(null);
const characters = ref<any>(null);
const scenes = ref<any>(null);
const error = ref<string>('');

const testSessions = async () => {
  try {
    error.value = '';
    const result = await sessionApi.getAll();
    sessions.value = result;
  } catch (e: any) {
    error.value = `获取会话列表失败: ${e.message}`;
  }
};

const createSession = async () => {
  try {
    error.value = '';
    const result = await sessionApi.create({
      sessionName: '测试会话',
      sceneId: 'scene_001',
      characterIds: ['char_001'],
    });
    sessions.value = result;
  } catch (e: any) {
    error.value = `创建会话失败: ${e.message}`;
  }
};

const testCharacters = async () => {
  try {
    error.value = '';
    const result = await characterApi.getAll();
    characters.value = result;
  } catch (e: any) {
    error.value = `获取人物列表失败: ${e.message}`;
  }
};

const createCharacter = async () => {
  try {
    error.value = '';
    const result = await characterApi.create({
      characterId: 'char_test_' + Date.now(),
      name: '测试角色',
      personality: { trait: 'friendly' },
      initialState: { hp: 100 },
    });
    characters.value = result;
  } catch (e: any) {
    error.value = `创建人物失败: ${e.message}`;
  }
};

const testScenes = async () => {
  try {
    error.value = '';
    const result = await sceneApi.getAll();
    scenes.value = result;
  } catch (e: any) {
    error.value = `获取场景列表失败: ${e.message}`;
  }
};

const createScene = async () => {
  try {
    error.value = '';
    const result = await sceneApi.create({
      sceneId: 'scene_test_' + Date.now(),
      name: '测试场景',
      description: '这是一个测试场景',
      environment: { weather: 'sunny' },
    });
    scenes.value = result;
  } catch (e: any) {
    error.value = `创建场景失败: ${e.message}`;
  }
};
</script>
