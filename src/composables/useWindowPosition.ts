import { PhysicalPosition } from '@tauri-apps/api/dpi'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { onMounted, ref, watch } from 'vue'

import { useCatStore } from '@/stores/cat'
import { getCursorMonitor } from '@/utils/monitor'

// 获取当前窗口实例
const appWindow = getCurrentWebviewWindow()

/**
 * 窗口位置 Composable
 * 负责管理窗口在屏幕上的位置（四个角落）
 */
export function useWindowPosition() {
  const catStore = useCatStore()
  const isMounted = ref(false)

  /**
   * 设置窗口位置到指定角落
   */
  const setWindowPosition = async () => {
    const monitor = await getCursorMonitor()

    if (!monitor) return

    const windowSize = await appWindow.outerSize()

    switch (catStore.window.position) {
      case 'topLeft':
        return appWindow.setPosition(new PhysicalPosition(0, 0))
      case 'topRight':
        return appWindow.setPosition(new PhysicalPosition(monitor.size.width - windowSize.width, 0))
      case 'bottomLeft':
        return appWindow.setPosition(new PhysicalPosition(0, monitor.size.height - windowSize.height))
      default:
        return appWindow.setPosition(new PhysicalPosition(monitor.size.width - windowSize.width, monitor.size.height - windowSize.height))
    }
  }

  onMounted(async () => {
    await setWindowPosition()

    isMounted.value = true

    appWindow.onScaleChanged(setWindowPosition)
  })

  watch(() => catStore.window.position, setWindowPosition)

  return {
    isMounted,
    setWindowPosition,
  }
}
