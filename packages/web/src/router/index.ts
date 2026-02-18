import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('@/views/layout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/HomePage.vue'),
      },
      {
        path: 'sessions',
        name: 'SessionList',
        component: () => import('@/views/SessionList.vue'),
      },
      {
        path: 'session/create',
        name: 'CreateSession',
        component: () => import('@/views/CreateSession.vue'),
      },
      {
        path: 'session/:sessionId',
        name: 'StoryAdvance',
        component: () => import('@/views/StoryAdvance.vue'),
      },
      {
        path: 'scenes',
        name: 'SceneList',
        component: () => import('@/views/SceneList.vue'),
      },
      {
        path: 'scene/:sceneId',
        name: 'SceneDetail',
        component: () => import('@/views/SceneDetail.vue'),
      },
      {
        path: 'characters',
        name: 'CharacterList',
        component: () => import('@/views/CharacterList.vue'),
      },
      {
        path: 'character/:characterId',
        name: 'CharacterDetail',
        component: () => import('@/views/CharacterDetail.vue'),
      },
      {
        path: 'factions',
        name: 'FactionList',
        component: () => import('@/views/FactionList.vue'),
      },
      {
        path: 'faction/:factionId',
        name: 'FactionDetail',
        component: () => import('@/views/FactionDetail.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
