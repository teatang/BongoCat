import type { ShortcutHandler } from '@tauri-apps/plugin-global-shortcut'
import type { Ref } from 'vue'

import {
  isRegistered,
  register,
  unregister,
} from '@tauri-apps/plugin-global-shortcut'
import { ref, watch } from 'vue'

/**
 * 全局快捷键 Composable
 * 简化全局快捷键的注册和注销
 * @param shortcut 快捷键字符串的响应式引用
 * @param callback 快捷键触发时的回调函数
 */
export function useTauriShortcut(shortcut: Ref<string, string>, callback: ShortcutHandler) {
  const oldShortcut = ref(shortcut.value)

  watch(shortcut, async (value) => {
    if (oldShortcut.value) {
      const registered = await isRegistered(oldShortcut.value)

      if (registered) {
        await unregister(oldShortcut.value)
      }
    }

    if (!value) return

    await register(value, (event) => {
      if (event.state === 'Released') return

      callback(event)
    })

    oldShortcut.value = value
  }, { immediate: true })
}
