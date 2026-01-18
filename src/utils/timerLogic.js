/**
 * 计时器核心逻辑模块
 */

import { minutesSecondsToSeconds, secondsToMinutesSeconds } from './timeUtils'

/**
 * 计算剩余时间
 */
export function calculateRemainingTime(endTime) {
  if (!endTime) return 0
  const now = Date.now()
  return Math.max(0, endTime - now)
}

/**
 * 根据剩余毫秒数计算分钟和秒
 */
export function getRemainingMinutesSeconds(remainingMs) {
  const totalSeconds = Math.ceil(remainingMs / 1000)
  return secondsToMinutesSeconds(totalSeconds)
}

/**
 * 计算已经过去的时间（秒）
 */
export function calculateElapsedSeconds(prevMinutes, prevSeconds, newMinutes, newSeconds) {
  const prevTotal = minutesSecondsToSeconds(prevMinutes, prevSeconds)
  const newTotal = minutesSecondsToSeconds(newMinutes, newSeconds)
  const elapsed = prevTotal - newTotal
  return Math.max(0, elapsed)
}

/**
 * 检查计时是否完成
 */
export function isTimerComplete(remainingMs) {
  return remainingMs <= 0
}

/**
 * 计算计时结束时间
 */
export function calculateEndTime(minutes, seconds) {
  const totalSeconds = minutesSecondsToSeconds(minutes, seconds)
  return Date.now() + totalSeconds * 1000
}

/**
 * 检查是否需要恢复计时
 */
export function shouldResumeTimer(wasRunning, endTime) {
  if (!wasRunning || !endTime) return false
  const remaining = calculateRemainingTime(endTime)
  return remaining > 0
}
