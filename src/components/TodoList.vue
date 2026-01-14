<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useTodo, getTodoProgress } from '@/composables/useTodo'
import { usePomodoro } from '@/composables/usePomodoro'

const emit = defineEmits(['fullscreen-change'])

const {
  todos,
  inputValue,
  selectedTaskId,
  currentTheme,
  inputClass,
  buttonClass,
  titleClass,
  changeTheme,
  addTodo,
  toggleComplete,
  editTodo,
  deleteTodo,
  selectTask,
  getTodoClass,
  init
} = useTodo()

const { getTaskStats, isRunning, pomodoroHistory } = usePomodoro()

const isFullscreen = ref(false)

// 编辑状态
const editingTodoId = ref(null)
const editingText = ref('')

// 双击进入编辑模式
function handleDoubleClick(todo) {
  if (isRunning.value) return
  editingTodoId.value = todo.id
  editingText.value = todo.text
  nextTick(() => {
    const input = document.querySelector('.edit-input')
    if (input) {
      input.focus()
      input.select()
    }
  })
}

// 保存编辑
function saveEdit(todo) {
  if (editTodo(todo, editingText.value)) {
    editingTodoId.value = null
    editingText.value = ''
  }
}

// 取消编辑
function cancelEdit() {
  editingTodoId.value = null
  editingText.value = ''
}

// 计算每个 todo 的进度
function getProgress(todo) {
  const stats = getTaskStats(todo.id)
  return getTodoProgress(todo, stats)
}

// 监听番茄钟历史变化，自动完成达到 100% 的 todo
watch(pomodoroHistory, () => {
  todos.value.forEach(todo => {
    if (todo.completed) return
    const progress = getProgress(todo)
    if (progress === 100) {
      toggleComplete(todo)
    }
  })
}, { deep: true })

// 切换全屏
function toggleFullscreen() {
  const elem = document.documentElement

  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    }
  }
}

// 监听全屏状态变化
function handleFullscreenChange() {
  const wasFullscreen = isFullscreen.value
  isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement)
  if (!wasFullscreen && isFullscreen.value) {
    emit('fullscreen-change', true)
  } else if (wasFullscreen && !isFullscreen.value) {
    emit('fullscreen-change', false)
  }
}

// 键盘快捷键
function handleKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen()
  }
}

// 计时中不允许切换任务
function handleSelectTask(taskId) {
  if (isRunning.value) return
  selectTask(taskId)
}

// 计时中不允许删除选中的任务
function handleDeleteTodo(todo) {
  if (isRunning.value && selectedTaskId.value === todo.id) return
  deleteTodo(todo)
}

onMounted(() => {
  init()
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="todo-container">
    <div id="header">
      <div class="flexrow-container">
        <div class="standard-theme theme-selector" @click="changeTheme('standard')"></div>
        <div class="light-theme theme-selector" @click="changeTheme('light')"></div>
        <div class="darker-theme theme-selector" @click="changeTheme('darker')"></div>
        <button class="fullscreen-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏(F)' : '全屏(F)'">
          <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"></i>
        </button>
      </div>
    </div>

    <h1 id="title" :class="titleClass">好好学习，天天向上</h1>
    <div id="form">
      <form @submit.prevent="addTodo" class="input-wrapper">
        <input
          v-model="inputValue"
          :class="inputClass"
          class="todo-input"
          type="text"
          placeholder="添加一条待办，待办 * 数字 表示番茄钟执行次数。"
        >
        <button :class="['todo-btn', buttonClass]" type="submit">
          <i class="fas fa-plus"></i>
        </button>
      </form>
    </div>

    <div id="myUnOrdList">
      <ul class="todo-list">
        <div
          v-for="todo in todos"
          :key="todo.id"
          :class="[getTodoClass(todo), { 'selected-task': selectedTaskId === todo.id, 'disabled': isRunning && selectedTaskId !== todo.id }]"
          @click="handleSelectTask(todo.id)"
        >
          <!-- 进度背景层 -->
          <div
            v-if="getProgress(todo) !== null"
            class="todo-progress"
            :class="`${currentTheme}-progress`"
            :style="{ width: getProgress(todo) + '%' }"
          ></div>
          <li class="todo-item">
            <input
              v-if="editingTodoId === todo.id"
              v-model="editingText"
              class="edit-input"
              :class="inputClass"
              type="text"
              @blur="saveEdit(todo)"
              @keyup.enter="saveEdit(todo)"
              @keyup.escape="cancelEdit"
              @click.stop
            >
            <span v-else class="todo-text" @dblclick.stop="handleDoubleClick(todo)">{{ todo.text }}</span>
            <span v-if="getTaskStats(todo.id).count > 0" class="task-stats">
              <i class="fas fa-clock"></i> {{ getTaskStats(todo.id).count }}
            </span>
          </li>
          <button
            :class="['check-btn', buttonClass]"
            @click.stop="toggleComplete(todo)"
          >
            <i class="fas fa-check"></i>
          </button>
          <button
            v-show="!(isRunning && selectedTaskId === todo.id)"
            :class="['delete-btn', buttonClass]"
            @click.stop="handleDeleteTodo(todo)"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.todo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 1rem;
  box-sizing: border-box;
}

#title {
  margin-top: 3rem;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.todo-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
}

.edit-input {
  flex: 1;
  min-width: 0;
  padding: 0.2rem 0.5rem;
  font-size: inherit;
  font-family: inherit;
  border: none;
  border-radius: 5px;
  outline: none;
}

.task-stats {
  font-size: 0.7rem;
  opacity: 0.6;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  white-space: nowrap;
}

.selected-task {
  box-shadow: inset 0 0 0 2px currentColor;
  border-radius: 15px;
}

.disabled {
  cursor: not-allowed !important;
}

@media only screen and (max-width: 768px) {
  .todo-container {
    padding: 0.75rem;
  }

  .todo-item {
    gap: 0.3rem;
  }

  .task-stats {
    font-size: 0.6rem;
  }

  .selected-task {
    box-shadow: inset 0 0 0 1.5px currentColor;
  }
}
</style>
