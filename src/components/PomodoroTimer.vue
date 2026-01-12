<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { usePomodoro } from '@/composables/usePomodoro'
import { useTodo } from '@/composables/useTodo'
import PomodoroStats from '@/components/PomodoroStats.vue'
import * as XLSX from 'xlsx'

const {
  displayTime,
  isRunning,
  completedPomodoros,
  filteredCompletedPomodoros,
  filteredTotalTime,
  pomodoroHistory,
  toggleTimer,
  reset,
  setTime,
  soundEnabled,
  toggleSound,
  minutes: currentMinutes,
  seconds: currentSeconds,
  initialMinutes,
  initialSeconds,
  loadData,
  saveData
} = usePomodoro()

const { currentTheme, selectedTask, selectedTaskId, todos, themeColors, setThemeColor } = useTodo()

// 计算进度百分比 (0-100)
const progress = computed(() => {
  const total = initialMinutes.value * 60 + initialSeconds.value
  if (total === 0) return 0
  const current = currentMinutes.value * 60 + currentSeconds.value
  return ((total - current) / total) * 100
})

// 根据主题获取进度条渐变色
const progressGradient = computed(() => {
  const gradients = {
    standard: {
      start: '#ff6b6b',
      end: '#ffd93d',
      bg: 'rgba(255, 255, 255, 0.1)'
    },
    light: {
      start: '#667eea',
      end: '#764ba2',
      bg: 'rgba(102, 126, 234, 0.15)'
    },
    darker: {
      start: '#00d2ff',
      end: '#3a7bd5',
      bg: 'rgba(0, 210, 255, 0.15)'
    }
  }
  return gradients[currentTheme.value] || gradients.standard
})

// 计算渐变背景
const borderBackground = computed(() => {
  const g = progressGradient.value
  const p = progress.value
  if (p === 0) {
    return g.bg
  }
  // 渐变进度条
  return `conic-gradient(from 0deg, ${g.start} 0%, ${g.end} ${p}%, ${g.bg} ${p}%)`
})

// 根据主题计算选择器样式
const pickerTheme = computed(() => {
  const themes = {
    standard: {
      bg: '#0a3a4a',
      headerBg: '#0a3a4a',
      text: '#ffdfdb',
      subText: 'rgba(255,223,219,0.6)',
      highlight: 'rgba(255,255,255,0.1)',
      border: 'rgba(255,255,255,0.1)',
      confirm: '#4db8ff'
    },
    light: {
      bg: '#ffffff',
      headerBg: '#f7f7f7',
      text: '#1a150e',
      subText: '#666',
      highlight: 'rgba(0,0,0,0.06)',
      border: '#e0e0e0',
      confirm: '#007aff'
    },
    darker: {
      bg: '#002530',
      headerBg: '#002530',
      text: '#ffffff',
      subText: 'rgba(255,255,255,0.6)',
      highlight: 'rgba(255,255,255,0.1)',
      border: 'rgba(255,255,255,0.1)',
      confirm: '#4db8ff'
    }
  }
  return themes[currentTheme.value] || themes.light
})

const isEditing = ref(false)
const showChart = ref(false)
const selectedMinutes = ref(25)
const selectedSeconds = ref(0)
const minutesRef = ref(null)
const secondsRef = ref(null)

const ITEM_HEIGHT = 40

// 生成分钟列表 0-60
const minutesList = Array.from({ length: 61 }, (_, i) => i)
// 生成秒列表 0-59
const secondsList = Array.from({ length: 60 }, (_, i) => i)

// 双击编辑
function handleClick() {
  if (isRunning.value) return
  selectedMinutes.value = currentMinutes.value
  selectedSeconds.value = currentSeconds.value
  isEditing.value = true
  nextTick(() => {
    scrollToSelected()
  })
}

// 滚动到选中位置
function scrollToSelected() {
  if (minutesRef.value) {
    minutesRef.value.scrollTop = selectedMinutes.value * ITEM_HEIGHT
  }
  if (secondsRef.value) {
    secondsRef.value.scrollTop = selectedSeconds.value * ITEM_HEIGHT
  }
}

