import { ref, computed, watch } from 'vue'
import { useTodo } from './useTodo'
import { formatDisplayTime, formatTotalTime, validateTimeRange } from '@/utils/timeUtils'
import { loadFromStorage, saveToStorage, validateStorageData } from '@/utils/storageUtils'
import { playSound, preloadAudio } from '@/utils/audioUtils'
import { calculateRemainingTime, getRemainingMinutesSeconds, calculateElapsedSeconds, calculateEndTime, shouldResumeTimer, isTimerComplete } from '@/utils/timerLogic'
import { getStatsData, getTaskStats } from '@/utils/statsUtils'

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

let endTime = null
const originalTitle = 'Todo'
let timerWorker = null
let currentSelectedTaskId = null

// 模块加载时初始化数据
function initPomodoroData() {
  const saved = loadFromStorage()
  if (saved && validateStorageData(saved)) {
    completedPomodoros.value = saved.completedPomodoros ?? 0
    totalFocusTime.value = saved.totalFocusTime ?? 0
    pomodoroHistory.value = saved.history || []
    soundEnabled.value = saved.soundEnabled !== undefined ? saved.soundEnabled : true
    // 使用 ?? 运算符，只有当值为 null 或 undefined 时才使用默认值，0 不会触发默认值
    const loadedInitialMinutes = saved.initialMinutes !== undefined ? saved.initialMinutes : 25
    const loadedInitialSeconds = saved.initialSeconds ?? 0
    const loadedCurrentMinutes = saved.currentMinutes !== undefined ? saved.currentMinutes : loadedInitialMinutes
    const loadedCurrentSeconds = saved.currentSeconds ?? loadedInitialSeconds

    // 如果加载的时间为 0:00，使用默认值 25 分钟
    if (loadedInitialMinutes === 0 && loadedInitialSeconds === 0) {
      initialMinutes.value = 25
      initialSeconds.value = 0
    } else {
      initialMinutes.value = loadedInitialMinutes
      initialSeconds.value = loadedInitialSeconds
    }

    if (loadedCurrentMinutes === 0 && loadedCurrentSeconds === 0) {
      minutes.value = initialMinutes.value
      seconds.value = initialSeconds.value
    } else {
      minutes.value = loadedCurrentMinutes
      seconds.value = loadedCurrentSeconds
    }
  }
}

initPomodoroData()

/**
 * 获取或创建 Web Worker
 */
function getTimerWorker() {
  if (!timerWorker) {
    try {
      timerWorker = new Worker(new URL('@/workers/timerWorker.js', import.meta.url), { type: 'module' })
    } catch (error) {
      console.error('Failed to create Web Worker:', error)
      // 降级方案：使用 setInterval
      return createFallbackWorker()
    }
  }
  return timerWorker
}

/**
 * 创建降级方案的伪 Worker
 */
function createFallbackWorker() {
  let timer = null
  return {
    onmessage: null,
    postMessage(data) {
      if (data.type === 'start') {
        if (timer) clearInterval(timer)
        timer = setInterval(() => {
          if (this.onmessage) {
            this.onmessage({ data: { type: 'tick' } })
          }
        }, 1000)
      } else if (data.type === 'stop') {
        if (timer) {
          clearInterval(timer)
          timer = null
        }
      }
    }
  }
}

/**
 * 页面关闭前保存数据
 */
function handleBeforeUnload() {
  if (isRunning.value && endTime) {
    saveData()
  }
}

/**
 * 更新浏览器标题
 */
function updateTitle() {
  if (isRunning.value) {
    document.title = `${formatDisplayTime(minutes.value, seconds.value)} - Todo`
  } else {
    document.title = originalTitle
  }
}

/**
 * 根据 endTime 更新剩余时间
 */
function updateRemainingTime() {
  if (!endTime || !isRunning.value) return

  const remaining = calculateRemainingTime(endTime)

  if (isTimerComplete(remaining)) {
    complete()
    return
  }

  const { minutes: newMinutes, seconds: newSeconds } = getRemainingMinutesSeconds(remaining)
  const elapsed = calculateElapsedSeconds(minutes.value, seconds.value, newMinutes, newSeconds)

  if (elapsed > 0) {
    totalFocusTime.value += elapsed
  }

  minutes.value = newMinutes
  seconds.value = newSeconds
  updateTitle()
  saveData()
}

/**
 * 处理页面可见性变化
 */
function handleVisibilityChange() {
  if (!document.hidden && isRunning.value && endTime) {
    updateRemainingTime()
  }
}

/**
 * 保存数据到 localStorage
 */
function saveData() {
  const data = {
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
  }
  saveToStorage(data)
}

/**
 * 完成计时
 */
function complete() {
  // 暂停计时
  isRunning.value = false
  const worker = getTimerWorker()
  worker.postMessage({ type: 'stop' })
  endTime = null

  completedPomodoros.value++

  const duration = initialMinutes.value * 60 + initialSeconds.value
  pomodoroHistory.value.push({
    timestamp: Date.now(),
    duration: duration,
    taskId: currentSelectedTaskId || null
  })

  playSound(soundEnabled.value)

  // 重置时间
  minutes.value = initialMinutes.value
  seconds.value = initialSeconds.value
  updateTitle()
  saveData()
}

