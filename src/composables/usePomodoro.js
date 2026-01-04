import { ref, computed, watch } from 'vue'
import { useTodo } from './useTodo'

// 共享的状态数据
const pomodoroHistory = ref([])
const soundEnabled = ref(true)
const isRunning = ref(false)
const minutes = ref(25)
const seconds = ref(0)
const completedPomodoros = ref(0)
const totalFocusTime = ref(0)
const initialMinutes = ref(25)
const initialSeconds = ref(0)

let endTime = null // 计时器结束的目标时间
const originalTitle = 'Todo'

// Web Worker 用于后台计时
let timerWorker = null

// 预加载的音频对象，用于解决后台标签页无法播放的问题
let preloadedAudio = null

function preloadAudio() {
  if (!preloadedAudio) {
    preloadedAudio = new Audio('/Cuckoo.mp3')
    preloadedAudio.load()
  }
}

function getTimerWorker() {
  if (!timerWorker) {
    const workerCode = `
      let timer = null
      self.onmessage = function(e) {
        if (e.data.type === 'start') {
          if (timer) clearInterval(timer)
          timer = setInterval(() => self.postMessage({ type: 'tick' }), 1000)
        } else if (e.data.type === 'stop') {
          if (timer) { clearInterval(timer); timer = null }
        }
      }
    `
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    timerWorker = new Worker(URL.createObjectURL(blob))
  }
  return timerWorker
}

// 页面关闭前保存数据的处理函数
function handleBeforeUnload() {
  if (isRunning.value && endTime) {
    localStorage.setItem('pomodoroData', JSON.stringify({
      completedPomodoros: completedPomodoros.value,
      totalFocusTime: totalFocusTime.value,
      history: pomodoroHistory.value,
      soundEnabled: soundEnabled.value,
      initialMinutes: initialMinutes.value,
      initialSeconds: initialSeconds.value,
      currentMinutes: minutes.value,
      currentSeconds: seconds.value,
      wasRunning: isRunning.value,
      endTime: endTime
    }))
  }
}

