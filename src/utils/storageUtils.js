/**
 * 存储工具 - 带错误处理的 localStorage 操作
 */

const STORAGE_KEY = 'pomodoroData'

/**
 * 安全地从 localStorage 读取数据
 */
export function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load data from storage:', error)
  }
  return null
}

/**
 * 安全地保存数据到 localStorage
 */
export function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Failed to save data to storage:', error)
    return false
  }
}

/**
 * 清除存储数据
 */
export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Failed to clear storage:', error)
    return false
  }
}

/**
 * 验证存储的数据结构
 */
export function validateStorageData(data) {
  if (!data || typeof data !== 'object') {
    return false
  }

  // 检查必要字段
  const requiredFields = ['completedPomodoros', 'totalFocusTime', 'history']
  return requiredFields.every(field => field in data)
}