/**
 * 每秒执行的 tick 函数
 */
function tick() {
  if (!isRunning.value) return

  const remaining = calculateRemainingTime(endTime)

  if (isTimerComplete(remaining)) {
    complete()
    return
  }

  const { minutes: newMinutes, seconds: newSeconds } = getRemainingMinutesSeconds(remaining)
  const elapsed = calculateElapsedSeconds(minutes.value, seconds.value, newMinutes, newSeconds)

  if (elapsed > 0) {
    totalFocusTime.value += elapsed
  }

  minutes.value = newMinutes
  seconds.value = newSeconds
  updateTitle()
  saveData()
}

export function usePomodoro() {
  const { selectedTaskId } = useTodo()

  // 同步 selectedTaskId 到模块级变量
  watch(selectedTaskId, (newVal) => {
    currentSelectedTaskId = newVal
  }, { immediate: true })

  // 显示时间
  const displayTime = computed(() => formatDisplayTime(minutes.value, seconds.value))

  // 格式化总时间
  const formattedTotalTime = computed(() => formatTotalTime(totalFocusTime.value))

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
    return formatTotalTime(totalSeconds)
  })

  /**
   * 开始/暂停
   */
  function toggleTimer() {
    if (isRunning.value) {
      pause()
    } else {
      start()
    }
  }

  /**
   * 开始计时
   */
  function start() {
    if (minutes.value === 0 && seconds.value === 0) {
      reset()
    }
    isRunning.value = true

    preloadAudio()

    endTime = calculateEndTime(minutes.value, seconds.value)

    document.removeEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    window.removeEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('beforeunload', handleBeforeUnload)

    updateTitle()
    saveData()

    const worker = getTimerWorker()
    worker.onmessage = () => tick()
    worker.postMessage({ type: 'start' })
  }

  /**
   * 暂停计时
   */
  function pause() {
    isRunning.value = false
    endTime = null

    const worker = getTimerWorker()
    worker.postMessage({ type: 'stop' })

    updateTitle()
    saveData()
  }

  /**
   * 重置计时
   */
  function reset() {
    pause()
    minutes.value = initialMinutes.value
    seconds.value = initialSeconds.value
    updateTitle()
    saveData()
  }



  /**
   * 切换声音开关
   */
  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
    saveData()
  }

  /**
   * 设置时间
   */
  function setTime(newMinutes, newSeconds = 0) {
    const { minutes: m, seconds: s } = validateTimeRange(newMinutes, newSeconds)

    initialMinutes.value = m
    initialSeconds.value = s

    if (!isRunning.value) {
      minutes.value = m
      seconds.value = s
    }

    // 立即保存到 localStorage
    saveData()
  }

  /**
   * 加载保存的数据
   */
  function loadData() {
    const saved = loadFromStorage()

    if (saved && validateStorageData(saved)) {
      completedPomodoros.value = saved.completedPomodoros ?? 0
      totalFocusTime.value = saved.totalFocusTime ?? 0
      pomodoroHistory.value = saved.history || []
      soundEnabled.value = saved.soundEnabled !== undefined ? saved.soundEnabled : true

      // 加载并验证时间值
      const loadedInitialMinutes = saved.initialMinutes !== undefined ? saved.initialMinutes : 25
      const loadedInitialSeconds = saved.initialSeconds ?? 0

      // 如果初始时间为 0:00，使用默认值 25 分钟
      if (loadedInitialMinutes === 0 && loadedInitialSeconds === 0) {
        initialMinutes.value = 25
        initialSeconds.value = 0
      } else {
        initialMinutes.value = loadedInitialMinutes
        initialSeconds.value = loadedInitialSeconds
      }

      // 检查是否需要恢复计时
      if (shouldResumeTimer(saved.wasRunning, saved.endTime)) {
        const remaining = calculateRemainingTime(saved.endTime)
        const { minutes: m, seconds: s } = getRemainingMinutesSeconds(remaining)

        minutes.value = m
        seconds.value = s
        endTime = saved.endTime
        isRunning.value = true

        preloadAudio()

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('beforeunload', handleBeforeUnload)

        updateTitle()

        const worker = getTimerWorker()
        worker.onmessage = () => tick()
        worker.postMessage({ type: 'start' })
      } else {
        // 恢复当前计时器状态
        const loadedCurrentMinutes = saved.currentMinutes !== undefined ? saved.currentMinutes : initialMinutes.value
        const loadedCurrentSeconds = saved.currentSeconds ?? initialSeconds.value

        // 如果当前时间为 0:00，使用初始时间
        if (loadedCurrentMinutes === 0 && loadedCurrentSeconds === 0) {
          minutes.value = initialMinutes.value
          seconds.value = initialSeconds.value
        } else {
          minutes.value = loadedCurrentMinutes
          seconds.value = loadedCurrentSeconds
        }

        // 如果时间已过期，完成计时
        if (saved.wasRunning && saved.endTime && calculateRemainingTime(saved.endTime) <= 0) {
          complete()
        }
      }
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
    loadData,
    saveData,
    getStatsData: (type, taskId) => getStatsData(pomodoroHistory.value, type, taskId),
    getTaskStats: (taskId) => getTaskStats(pomodoroHistory.value, taskId)
  }
}