export function usePomodoro() {
  const { selectedTaskId } = useTodo()

  // 显示时间
  const displayTime = computed(() => {
    const m = String(minutes.value).padStart(2, '0')
    const s = String(seconds.value).padStart(2, '0')
    return `${m}:${s}`
  })

  // 格式化总时间
  const formattedTotalTime = computed(() => {
    const hours = Math.floor(totalFocusTime.value / 3600)
    const mins = Math.floor((totalFocusTime.value % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  })

  // 根据选中任务过滤的番茄数
  const filteredCompletedPomodoros = computed(() => {
    if (selectedTaskId.value === null) {
      return completedPomodoros.value
    }
    return pomodoroHistory.value.filter(h => h.taskId === selectedTaskId.value).length
  })

  // 根据选中任务过滤的专注时间
  const filteredTotalTime = computed(() => {
    if (selectedTaskId.value === null) {
      return formattedTotalTime.value
    }
    const taskRecords = pomodoroHistory.value.filter(h => h.taskId === selectedTaskId.value)
    const totalSeconds = taskRecords.reduce((sum, h) => sum + (h.duration || 0), 0)
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  })

  // 开始/暂停
  function toggleTimer() {
    if (isRunning.value) {
      pause()
    } else {
      start()
    }
  }

  // 更新浏览器标题
  function updateTitle() {
    if (isRunning.value) {
      document.title = `${displayTime.value} - Todo`
    } else {
      document.title = originalTitle
    }
  }

  // 根据 endTime 更新剩余时间
  function updateRemainingTime() {
    if (!endTime || !isRunning.value) return

    const now = Date.now()
    const remaining = Math.max(0, endTime - now)

    // 计算从上次更新到现在经过的时间
    const prevTotal = minutes.value * 60 + seconds.value
    const newTotalSeconds = Math.ceil(remaining / 1000)
    const elapsed = prevTotal - newTotalSeconds
    if (elapsed > 0) {
      totalFocusTime.value += elapsed
    }

    if (remaining <= 0) {
      complete()
      return
    }

    minutes.value = Math.floor(newTotalSeconds / 60)
    seconds.value = newTotalSeconds % 60
    updateTitle()
    saveData()
  }

  // 处理页面可见性变化
  function handleVisibilityChange() {
    if (!document.hidden && isRunning.value && endTime) {
      // 页面可见时，更新剩余时间
      updateRemainingTime()
    }
  }

  // 每秒执行的 tick 函数
  function tick() {
    if (!isRunning.value) return

    const now = Date.now()
    const remaining = Math.max(0, endTime - now)

    if (remaining <= 0) {
      complete()
      return
    }

    const totalSeconds = Math.ceil(remaining / 1000)
    const newMinutes = Math.floor(totalSeconds / 60)
    const newSeconds = totalSeconds % 60

    // 计算实际过去的秒数来更新 totalFocusTime
    const prevTotal = minutes.value * 60 + seconds.value
    const currTotal = newMinutes * 60 + newSeconds
    const elapsed = prevTotal - currTotal
    if (elapsed > 0) {
      totalFocusTime.value += elapsed
    }

    minutes.value = newMinutes
    seconds.value = newSeconds
    updateTitle()
    saveData()
  }

  function start() {
    if (minutes.value === 0 && seconds.value === 0) {
      reset()
    }
    isRunning.value = true

    // 在用户交互时预加载音频，确保后台也能播放
    preloadAudio()

    // 计算结束时间
    const totalSeconds = minutes.value * 60 + seconds.value
    endTime = Date.now() + totalSeconds * 1000

    // 添加页面可见性监听
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 添加页面关闭前保存数据的监听
    window.removeEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('beforeunload', handleBeforeUnload)

    updateTitle()
    saveData()

    // 使用 Web Worker 进行后台计时
    const worker = getTimerWorker()
    worker.onmessage = () => tick()
    worker.postMessage({ type: 'start' })
  }

  function pause() {
    isRunning.value = false
    endTime = null

    // 停止 Web Worker
    const worker = getTimerWorker()
    worker.postMessage({ type: 'stop' })

    updateTitle()
    saveData()
  }

  function reset() {
    pause()
    minutes.value = initialMinutes.value
    seconds.value = initialSeconds.value
    updateTitle()
    saveData()
  }

  function complete() {
    pause()
    completedPomodoros.value++
    // 记录完成时间、时长和关联的任务
    const duration = initialMinutes.value * 60 + initialSeconds.value
    pomodoroHistory.value.push({
      timestamp: Date.now(),
      duration: duration,
      taskId: selectedTaskId.value || null
    })
    playSound()
    reset()
    saveData()
  }

  function playSound() {
    if (!soundEnabled.value) return
    try {
      // 使用预加载的音频对象播放，确保后台标签页也能正常播放
      if (preloadedAudio) {
        preloadedAudio.currentTime = 0
        preloadedAudio.play()
      } else {
        const audio = new Audio('/Cuckoo.mp3')
        audio.play()
      }
    } catch (e) {
      // 静默失败
    }
  }

  // 切换声音开关
  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
    saveData()
  }

  // 设置时间（双击编辑）
  function setTime(newMinutes, newSeconds = 0) {
    // 限制最大 99:59
    const m = Math.min(99, Math.max(0, newMinutes))
    const s = Math.min(59, Math.max(0, newSeconds))

    initialMinutes.value = m
    initialSeconds.value = s

    if (!isRunning.value) {
      minutes.value = m
      seconds.value = s
    }
  }

  // 解析时间字符串 "MM:SS"
  function parseTimeString(timeStr) {
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      const m = parseInt(parts[0]) || 0
      const s = parseInt(parts[1]) || 0
      return { minutes: Math.min(99, m), seconds: Math.min(59, s) }
    }
    return null
  }

  // 加载保存的数据
  function loadData() {
    const saved = localStorage.getItem('pomodoroData')
    if (saved) {
      const data = JSON.parse(saved)
      completedPomodoros.value = data.completedPomodoros || 0
      totalFocusTime.value = data.totalFocusTime || 0
      pomodoroHistory.value = data.history || []
      if (data.soundEnabled !== undefined) {
        soundEnabled.value = data.soundEnabled
      }
      if (data.initialMinutes !== undefined) {
        initialMinutes.value = data.initialMinutes
      }
      if (data.initialSeconds !== undefined) {
        initialSeconds.value = data.initialSeconds
      }

      // 如果之前在计时且有保存的 endTime
      if (data.wasRunning && data.endTime) {
        const now = Date.now()
        const remaining = data.endTime - now

        if (remaining > 0) {
          // 还有剩余时间，恢复计时
          const totalSeconds = Math.ceil(remaining / 1000)
          minutes.value = Math.floor(totalSeconds / 60)
          seconds.value = totalSeconds % 60
          endTime = data.endTime
          isRunning.value = true

          // 预加载音频
          preloadAudio()

          // 添加页面可见性监听
          document.addEventListener('visibilitychange', handleVisibilityChange)
          // 添加页面关闭前保存数据的监听
          window.addEventListener('beforeunload', handleBeforeUnload)

          updateTitle()

          // 使用 Web Worker 进行后台计时
          const worker = getTimerWorker()
          worker.onmessage = () => tick()
          worker.postMessage({ type: 'start' })
        } else {
          // 时间已经过了，完成计时
          minutes.value = 0
          seconds.value = 0
          complete()
        }
      } else {
        // 恢复当前计时器状态
        if (data.currentMinutes !== undefined) {
          minutes.value = data.currentMinutes
        } else {
          minutes.value = initialMinutes.value
        }
        if (data.currentSeconds !== undefined) {
          seconds.value = data.currentSeconds
        } else {
          seconds.value = initialSeconds.value
        }
      }
    }
  }

  // 保存数据
  function saveData() {
    localStorage.setItem('pomodoroData', JSON.stringify({
      completedPomodoros: completedPomodoros.value,
      totalFocusTime: totalFocusTime.value,
      history: pomodoroHistory.value,
      soundEnabled: soundEnabled.value,
      initialMinutes: initialMinutes.value,
      initialSeconds: initialSeconds.value,
      currentMinutes: minutes.value,
      currentSeconds: seconds.value,
      wasRunning: isRunning.value,
      endTime: endTime
    }))
  }

  // 获取统计数据 (可按任务筛选)
  function getStatsData(type = 'day', taskId = null) {
    const now = new Date()
    let history = pomodoroHistory.value

    // 如果指定了任务ID，筛选该任务的记录
    if (taskId !== null) {
      history = history.filter(h => h.taskId === taskId)
    }

    if (type === 'day') {
      // 本月每一天
      const year = now.getFullYear()
      const month = now.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const days = []

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        date.setHours(0, 0, 0, 0)
        const nextDate = new Date(year, month, day + 1)

        const dayRecords = history.filter(h =>
          h.timestamp >= date.getTime() && h.timestamp < nextDate.getTime()
        )
        const count = dayRecords.length
        const duration = dayRecords.reduce((sum, h) => sum + (h.duration || 0), 0)

        days.push({
          label: `${day}`,
          count,
          duration: Math.round(duration / 60)
        })
      }
      return { data: days, title: `${year}年${month + 1}月` }
    } else if (type === 'week') {
      // 最近4周
      const weeks = []
      for (let i = 3; i >= 0; i--) {
        const endDate = new Date(now)
        endDate.setDate(endDate.getDate() - i * 7)
        endDate.setHours(23, 59, 59, 999)
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - 6)
        startDate.setHours(0, 0, 0, 0)

        const weekRecords = history.filter(h =>
          h.timestamp >= startDate.getTime() && h.timestamp <= endDate.getTime()
        )
        const count = weekRecords.length
        const duration = weekRecords.reduce((sum, h) => sum + (h.duration || 0), 0)

        weeks.push({
          label: `第${4 - i}周`,
          count,
          duration: Math.round(duration / 60)
        })
      }
      return { data: weeks, title: `${now.getFullYear()}年` }
    } else {
      // 本年1-12月
      const year = now.getFullYear()
      const months = []

      for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 1)
        const nextMonth = new Date(year, month + 1, 1)

        const monthRecords = history.filter(h =>
          h.timestamp >= date.getTime() && h.timestamp < nextMonth.getTime()
        )
        const count = monthRecords.length
        const duration = monthRecords.reduce((sum, h) => sum + (h.duration || 0), 0)

        months.push({
          label: `${month + 1}月`,
          count,
          duration: Math.round(duration / 60)
        })
      }
      return { data: months, title: `${year}年` }
    }
  }

  // 获取任务的总统计
  function getTaskStats(taskId) {
    const taskRecords = pomodoroHistory.value.filter(h => h.taskId === taskId)
    const count = taskRecords.length
    const duration = taskRecords.reduce((sum, h) => sum + (h.duration || 0), 0)
    return {
      count,
      duration: Math.round(duration / 60) // 分钟
    }
  }

  return {
    minutes,
    seconds,
    isRunning,
    completedPomodoros,
    totalFocusTime,
    pomodoroHistory,
    soundEnabled,
    displayTime,
    formattedTotalTime,
    filteredCompletedPomodoros,
    filteredTotalTime,
    initialMinutes,
    initialSeconds,
    toggleTimer,
    reset,
    setTime,
    toggleSound,
    parseTimeString,
    loadData,
    saveData,
    getStatsData,
    getTaskStats
  }
}
