import { invoke } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { cursorPosition } from '@tauri-apps/api/window'

import { INVOKE_KEY, LISTEN_KEY } from '../constants'

import { useModel } from './useModel'
import { useTauriListen } from './useTauriListen'

import { useCatStore } from '@/stores/cat'
import { useModelStore } from '@/stores/model'
import { inBetween } from '@/utils/is'
import { isWindows } from '@/utils/platform'

/** 鼠标按键事件接口 */
interface MouseButtonEvent {
  kind: 'MousePress' | 'MouseRelease'
  value: string
}

/** 光标位置坐标 */
export interface CursorPoint {
  x: number
  y: number
}

/** 鼠标移动事件接口 */
interface MouseMoveEvent {
  kind: 'MouseMove'
  value: CursorPoint
}

/** 键盘事件接口 */
interface KeyboardEvent {
  kind: 'KeyboardPress' | 'KeyboardRelease'
  value: string
}

/** 设备事件联合类型 */
type DeviceEvent = MouseButtonEvent | MouseMoveEvent | KeyboardEvent

/**
 * 设备输入处理 Composable
 * 负责监听和处理键盘、鼠标等输入设备事件
 */
export function useDevice() {
  const modelStore = useModelStore()
  /** 按键释放定时器集合，用于自动释放按键 */
  const releaseTimers = new Map<string, NodeJS.Timeout>()
  const catStore = useCatStore()
  const { handlePress, handleRelease, handleMouseChange, handleMouseMove } = useModel()

  /**
   * 开始监听设备输入事件
   */
  const startListening = () => {
    invoke(INVOKE_KEY.START_DEVICE_LISTENING)
  }

  /**
   * 获取支持按键的映射键
   * 将不支持的按键转换为支持的按键（如 F1 -> Fn）
   */
  const getSupportedKey = (key: string) => {
    let nextKey = key

    const unsupportedKey = !modelStore.supportKeys[nextKey]

    if (key.startsWith('F') && unsupportedKey) {
      nextKey = key.replace(/F(\d+)/, 'Fn')
    }

    for (const item of ['Meta', 'Shift', 'Alt', 'Control']) {
      if (key.startsWith(item) && unsupportedKey) {
        const regex = new RegExp(`^(${item}).*`)
        nextKey = key.replace(regex, '$1')
      }
    }

    return nextKey
  }

  /**
   * 处理鼠标移动事件
   * 包括鼠标位置追踪和鼠标悬停隐藏功能
   */
  const handleCursorMove = async () => {
    const cursorPoint = await cursorPosition()

    handleMouseMove(cursorPoint)

    // 鼠标悬停时隐藏窗口功能
    if (catStore.window.hideOnHover) {
      const appWindow = getCurrentWebviewWindow()
      const position = await appWindow.outerPosition()
      const { width, height } = await appWindow.innerSize()

      // 检查鼠标是否在窗口范围内
      const isInWindow = inBetween(cursorPoint.x, position.x, position.x + width)
        && inBetween(cursorPoint.y, position.y, position.y + height)

      // 设置窗口透明度
      document.body.style.setProperty('opacity', isInWindow ? '0' : 'unset')

      // 设置是否穿透鼠标事件
      if (!catStore.window.passThrough) {
        appWindow.setIgnoreCursorEvents(isInWindow)
      }
    }
  }

  /**
   * 处理按键自动释放
   * 用于 Windows 系统下按住按键一段时间后自动释放
   */
  const handleAutoRelease = (key: string, delay = 100) => {
    handlePress(key)

    if (releaseTimers.has(key)) {
      clearTimeout(releaseTimers.get(key))
    }

    const timer = setTimeout(() => {
      handleRelease(key)

      releaseTimers.delete(key)
    }, delay)

    releaseTimers.set(key, timer)
  }

  // 监听设备变化事件
  useTauriListen<DeviceEvent>(LISTEN_KEY.DEVICE_CHANGED, ({ payload }) => {
    const { kind, value } = payload

    if (kind === 'KeyboardPress' || kind === 'KeyboardRelease') {
      const nextValue = getSupportedKey(value)

      if (!nextValue) return

      if (nextValue === 'CapsLock') {
        return handleAutoRelease(nextValue)
      }

      if (kind === 'KeyboardPress') {
        if (isWindows) {
          const delay = catStore.model.autoReleaseDelay * 1000

          return handleAutoRelease(nextValue, delay)
        }

        return handlePress(nextValue)
      }

      return handleRelease(nextValue)
    }

    switch (kind) {
      case 'MousePress':
        return handleMouseChange(value)
      case 'MouseRelease':
        return handleMouseChange(value, false)
      case 'MouseMove':
        return handleCursorMove()
    }
  })

  return {
    startListening,
  }
}
