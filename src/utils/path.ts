import { sep } from '@tauri-apps/api/path'

/**
 * 路径拼接函数
 * 跨平台处理路径分隔符
 */
export function join(...paths: string[]) {
  const joinPaths = paths.map((path, index) => {
    if (index === 0) {
      return path.replace(new RegExp(`${sep()}+$`), '')
    } else {
      return path.replace(new RegExp(`^${sep()}+|${sep()}+$`, 'g'), '')
    }
  })

  return joinPaths.join(sep())
}
