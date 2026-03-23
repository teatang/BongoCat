import { resolveResource } from '@tauri-apps/api/path'
import { filter, find } from 'es-toolkit/compat'
import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

import { join } from '@/utils/path'

/** 模型模式类型：标准模式、键盘模式、手柄模式 */
export type ModelMode = 'standard' | 'keyboard' | 'gamepad'

/** 模型接口 */
export interface Model {
  id: string
  path: string
  mode: ModelMode
  isPreset: boolean
}

/** 动作接口 */
interface Motion {
  Name: string
  File: string
  Sound?: string
  FadeInTime: number
  FadeOutTime: number
  Description?: string
}

/** 动作组类型 */
type MotionGroup = Record<string, Motion[]>

/** 表情接口 */
interface Expression {
  Name: string
  File: string
  Description?: string
}

/**
 * 模型状态管理 Store
 * 管理 Live2D 模型的加载、切换和状态
 */
export const useModelStore = defineStore('model', () => {
  const models = ref<Model[]>([])
  const currentModel = ref<Model>()
  const motions = ref<MotionGroup>({})
  const expressions = ref<Expression[]>([])
  const supportKeys = reactive<Record<string, string>>({})
  const pressedKeys = reactive<Record<string, string>>({})

  const init = async () => {
    const modelsPath = await resolveResource('assets/models')

    const nextModels = filter(models.value, { isPreset: false })
    const presetModels = filter(models.value, { isPreset: true })

    const modes: ModelMode[] = ['gamepad', 'keyboard', 'standard']

    for (const mode of modes) {
      const matched = find(presetModels, { mode })

      nextModels.unshift({
        id: matched?.id ?? nanoid(),
        mode,
        isPreset: true,
        path: join(modelsPath, mode),
      })
    }

    const matched = find(nextModels, { id: currentModel.value?.id })

    currentModel.value = matched ?? nextModels[0]

    models.value = nextModels
  }

  return {
    models,
    currentModel,
    motions,
    expressions,
    supportKeys,
    pressedKeys,
    init,
  }
}, {
  tauri: {
    filterKeys: ['models', 'currentModel'],
    filterKeysStrategy: 'pick',
  },
})
