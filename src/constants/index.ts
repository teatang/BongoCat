/** GitHub 仓库链接 */
export const GITHUB_LINK = 'https://github.com/ayangweb/BongoCat'

/** 升级链接访问密钥 */
export const UPGRADE_LINK_ACCESS_KEY = 'xDbrq2rOoRThDqKOHL2ZRA'

/** 事件监听键名 */
export const LISTEN_KEY = {
  SHOW_WINDOW: 'show-window',
  HIDE_WINDOW: 'hide-window',
  DEVICE_CHANGED: 'device-changed',
  UPDATE_APP: 'update-app',
  GAMEPAD_CHANGED: 'gamepad-changed',
}

/** Tauri 调用键名 */
export const INVOKE_KEY = {
  COPY_DIR: 'copy_dir',
  START_DEVICE_LISTENING: 'start_device_listening',
  START_GAMEPAD_LISTING: 'start_gamepad_listing',
  STOP_GAMEPAD_LISTING: 'stop_gamepad_listing',
}

/** 支持的语言类型 */
export const LANGUAGE = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
  VI_VN: 'vi-VN',
  PT_BR: 'pt-BR',
} as const
