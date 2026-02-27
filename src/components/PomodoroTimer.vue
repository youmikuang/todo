<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePomodoro } from '@/composables/usePomodoro'
import { useTodo } from '@/composables/useTodo'
import PomodoroStats from '@/components/PomodoroStats.vue'
import TimePicker from '@/components/TimePicker.vue'
import * as XLSX from 'xlsx'
import { getProgressGradient, getPickerTheme } from '@/utils/themeConfig'

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

const { currentTheme, selectedTask, selectedTaskId, todos } = useTodo()

// 计算进度百分比 (0-100)
const progress = computed(() => {
  const total = initialMinutes.value * 60 + initialSeconds.value
  if (total === 0) return 0
  const current = currentMinutes.value * 60 + currentSeconds.value
  return ((total - current) / total) * 100
})

// 根据主题获取进度条渐变色
const borderBackground = computed(() => {
  return getProgressGradient(currentTheme.value, progress.value)
})

// 获取选择器主题
const pickerTheme = computed(() => {
  return getPickerTheme(currentTheme.value)
})

const isEditing = ref(false)
const showChart = ref(false)
const selectedTime = ref({
  minutes: 25,
  seconds: 0
})

// 打开时间选择器
function handleClick() {
  if (isRunning.value) return
  selectedTime.value = {
    minutes: currentMinutes.value,
    seconds: currentSeconds.value
  }
  isEditing.value = true
}

// 确认时间选择
function handleConfirmTime() {
  setTime(selectedTime.value.minutes, selectedTime.value.seconds)
  saveData()
  isEditing.value = false
}

// 取消时间选择
function handleCancelTime() {
  isEditing.value = false
}

// 导出 Excel
function exportToExcel() {
  const taskMap = {}
  todos.value.forEach(t => {
    taskMap[t.id] = t.text
  })

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

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '番茄记录')

  const fileName = `番茄记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// 切换图表显示（仅PC端）
function toggleChart() {
  if (window.innerWidth <= 768) return
  showChart.value = !showChart.value
}

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

    <!-- 时间选择器 -->
    <Teleport to="body">
      <TimePicker
        v-if="isEditing"
        v-model="selectedTime"
        :theme="pickerTheme"
        @confirm="handleConfirmTime"
        @cancel="handleCancelTime"
      />
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
    padding-top: 0rem;
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

.darker .timer-border-inner {
  background: #062e3f;
}

.light .timer-border-inner {
  background: #d4f1ff;
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
    display: none;
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
</style>
