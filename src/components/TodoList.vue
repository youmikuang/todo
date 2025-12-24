<script setup>
import { onMounted } from 'vue'
import { useTodo } from '@/composables/useTodo'
import { usePomodoro } from '@/composables/usePomodoro'

const {
  todos,
  inputValue,
  currentDateTime,
  selectedTaskId,
  inputClass,
  buttonClass,
  titleClass,
  changeTheme,
  addTodo,
  toggleComplete,
  deleteTodo,
  selectTask,
  getTodoClass,
  init
} = useTodo()

const { getTaskStats, isRunning } = usePomodoro()

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
})
</script>

<template>
  <div class="todo-container">
    <div id="header">
      <div class="flexrow-container">
        <div class="standard-theme theme-selector" @click="changeTheme('standard')"></div>
        <div class="light-theme theme-selector" @click="changeTheme('light')"></div>
        <div class="darker-theme theme-selector" @click="changeTheme('darker')"></div>
      </div>
    </div>

    <h1 id="title" :class="titleClass">好好学习，天天向上。</h1>
    <div id="form">
      <form @submit.prevent="addTodo" class="input-wrapper">
        <input
          v-model="inputValue"
          :class="inputClass"
          class="todo-input"
          type="text"
          placeholder="添加一条待办"
        >
        <button :class="['todo-btn', buttonClass]" type="submit">
          <i class="fas fa-plus"></i>
        </button>
      </form>
    </div>

    <div class="datetime-wrapper">
      <p><span id="datetime">{{ currentDateTime }}</span></p>
    </div>

    <div id="myUnOrdList">
      <ul class="todo-list">
        <div
          v-for="todo in todos"
          :key="todo.id"
          :class="[getTodoClass(todo), { 'selected-task': selectedTaskId === todo.id, 'disabled': isRunning && selectedTaskId !== todo.id }]"
          @click="handleSelectTask(todo.id)"
        >
          <li class="todo-item">
            <span class="todo-text">{{ todo.text }}</span>
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
  outline: 2px solid currentColor;
  outline-offset: -2px;
  border-radius: 12px;
}

.disabled {
  cursor: not-allowed !important;
  opacity: 0.5;
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
    outline-width: 1.5px;
    border-radius: 10px;
  }
}
</style>
