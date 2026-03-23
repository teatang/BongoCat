import { castArray } from 'es-toolkit/compat'

/**
 * 清空对象的所有属性
 */
export function clearObject<T extends Record<string, unknown>>(targets: T | T[]) {
  for (const target of castArray<T>(targets)) {
    for (const key of Object.keys(target)) {
      delete target[key]
    }
  }
}
