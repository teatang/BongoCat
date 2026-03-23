import type { Event } from '@tauri-apps/api/event'

import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { availableMonitors } from '@tauri-apps/api/window'
import { isNumber } from 'es-toolkit/compat'
import { onMounted, ref } from 'vue'

import { useAppStore } from '@/stores/app'

/** 窗口状态类型 */
export type WindowState = Record<string, Partial<PhysicalPosition & PhysicalSize> | undefined>

// 获取当前窗口实例
const appWindow = getCurrentWebviewWindow()
const { label } = appWindow

/**
 * 窗口状态 Composable
 * 负责监听和保存窗口的位置与大小状态
 */
export function useWindowState() {
  const appStore = useAppStore()
  const isRestored = ref(false)

  onMounted(() => {
    appWindow.onMoved(onChange)

    appWindow.onResized(onChange)
  })

  /**
   * 窗口位置或大小变化时的回调
   */
  const onChange = async (event: Event<PhysicalPosition | PhysicalSize>) => {
    const minimized = await appWindow.isMinimized()

    if (minimized) return

    appStore.windowState[label] ??= {}

    Object.assign(appStore.windowState[label], event.payload)
  }

  /**
   * 恢复窗口状态到之前保存的位置和大小
   */
  const restoreState = async () => {
    const { x, y, width, height } = appStore.windowState[label] ?? {}

    if (isNumber(x) && isNumber(y)) {
      const monitors = await availableMonitors()

      const monitor = monitors.find((monitor) => {
        const { position, size } = monitor

        const inBoundsX = x >= position.x && x <= position.x + size.width
        const inBoundsY = y >= position.y && y <= position.y + size.height

        return inBoundsX && inBoundsY
      })

      if (monitor) {
        await appWindow.setPosition(new PhysicalPosition(x, y))
      }
    }

    if (width && height) {
      await appWindow.setSize(new PhysicalSize(width, height))
    }

    isRestored.value = true
  }

  return {
    isRestored,
    restoreState,
  }
}