// 处理滚动结束
function handleScrollEnd(type) {
  const ref = type === 'minutes' ? minutesRef.value : secondsRef.value
  if (!ref) return

  const scrollTop = ref.scrollTop
  const index = Math.round(scrollTop / ITEM_HEIGHT)
  const maxIndex = type === 'minutes' ? 60 : 59
  const clampedIndex = Math.max(0, Math.min(index, maxIndex))

  if (type === 'minutes') {
    selectedMinutes.value = clampedIndex
    // 如果是60分钟，秒数强制为0
    if (clampedIndex === 60) {
      selectedSeconds.value = 0
      if (secondsRef.value) {
        secondsRef.value.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  } else {
    // 如果当前是60分钟，秒数不能修改
    if (selectedMinutes.value === 60) {
      selectedSeconds.value = 0
      ref.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    selectedSeconds.value = clampedIndex
  }

  // 平滑滚动到对齐位置
  ref.scrollTo({
    top: clampedIndex * ITEM_HEIGHT,
    behavior: 'smooth'
  })
}

let scrollTimeout = null
function handleScroll(type) {
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    handleScrollEnd(type)
  }, 100)
}

// 关闭选择器
function closePicker() {
  isEditing.value = false
  // 强制刷新状态栏颜色
  setTimeout(() => {
    setThemeColor(themeColors[currentTheme.value])
  }, 50)
}

// 确认选择
function confirmEdit() {
  setTime(selectedMinutes.value, selectedSeconds.value)
  closePicker()
  saveData()
}

// 取消编辑
function cancelEdit() {
  closePicker()
}

// 导出 Excel
function exportToExcel() {
  // 获取任务名称映射
  const taskMap = {}
  todos.value.forEach(t => {
    taskMap[t.id] = t.text
  })

  // 准备导出数据
  const data = pomodoroHistory.value.map(record => {
    const date = new Date(record.timestamp)
    const mins = Math.floor(record.duration / 60)
    const secs = record.duration % 60
    return {
      '日期': date.toLocaleDateString('zh-CN'),
      '时间': date.toLocaleTimeString('zh-CN'),
      '时长': `${mins}:${String(secs).padStart(2, '0')}`,
      '任务': record.taskId ? (taskMap[record.taskId] || '已删除任务') : '无'
    }
  })

  // 创建工作簿
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '番茄记录')

  // 下载文件
  const fileName = `番茄记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// 切换图表显示（仅PC端）
function toggleChart() {
  if (window.innerWidth <= 768) return
  showChart.value = !showChart.value
}

// 监听变化保存数据
watch([completedPomodoros], () => {
  saveData()
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="pomodoro">
    <div class="pomodoro-timer">
      <!-- 进度条边框容器 -->
      <div
        class="timer-border"
        :style="{
          background: borderBackground,
          borderRadius: '100px'
        }"
      >
        <div class="timer-border-inner">
          <div
            class="time-display"
            @click="handleClick"
            :title="isRunning ? '' : '点击修改时长'"
          >
            {{ displayTime }}
          </div>
        </div>
      </div>
    </div>

    <!-- iOS 风格时间选择器 -->
    <Teleport to="body">
      <div v-if="isEditing" class="picker-overlay" @click.self="cancelEdit">
        <div
          class="picker-container"
          :style="{
            background: pickerTheme.bg,
            color: pickerTheme.text
          }"
        >
          <div
            class="picker-header"
            :style="{
              background: pickerTheme.headerBg,
              borderColor: pickerTheme.border
            }"
          >
            <button
              class="picker-btn cancel"
              @click="cancelEdit"
              :style="{ color: pickerTheme.subText }"
            >取消</button>
            <span class="picker-title"></span>
            <button
              class="picker-btn confirm"
              @click="confirmEdit"
              :style="{ color: pickerTheme.confirm }"
            >确定</button>
          </div>

          <div
            class="picker-content"
            :style="{ background: pickerTheme.bg }"
          >
            <div class="picker-column">
              <div
                ref="minutesRef"
                class="picker-scroll"
                @scroll="handleScroll('minutes')"
              >
                <div class="picker-padding"></div>
                <div
                  v-for="m in minutesList"
                  :key="'m' + m"
                  class="picker-item"
                  :class="{ active: m === selectedMinutes }"
                  :style="{ color: m === selectedMinutes ? pickerTheme.text : pickerTheme.subText }"
                >
                  {{ String(m).padStart(2, '0') }}
                </div>
                <div class="picker-padding"></div>
              </div>
              <div class="picker-label" :style="{ color: pickerTheme.subText }">分钟</div>
            </div>

            <div class="picker-separator" :style="{ color: pickerTheme.text }">:</div>

            <div class="picker-column">
              <div
                ref="secondsRef"
                class="picker-scroll"
                @scroll="handleScroll('seconds')"
              >
                <div class="picker-padding"></div>
                <div
                  v-for="s in secondsList"
                  :key="'s' + s"
                  class="picker-item"
                  :class="{ active: s === selectedSeconds }"
                  :style="{ color: s === selectedSeconds ? pickerTheme.text : pickerTheme.subText }"
                >
                  {{ String(s).padStart(2, '0') }}
                </div>
                <div class="picker-padding"></div>
              </div>
              <div class="picker-label" :style="{ color: pickerTheme.subText }">秒</div>
            </div>
          </div>

          <div
            class="picker-highlight"
            :style="{ background: pickerTheme.highlight }"
          ></div>
        </div>
      </div>
    </Teleport>

    <!-- 当前选中的任务 -->
    <div class="current-task" :class="{ 'has-task': selectedTask }">
      {{ selectedTask?.text || '&nbsp;' }}
    </div>

    <div class="pomodoro-controls">
      <button class="control-btn" @click="toggleTimer">
        <i :class="isRunning ? 'fas fa-pause' : 'fas fa-play'"></i>
      </button>
      <button class="control-btn" @click="reset">
        <i class="fas fa-redo"></i>
      </button>
      <button class="control-btn sound-btn" @click="toggleSound" :title="soundEnabled ? '关闭声音' : '开启声音'">
        <i :class="soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
      </button>
    </div>

    <div class="pomodoro-stats" @click="toggleChart">
      <div class="stat-item">
        <i class="fas fa-check-circle"></i>
        <span>{{ filteredCompletedPomodoros }}</span>
      </div>
      <div class="stat-item">
        <i class="fas fa-clock"></i>
        <span>{{ filteredTotalTime }}</span>
      </div>
      <i :class="['fas', showChart ? 'fa-chevron-up' : 'fa-chevron-down', 'toggle-icon']"></i>
      <button class="export-btn" @click.stop="exportToExcel" title="导出Excel">
        <i class="fas fa-download"></i>
      </button>
    </div>

    <div class="chart-wrapper">
      <PomodoroStats v-if="showChart" :taskId="selectedTaskId" />
    </div>
  </div>
</template>

<style scoped>
.pomodoro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 9rem;
  min-height: 300px;
  height: 100%;
  width: 80%;
  overflow-y: display;
}

.chart-wrapper {
  width: 100%;
  justify-content: center;
}

@media only screen and (max-width: 768px) {
  .pomodoro {
    justify-content: center;
    padding-top: 2rem;
  }
}

.current-task {
  font-size: 2rem;
  opacity: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0.5rem;
  min-height: 2em;
  transition: opacity 0.2s;
}

.current-task.has-task {
  opacity: 0.6;
}

.pomodoro-timer {
  margin-bottom: 2rem;
}

.timer-border {
  padding: 10px;
  min-width: 320px;
}

.timer-border-inner {
  background: var(--timer-bg, #062e3f);
  border-radius: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
}

.standard .timer-border-inner {
  background: #062e3f;
}

.light .timer-border-inner {
  background: #d4f1ff;
}

.darker .timer-border-inner {
  background: #001f29;
}

.time-display {
  font-size: 8rem;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  letter-spacing: 0.1em;
  transition: opacity 0.2s;
  font-variant-numeric: tabular-nums;
  min-width: 5ch;
  text-align: center;
}

.time-display:hover {
  opacity: 0.8;
}

.pomodoro-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  transform: scale(1.1);
}

.control-btn:active {
  transform: scale(0.95);
}

.pomodoro-stats {
  display: flex;
  gap: 2rem;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: opacity 0.2s;
  align-items: center;
}

.pomodoro-stats:hover {
  opacity: 0.8;
}

.toggle-icon {
  font-size: 0.8rem;
  opacity: 0.5;
  margin-left: 0.5rem;
}

.export-btn {
  background: none;
  border: none;
  font-size: 1rem;
  opacity: 0.7;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  margin-left: 0.5rem;
  transition: opacity 0.2s, transform 0.2s;
  color: inherit;
}

.export-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

@media only screen and (max-width: 768px) {
  .toggle-icon {
    display: none;
  }

  .pomodoro-stats {
    cursor: default;
  }

  .pomodoro-timer {
    margin-top: 2rem;
  }

  .time-display {
    font-size: 5rem;
  }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-item i {
  opacity: 0.7;
}

/* iOS 风格选择器样式 */
.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
  padding-top: env(safe-area-inset-top, 0);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.picker-container {
  background: #f7f7f7;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 500px;
  padding-bottom: env(safe-area-inset-bottom, 20px);
  animation: slideUp 0.3s ease;
  position: relative;
  overflow: hidden;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f7f7f7;
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.picker-btn {
  background: none;
  border: none;
  font-size: 16px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 8px;
}

.picker-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.picker-btn.cancel {
  color: #666;
}

.picker-btn.confirm {
  color: #007aff;
  font-weight: 600;
}

.picker-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 40px;
  height: 200px;
  position: relative;
  background: #f7f7f7;
}

.picker-highlight {
  position: absolute;
  left: 50%;
  top: 57%;
  transform: translate(-50%, -50%);
  width: 220px;
  height: 44px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  pointer-events: none;
  z-index: 0;
}

.picker-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.picker-scroll {
  height: 120px;
  width: 80px;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  text-align: center;
}

.picker-scroll::-webkit-scrollbar {
  display: none;
}

.picker-padding {
  height: 40px;
}

.picker-item {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #999;
  scroll-snap-align: center;
  transition: all 0.15s ease;
  cursor: pointer;
}

.picker-item.active {
  color: #000;
  font-weight: 500;
  font-size: 24px;
}

.picker-label {
  font-size: 13px;
  color: #666;
  margin-top: 8px;
}

.picker-separator {
  font-size: 28px;
  font-weight: 500;
  color: #333;
  margin: 0 8px;
  padding-bottom: 28px;
  z-index: 1;
}

@media (min-width: 769px) {
  .picker-overlay {
    align-items: center;
  }

  .picker-container {
    border-radius: 16px;
    max-width: 320px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .picker-content {
    padding: 30px 20px;
  }
}
</style>
