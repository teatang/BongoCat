import type { PhysicalPosition } from '@tauri-apps/api/dpi'

import { LogicalSize } from '@tauri-apps/api/dpi'
import { resolveResource, sep } from '@tauri-apps/api/path'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { message } from 'ant-design-vue'
import { isNil, round } from 'es-toolkit'
import { nth } from 'es-toolkit/compat'
import { ref } from 'vue'

import live2d from '../utils/live2d'

import { useCatStore } from '@/stores/cat'
import { useModelStore } from '@/stores/model'
import { getCursorMonitor } from '@/utils/monitor'

// 获取当前窗口实例
const appWindow = getCurrentWebviewWindow()

/** 模型尺寸接口 */
export interface ModelSize {
  width: number
  height: number
}

/**
 * 模型操作 Composable
 * 负责 Live2D 模型的加载、销毁、调整大小以及按键/鼠标/手柄事件处理
 */
export function useModel() {
  const modelStore = useModelStore()
  const catStore = useCatStore()
  const modelSize = ref<ModelSize>()

  /**
   * 加载 Live2D 模型
   */
  async function handleLoad() {
    try {
      if (!modelStore.currentModel) return

      const { path } = modelStore.currentModel

      await resolveResource(path)

      const { width, height, ...rest } = await live2d.load(path)

      modelSize.value = { width, height }

      handleResize()

      Object.assign(modelStore, rest)
    } catch (error) {
      message.error(String(error))
    }
  }

  /**
   * 销毁当前模型
   */
  function handleDestroy() {
    live2d.destroy()
  }

  /**
   * 调整模型大小以适应窗口
   */
  async function handleResize() {
    if (!modelSize.value) return

    live2d.resizeModel(modelSize.value)

    const { width, height } = modelSize.value

    if (round(innerWidth / innerHeight, 1) !== round(width / height, 1)) {
      await appWindow.setSize(
        new LogicalSize({
          width: innerWidth,
          height: Math.ceil(innerWidth * (height / width)),
        }),
      )
    }

    const size = await appWindow.size()

    catStore.window.scale = round((size.width / width) * 100)
  }

  /**
   * 处理按键按下事件
   */
  const handlePress = (key: string) => {
    const path = modelStore.supportKeys[key]

    if (!path) return

    if (catStore.model.single) {
      const dirName = nth(path.split(sep()), -2)!

      const filterKeys = Object.entries(modelStore.pressedKeys).filter(([, value]) => {
        return value.includes(dirName)
      })

      for (const [key] of filterKeys) {
        handleRelease(key)
      }
    }

    modelStore.pressedKeys[key] = path
  }

  /**
   * 处理按键释放事件
   */
  const handleRelease = (key: string) => {
    delete modelStore.pressedKeys[key]
  }

  /**
   * 处理键盘按键变化（左右手）
   * @param isLeft 是否为左手按键
   * @param pressed 是否按下
   */
  function handleKeyChange(isLeft = true, pressed = true) {
    const id = isLeft ? 'CatParamLeftHandDown' : 'CatParamRightHandDown'

    live2d.setParameterValue(id, pressed)
  }

  /**
   * 处理鼠标按键变化
   * @param key 鼠标按键（左/右）
   * @param pressed 是否按下
   */
  function handleMouseChange(key: string, pressed = true) {
    const id = key === 'Left' ? 'ParamMouseLeftDown' : 'ParamMouseRightDown'

    live2d.setParameterValue(id, pressed)
  }

  /**
   * 处理鼠标移动事件
   * 根据鼠标在屏幕上的位置更新 Live2D 模型的参数
   * @param cursorPoint 鼠标当前坐标
   */
  async function handleMouseMove(cursorPoint: PhysicalPosition) {
    const monitor = await getCursorMonitor(cursorPoint)

    if (!monitor) return

    const { size, position } = monitor

    const xRatio = (cursorPoint.x - position.x) / size.width
    const yRatio = (cursorPoint.y - position.y) / size.height

    for (const id of ['ParamMouseX', 'ParamMouseY', 'ParamAngleX', 'ParamAngleY']) {
      const { min, max } = live2d.getParameterRange(id)

      if (isNil(min) || isNil(max)) continue

      const isXAxis = id.endsWith('X')

      const ratio = isXAxis ? xRatio : yRatio
      let value = max - (ratio * (max - min))

      if (isXAxis && catStore.model.mouseMirror) {
        value *= -1
      }

      live2d.setParameterValue(id, value)
    }
  }

  /**
   * 处理摇杆轴变化事件
   * @param id 参数 ID
   * @param value 轴值
   */
  async function handleAxisChange(id: string, value: number) {
    const { min, max } = live2d.getParameterRange(id)

    live2d.setParameterValue(id, Math.max(min, value * max))
  }

  return {
    modelSize,
    handlePress,
    handleRelease,
    handleLoad,
    handleDestroy,
    handleResize,
    handleKeyChange,
    handleMouseChange,
    handleMouseMove,
    handleAxisChange,
  }
}
