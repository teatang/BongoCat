import type { WindowState } from '@/composables/useWindowState'

import { getName, getVersion } from '@tauri-apps/api/app'
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

/**
 * 应用程序状态管理 Store
 * 管理应用名称、版本号和窗口状态
 */
export const useAppStore = defineStore('app', () => {
  const name = ref('')
  const version = ref('')
  const windowState = reactive<WindowState>({})

  /**
   * 初始化应用信息
   */
  const init = async () => {
    name.value = await getName()
    version.value = await getVersion()
  }

  return {
    name,
    version,
    windowState,
    init,
  }
})
