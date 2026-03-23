import type { ModelSize } from '@/composables/useModel'
import type { Cubism4InternalModel } from 'pixi-live2d-display'

import { convertFileSrc } from '@tauri-apps/api/core'
import { readDir, readTextFile } from '@tauri-apps/plugin-fs'
import JSON5 from 'json5'
import { Cubism4ModelSettings, Live2DModel } from 'pixi-live2d-display'
import { Application, Ticker } from 'pixi.js'

import { join } from './path'

import { i18n } from '@/locales'

// 注册 Ticker 到 Live2DModel
Live2DModel.registerTicker(Ticker)

/**
 * Live2D 核心类
 * 封装了 PixiJS 与 Live2D 模型的所有交互操作
 */
class Live2d {
  private app: Application | null = null
  public model: Live2DModel | null = null

  constructor() { }

  /**
   * 初始化 PixiJS 应用
   */
  private initApp() {
    if (this.app) return

    const view = document.getElementById('live2dCanvas') as HTMLCanvasElement

    this.app = new Application({
      view,
      resizeTo: window,
      backgroundAlpha: 0,
      resolution: devicePixelRatio,
    })
  }

  /**
   * 加载 Live2D 模型
   * @param path 模型目录路径
   * @returns 模型尺寸和动作/表情数据
   */
  public async load(path: string) {
    this.initApp()

    this.destroy()

    const files = await readDir(path)

    const modelFile = files.find(file => file.name.endsWith('.model3.json'))

    if (!modelFile) {
      throw new Error(i18n.global.t('utils.live2d.hints.notFound'))
    }

    const modelPath = join(path, modelFile.name)

    const modelJSON = JSON5.parse(await readTextFile(modelPath))

    const modelSettings = new Cubism4ModelSettings({
      ...modelJSON,
      url: convertFileSrc(modelPath),
    })

    modelSettings.replaceFiles((file) => {
      return convertFileSrc(join(path, file))
    })

    this.model = await Live2DModel.from(modelSettings)

    this.app?.stage.addChild(this.model)

    const { width, height } = this.model
    const { motions, expressions } = modelSettings

    return {
      width,
      height,
      motions,
      expressions,
    }
  }

  /**
   * 销毁当前模型
   */
  public destroy() {
    if (!this.model) return

    this.model?.destroy()

    this.model = null
  }

  /**
   * 调整模型大小以适应窗口
   * @param modelSize 模型原始尺寸
   */
  public resizeModel(modelSize: ModelSize) {
    if (!this.model) return

    const { width, height } = modelSize

    const scaleX = innerWidth / width
    const scaleY = innerHeight / height
    const scale = Math.min(scaleX, scaleY)

    this.model.scale.set(scale)
    this.model.x = innerWidth / 2
    this.model.y = innerHeight / 2
    this.model.anchor.set(0.5)
  }

  /**
   * 播放动作
   * @param group 动作组名称
   * @param index 动作索引
   */
  public playMotion(group: string, index: number) {
    return this.model?.motion(group, index)
  }

  /**
   * 播放表情
   * @param index 表情索引
   */
  public playExpressions(index: number) {
    return this.model?.expression(index)
  }

  /**
   * 获取 Core 模型实例
   */
  public getCoreModel() {
    const internalModel = this.model?.internalModel as Cubism4InternalModel

    return internalModel?.coreModel
  }

  /**
   * 获取参数的范围（最小值和最大值）
   * @param id 参数 ID
   */
  public getParameterRange(id: string) {
    const coreModel = this.getCoreModel()

    const index = coreModel?.getParameterIndex(id)
    const min = coreModel?.getParameterMinimumValue(index)
    const max = coreModel?.getParameterMaximumValue(index)

    return {
      min,
      max,
    }
  }

  /**
   * 设置参数值
   * @param id 参数 ID
   * @param value 参数值
   */
  public setParameterValue(id: string, value: number | boolean) {
    const coreModel = this.getCoreModel()

    return coreModel?.setParameterValueById?.(id, Number(value))
  }
}

// 创建 Live2D 单例
const live2d = new Live2d()

export default live2d
