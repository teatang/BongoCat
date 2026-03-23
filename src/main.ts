import { createPlugin } from '@tauri-store/pinia'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { i18n } from './locales'
import router from './router'

import 'virtual:uno.css'
import 'ant-design-vue/dist/reset.css'
import './assets/css/global.scss'

// 创建 Pinia 状态管理实例
const pinia = createPinia()
// 使用 Tauri Store 插件进行持久化存储
pinia.use(createPlugin({ saveOnChange: true }))

// 创建并挂载 Vue 应用
createApp(App).use(router).use(pinia).use(i18n).mount('#app')
