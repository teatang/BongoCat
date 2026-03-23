import type { PhysicalPosition } from '@tauri-apps/api/window'

import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { cursorPosition, monitorFromPoint } from '@tauri-apps/api/window'

/**
 * 获取鼠标所在屏幕监视器信息
 * @param cursorPoint 可选的鼠标坐标，默认获取当前鼠标位置
 * @returns 监视器信息
 */
export async function getCursorMonitor(cursorPoint?: PhysicalPosition) {
  cursorPoint ??= await cursorPosition()

  const appWindow = getCurrentWebviewWindow()

  const scaleFactor = await appWindow.scaleFactor()

  const { x, y } = cursorPoint.toLogical(scaleFactor)

  const monitor = await monitorFromPoint(x, y)

  if (!monitor) return

  return monitor
}
