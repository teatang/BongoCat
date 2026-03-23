import { listen } from '@tauri-apps/api/event'
import { noop } from '@vueuse/core'
import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Tauri 事件监听 Composable
 * 简化 Tauri 事件监听的生命周期管理
 * @param args listen 函数的参数
 */
export function useTauriListen<T>(...args: Parameters<typeof listen<T>>) {
  const unlisten = ref(noop)

  onMounted(async () => {
    unlisten.value = await listen<T>(...args)
  })

  onUnmounted(() => {
    unlisten.value()
  })
}
