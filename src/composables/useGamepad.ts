import type { LiteralUnion } from 'ant-design-vue/es/_util/type'

import { invoke } from '@tauri-apps/api/core'
import { computed, reactive, watch } from 'vue'

import { useModel } from './useModel'
import { useTauriListen } from './useTauriListen'

import { INVOKE_KEY, LISTEN_KEY } from '@/constants'
import { useModelStore } from '@/stores/model'
import live2d from '@/utils/live2d'

/** 手柄事件名称类型 */
type GamepadEventName = LiteralUnion<'LeftStickX' | 'LeftStickY' | 'RightStickX' | 'RightStickY' | 'LeftThumb' | 'RightThumb'>

/** 手柄事件接口 */
interface GamepadEvent {
  kind: 'ButtonChanged' | 'AxisChanged'
  name: GamepadEventName
  value: number
}

/** 摇杆状态接口 */
interface StickState {
  x: number
  y: number
  moved: boolean
  pressed: boolean
}

/** 双摇杆状态接口 */
interface Sticks {
  left: StickState
  right: StickState
}

/** 摇杆初始状态 */
const INITIAL_STICK_STATE: StickState = { x: 0, y: 0, moved: false, pressed: false }

/**
 * 手柄输入处理 Composable
 * 负责监听和处理游戏手柄的输入事件
 */
export function useGamepad() {
  const { currentModel } = useModelStore()
  const { handlePress, handleRelease, handleAxisChange } = useModel()

  // 左右摇杆状态
  const sticks = reactive<Sticks>({
    left: { ...INITIAL_STICK_STATE },
    right: { ...INITIAL_STICK_STATE },
  })

  // 计算摇杆是否处于活动状态
  const stickActive = computed(() => ({
    left: sticks.left.moved || sticks.left.pressed,
    right: sticks.right.moved || sticks.right.pressed,
  }))

  // 监听模型模式变化，切换手柄监听状态
  watch(() => currentModel?.mode, (mode) => {
    if (mode === 'gamepad') {
      return invoke(INVOKE_KEY.START_GAMEPAD_LISTING)
    }

    invoke(INVOKE_KEY.STOP_GAMEPAD_LISTING)
  }, { immediate: true })

  // 监听左摇杆状态变化
  watch(sticks.left, ({ x, y, moved, pressed }) => {
    sticks.left.moved = x !== 0 || y !== 0

    live2d.setParameterValue('CatParamStickShowLeftHand', moved || pressed)
  }, { deep: true })

  // 监听右摇杆状态变化
  watch(sticks.right, ({ x, y, moved, pressed }) => {
    sticks.right.moved = x !== 0 || y !== 0

    live2d.setParameterValue('CatParamStickShowRightHand', moved || pressed)
  }, { deep: true })

  // 监听手柄事件变化
  useTauriListen<GamepadEvent>(LISTEN_KEY.GAMEPAD_CHANGED, ({ payload }) => {
    const { name, value } = payload

    switch (name) {
      case 'LeftStickX':
        sticks.left.x = value

        return handleAxisChange('CatParamStickLX', value)
      case 'LeftStickY':
        sticks.left.y = value

        return handleAxisChange('CatParamStickLY', value)
      case 'RightStickX':
        sticks.right.x = value

        return handleAxisChange('CatParamStickRX', value)
      case 'RightStickY':
        sticks.right.y = value

        return handleAxisChange('CatParamStickRY', value)
      case 'LeftThumb':
        sticks.left.pressed = value !== 0

        return live2d.setParameterValue('CatParamStickLeftDown', value !== 0)
      case 'RightThumb':
        sticks.right.pressed = value !== 0

        return live2d.setParameterValue('CatParamStickRightDown', value !== 0)
      default:
        return value > 0 ? handlePress(name) : handleRelease(name)
    }
  })

  return {
    stickActive,
  }
}
