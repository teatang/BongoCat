import type { RouteRecordRaw } from 'vue-router'

import { createRouter, createWebHashHistory } from 'vue-router'

import Main from '../pages/main/index.vue'
import Preference from '../pages/preference/index.vue'

/** 路由配置 */
const routes: Readonly<RouteRecordRaw[]> = [
  {
    path: '/',
    component: Main,
  },
  {
    path: '/preference',
    component: Preference,
  },
]

/** 创建路由实例 */
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
