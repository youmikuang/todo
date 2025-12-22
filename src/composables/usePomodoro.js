import { ref, computed } from 'vue'

export function usePomodoro() {
  const minutes = ref(25)
  const seconds = ref(0)
  const isRunning = ref(false)
  const completedPomodoros = ref(0)
  const totalFocusTime = ref(0) // 总专注时间（秒）
  const initialMinutes = ref(25)
  const initialSeconds = ref(0)

  let timer = null

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

  // 开始/暂停
  function toggleTimer() {
    if (isRunning.value) {
      pause()
    } else {
      start()
    }
  }

  function start() {
    if (minutes.value === 0 && seconds.value === 0) {
      reset()
    }
    isRunning.value = true
    timer = setInterval(() => {
      if (seconds.value > 0) {
        seconds.value--
        totalFocusTime.value++
      } else if (minutes.value > 0) {
        minutes.value--
        seconds.value = 59
        totalFocusTime.value++
      } else {
        // 计时结束
        complete()
      }
    }, 1000)
  }

  function pause() {
    isRunning.value = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function reset() {
    pause()
    minutes.value = initialMinutes.value
    seconds.value = initialSeconds.value
  }

  function complete() {
    pause()
    completedPomodoros.value++
    playSound()
    reset()
  }

  function playSound() {
    try {
      const audio = new Audio('/Cuckoo.mp3')
      audio.play()
    } catch (e) {
      // 静默失败
    }
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
      if (data.initialMinutes !== undefined) {
        initialMinutes.value = data.initialMinutes
        minutes.value = data.initialMinutes
      }
      if (data.initialSeconds !== undefined) {
        initialSeconds.value = data.initialSeconds
        seconds.value = data.initialSeconds
      }
    }
  }

  // 保存数据
  function saveData() {
    localStorage.setItem('pomodoroData', JSON.stringify({
      completedPomodoros: completedPomodoros.value,
      totalFocusTime: totalFocusTime.value,
      initialMinutes: initialMinutes.value,
      initialSeconds: initialSeconds.value
    }))
  }

  return {
    minutes,
    seconds,
    isRunning,
    completedPomodoros,
    totalFocusTime,
    displayTime,
    formattedTotalTime,
    toggleTimer,
    reset,
    setTime,
    parseTimeString,
    loadData,
    saveData
  }
}
