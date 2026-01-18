/**
 * 时间工具函数集合
 */

/**
 * 格式化时间显示 MM:SS
 */
export function formatDisplayTime(minutes, seconds) {
  const m = String(minutes).padStart(2, '0')
  const s = String(seconds).padStart(2, '0')
  return `${m}:${s}`
}

/**
 * 格式化总时间 (小时和分钟)
 */
export function formatTotalTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

/**
 * 将秒数转换为分钟和秒
 */
export function secondsToMinutesSeconds(totalSeconds) {
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60
  }
}

/**
 * 将分钟和秒转换为总秒数
 */
export function minutesSecondsToSeconds(minutes, seconds) {
  return minutes * 60 + seconds
}

/**
 * 解析时间字符串 "MM:SS"
 */
export function parseTimeString(timeStr) {
  const parts = timeStr.split(':')
  if (parts.length === 2) {
    const m = parseInt(parts[0]) || 0
    const s = parseInt(parts[1]) || 0
    return { minutes: Math.min(99, m), seconds: Math.min(59, s) }
  }
  return null
}

/**
 * 验证和限制时间范围
 */
export function validateTimeRange(minutes, seconds) {
  const m = Math.min(99, Math.max(0, minutes))
  const s = Math.min(59, Math.max(0, seconds))
  return { minutes: m, seconds: s }
}
