import type { TrayIconOptions } from '@tauri-apps/api/tray'

import { getName, getVersion } from '@tauri-apps/api/app'
import { emit } from '@tauri-apps/api/event'
import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'
import { resolveResource } from '@tauri-apps/api/path'
import { TrayIcon } from '@tauri-apps/api/tray'
import { openUrl } from '@tauri-apps/plugin-opener'
import { exit, relaunch } from '@tauri-apps/plugin-process'
import { watchDebounced } from '@vueuse/core'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { GITHUB_LINK, LISTEN_KEY } from '../constants'
import { showWindow } from '../plugins/window'
import { isMac } from '../utils/platform'

import { useSharedMenu } from './useSharedMenu'

import { useCatStore } from '@/stores/cat'
import { useGeneralStore } from '@/stores/general'

/** 系统托盘图标 ID */
const TRAY_ID = 'BONGO_CAT_TRAY'

/**
 * 系统托盘 Composable
 * 负责创建和管理系统托盘图标及菜单
 */
export function useTray() {
  const catStore = useCatStore()
  const generalStore = useGeneralStore()
  const { getSharedMenu } = useSharedMenu()
  const { t } = useI18n()

  // 监听窗口可见性、穿透、语言变化，更新托盘菜单
  watch([() => catStore.window.visible, () => catStore.window.passThrough, () => generalStore.appearance.language], () => {
    updateTrayMenu()
  })

  // 防抖监听窗口缩放和透明度变化
  watchDebounced([() => catStore.window.scale, () => catStore.window.opacity], () => {
    updateTrayMenu()
  }, { debounce: 200 })

  /**
   * 创建系统托盘图标
   */
  const createTray = async () => {
    const tray = await getTrayById()

    if (tray) return

    const appName = await getName()
    const appVersion = await getVersion()

    const menu = await getTrayMenu()

    const path = isMac ? 'assets/tray-mac.png' : 'assets/tray.png'
    const icon = await resolveResource(path)

    const options: TrayIconOptions = {
      menu,
      icon,
      id: TRAY_ID,
      tooltip: `${appName} v${appVersion}`,
      iconAsTemplate: true,
      menuOnLeftClick: true,
    }

    return TrayIcon.new(options)
  }

  /**
   * 根据 ID 获取托盘图标实例
   */
  const getTrayById = () => {
    return TrayIcon.getById(TRAY_ID)
  }

  /**
   * 获取托盘菜单配置
   */
  const getTrayMenu = async () => {
    const appVersion = await getVersion()

    const items = await Promise.all([
      ...await getSharedMenu(),
      PredefinedMenuItem.new({ item: 'Separator' }),
      MenuItem.new({
        text: t('composables.useTray.checkUpdate'),
        action: () => {
          showWindow()

          emit(LISTEN_KEY.UPDATE_APP)
        },
      }),
      MenuItem.new({
        text: t('composables.useTray.openSource'),
        action: () => openUrl(GITHUB_LINK),
      }),
      PredefinedMenuItem.new({ item: 'Separator' }),
      MenuItem.new({
        text: `v${appVersion}`,
        enabled: false,
      }),
      MenuItem.new({
        text: t('composables.useTray.restartApp'),
        action: relaunch,
      }),
      MenuItem.new({
        text: t('composables.useTray.quitApp'),
        accelerator: isMac ? 'Cmd+Q' : '',
        action: () => exit(0),
      }),
    ])

    return Menu.new({ items })
  }

  /**
   * 更新托盘菜单
   */
  const updateTrayMenu = async () => {
    const tray = await getTrayById()

    if (!tray) return

    const menu = await getTrayMenu()

    tray.setMenu(menu)
  }

  return {
    createTray,
  }
}
