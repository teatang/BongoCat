/**
 * 检查字符串是否为图片格式
 */
export function isImage(value: string) {
  const regex = /\.(?:jpe?g|png|webp|avif|gif|svg|bmp|ico|tiff?|heic|apng)$/i

  return regex.test(value)
}

/**
 * 检查数值是否在范围内
 */
export function inBetween(value: number, minimum: number, maximum: number) {
  return value >= minimum && value <= maximum
}
