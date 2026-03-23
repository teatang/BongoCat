import { platform } from '@tauri-apps/plugin-os'

/** 是否为 macOS 系统 */
export const isMac = platform() === 'macos'

/** 是否为 Windows 系统 */
export const isWindows = platform() === 'windows'

/** 是否为 Linux 系统 */
export const isLinux = platform() === 'linux'
