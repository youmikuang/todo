<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import PomodoroTimer from '@/components/PomodoroTimer.vue'
import TodoList from '@/components/TodoList.vue'
import { useTodo } from '@/composables/useTodo'
import { usePomodoro } from '@/composables/usePomodoro'
import '@/assets/css/main.css'

const { currentTheme } = useTodo()
const { toggleTimer } = usePomodoro()
const isTodoCollapsed = ref(false)

const toggleTodoCollapse = () => {
  isTodoCollapsed.value = !isTodoCollapsed.value
  showClock.value = isTodoCollapsed.value
}

// 处理全屏变化，进入全屏时折叠 todo，退出全屏时展开 todo
const handleFullscreenChange = (isFullscreen) => {
  isTodoCollapsed.value = isFullscreen
  showClock.value = isFullscreen
}

// 时间显示功能
const showClock = ref(false)
const currentTime = ref('')
const currentDate = ref('')

const updateTime = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}:${seconds}`

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  currentDate.value = `${year}/${month}/${day}`
}

const toggleClock = () => {
  showClock.value = !showClock.value
}

// 键盘快捷键
const handleKeydown = (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  // 如果时间选择器打开，忽略快捷键
  if (document.querySelector('.picker-overlay')) return
  if (e.key === 'c' || e.key === 'C') {
    toggleTodoCollapse()
  }
  // 空格键暂停/继续计时器
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault()
    toggleTimer()
  }
}

let clockInterval = null

onMounted(() => {
  updateTime()
  clockInterval = setInterval(updateTime, 1000)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (clockInterval) {
    clearInterval(clockInterval)
  }
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="app-container" :class="[currentTheme, { 'todo-collapsed': isTodoCollapsed }]">
    <div class="pomodoro-section">
      <PomodoroTimer />
    </div>
    <button class="collapse-btn" @click="toggleTodoCollapse" :title="isTodoCollapsed ? '展开待办（C）' : '折叠待办（C）'">
      <span class="collapse-icon">{{ isTodoCollapsed ? '◀' : '▶' }}</span>
    </button>
    <div class="todo-section" :class="{ collapsed: isTodoCollapsed }">
      <TodoList @fullscreen-change="handleFullscreenChange" />
    </div>
    <!-- 左下角时钟 -->
    <div class="clock-wrapper" @click="toggleClock" :title="showClock ? '点击隐藏时间' : '点击显示时间'">
      <Transition name="clock-fade" mode="out-in">
        <span v-if="showClock" key="time" class="clock-time">{{ currentDate }} {{ currentTime }}</span>
        <span v-else key="placeholder" class="clock-placeholder">···</span>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  height: -webkit-fill-available;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
  transition: background-color 0.3s linear, color 0.3s linear;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.pomodoro-section {
  flex: 1.5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: flex 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.todo-collapsed .pomodoro-section {
  flex: 1;
}

.collapse-btn {
  position: absolute;
  right: 40%;
  top: 50%;
  transform: translate(50%, -50%) scale(1);
  z-index: 100;
  width: 20px;
  height: 40px;
  background: rgba(128, 128, 128, 0.1);
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, border-color 0.2s ease, right 0.4s ease-in-out, transform 0.4s ease-in-out;
}

.collapse-btn::before,
.collapse-btn::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 1px;
  background: rgba(128, 128, 128, 0.2);
  transform: translateX(-50%);
}

.collapse-btn::before {
  bottom: 100%;
  height: 100vh;
}

.collapse-btn::after {
  top: 100%;
  height: 100vh;
}

.collapse-btn:hover {
  background: rgba(128, 128, 128, 0.15);
  border-color: rgba(128, 128, 128, 0.4);
}

.collapse-icon {
  font-size: 10px;
  color: rgba(128, 128, 128, 0.6);
  line-height: 1;
  transition: color 0.2s ease;
}

.collapse-btn:hover .collapse-icon {
  color: rgba(128, 128, 128, 0.9);
}

.todo-collapsed .collapse-btn {
  right: 0;
  transform: translate(50%, -50%) scale(1.3);
}

.todo-collapsed .collapse-btn::before,
.todo-collapsed .collapse-btn::after {
  display: none;
}

.todo-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: flex 0.4s ease-in-out, width 0.4s ease-in-out, opacity 0.3s ease-in-out, padding 0.4s ease-in-out;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.todo-section.collapsed {
  flex: 0;
  width: 0;
  padding: 0;
  overflow: hidden;
  opacity: 0;
}

/* 手机端上下布局 */
@media only screen and (max-width: 768px) {
  .app-container {
    flex-direction: column-reverse;
  }

  .collapse-btn {
    display: none;
  }

  .pomodoro-section {
    border-top: 1px solid rgba(128, 128, 128, 0.2);
    flex: 0 0 43%;
    min-height: 0;
    padding-top: 1.5rem;
  }

  .todo-section {
    flex: 0 0 67%;
    min-height: 0;
    overflow-y: auto;
    padding-top: env(safe-area-inset-top, 0px);
  }
}

/* 左下角时钟样式 */
.clock-wrapper {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 100;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
  user-select: none;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.clock-time {
  font-size: 18px;
  font-family: 'Work Sans', monospace;
  letter-spacing: 1px;
  color: inherit;
}

.clock-placeholder {
  font-size: 18px;
  opacity: 0.5;
  letter-spacing: 2px;
}

@media only screen and (max-width: 768px) {
  .clock-wrapper {
    left: 10px;
    bottom: 10px;
    padding: 6px 10px;
  }

  .clock-time {
    font-size: 14px;
  }

  .clock-placeholder {
    font-size: 14px;
  }
}

/* 时钟过渡动画 */
.clock-fade-enter-active,
.clock-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.clock-fade-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.clock-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>

<style>
/* 主题背景色 - 非scoped确保生效 */
.app-container.standard,
.app-container.light,
.app-container.darker {
  background-color: transparent !important;
}

/* 折叠 todo 时的样式 */
.todo-collapsed .pomodoro-timer {
  transform: scale(2);
  transform-origin: center top;
  margin-bottom: 17rem;
}

.todo-collapsed .pomodoro-stats,
.todo-collapsed .chart-wrapper {
  display: none !important;
}

.todo-collapsed .current-task {
  font-size: 3.5rem;
  color: inherit;
}

.todo-collapsed .pomodoro-controls {
  margin-bottom: 0;
}

.todo-collapsed .pomodoro {
  justify-content: center;
  padding-top: 0;
}

/* 全屏 + 折叠 todo 时的样式 */
html:fullscreen .todo-collapsed .pomodoro-timer,
html:-webkit-full-screen .todo-collapsed .pomodoro-timer {
  transform: scale(2);
  transform-origin: center top;
  margin-bottom: 17rem;
}

html:fullscreen .todo-collapsed .pomodoro-stats,
html:fullscreen .todo-collapsed .chart-wrapper,
html:-webkit-full-screen .todo-collapsed .pomodoro-stats,
html:-webkit-full-screen .todo-collapsed .chart-wrapper {
  display: none !important;
}


html:fullscreen .todo-collapsed .current-task,
html:-webkit-full-screen .todo-collapsed .current-task {
  font-size: 3.5rem;
  color: inherit;
}

html:fullscreen .todo-collapsed .pomodoro-controls,
html:-webkit-full-screen .todo-collapsed .pomodoro-controls {
  margin-bottom: 0;
}

html:fullscreen .todo-collapsed .pomodoro,
html:-webkit-full-screen .todo-collapsed .pomodoro {
  justify-content: center;
  padding-top: 0;
}
</style>
