/**
 * 统计数据计算模块
 */

/**
 * 获取指定日期范围内的记录
 */
function getRecordsInRange(history, startTime, endTime) {
  return history.filter(h => h.timestamp >= startTime && h.timestamp < endTime)
}

/**
 * 计算记录的统计信息
 */
function calculateStats(records) {
  const count = records.length
  const duration = records.reduce((sum, h) => sum + (h.duration || 0), 0)
  return { count, duration: Math.round(duration / 60) } // 转换为分钟
}

/**
 * 获取日统计数据（本月每一天）
 */
export function getDayStats(history) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(year, month, day + 1)

    const dayRecords = getRecordsInRange(history, date.getTime(), nextDate.getTime())
    const stats = calculateStats(dayRecords)

    days.push({
      label: `${day}`,
      count: stats.count,
      duration: stats.duration
    })
  }

  return {
    data: days,
    title: `${year}年${month + 1}月`
  }
}

/**
 * 获取周统计数据（最近4周）
 */
export function getWeekStats(history) {
  const now = new Date()
  const weeks = []

  for (let i = 3; i >= 0; i--) {
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() - i * 7)
    endDate.setHours(23, 59, 59, 999)

    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 6)
    startDate.setHours(0, 0, 0, 0)

    const weekRecords = getRecordsInRange(history, startDate.getTime(), endDate.getTime())
    const stats = calculateStats(weekRecords)

    weeks.push({
      label: `第${4 - i}周`,
      count: stats.count,
      duration: stats.duration
    })
  }

  return {
    data: weeks,
    title: `${now.getFullYear()}年`
  }
}

/**
 * 获取月统计数据（本年1-12月）
 */
export function getMonthStats(history) {
  const now = new Date()
  const year = now.getFullYear()
  const months = []

  for (let month = 0; month < 12; month++) {
    const date = new Date(year, month, 1)
    const nextMonth = new Date(year, month + 1, 1)

    const monthRecords = getRecordsInRange(history, date.getTime(), nextMonth.getTime())
    const stats = calculateStats(monthRecords)

    months.push({
      label: `${month + 1}月`,
      count: stats.count,
      duration: stats.duration
    })
  }

  return {
    data: months,
    title: `${year}年`
  }
}

/**
 * 获取统计数据（支持按类型和任务筛选）
 */
export function getStatsData(history, type = 'day', taskId = null) {
  let filteredHistory = history

  // 如果指定了任务ID，筛选该任务的记录
  if (taskId !== null) {
    filteredHistory = history.filter(h => h.taskId === taskId)
  }

  switch (type) {
    case 'day':
      return getDayStats(filteredHistory)
    case 'week':
      return getWeekStats(filteredHistory)
    case 'month':
      return getMonthStats(filteredHistory)
    default:
      return getDayStats(filteredHistory)
  }
}

/**
 * 获取任务的总统计
 */
export function getTaskStats(history, taskId) {
  const taskRecords = history.filter(h => h.taskId === taskId)
  const stats = calculateStats(taskRecords)
  return stats
}
