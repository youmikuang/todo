<script setup>
import { ref } from 'vue'
import PomodoroTimer from '@/components/PomodoroTimer.vue'
import TodoList from '@/components/TodoList.vue'
import { useTodo } from '@/composables/useTodo'
import '@/assets/css/main.css'

const { currentTheme } = useTodo()
const isTodoCollapsed = ref(false)

const toggleTodoCollapse = () => {
  isTodoCollapsed.value = !isTodoCollapsed.value
}
</script>

<template>
  <div class="app-container" :class="[currentTheme, { 'todo-collapsed': isTodoCollapsed }]">
    <div class="pomodoro-section">
      <PomodoroTimer />
    </div>
    <button class="collapse-btn" @click="toggleTodoCollapse" :title="isTodoCollapsed ? '展开待办' : '折叠待办'">
      <span class="collapse-icon">{{ isTodoCollapsed ? '◀' : '▶' }}</span>
    </button>
    <div class="todo-section" :class="{ collapsed: isTodoCollapsed }">
      <TodoList v-show="!isTodoCollapsed" />
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
}

.todo-collapsed .pomodoro-section {
  flex: 1;
}

.collapse-btn {
  position: absolute;
  right: 40%;
  top: 50%;
  transform: translate(50%, -50%);
  z-index: 100;
  width: 20px;
  height: 40px;
  background: inherit;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, border-color 0.2s ease, right 0.3s ease;
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
  transform: translate(50%, -50%);
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
  transition: flex 0.3s ease, width 0.3s ease, opacity 0.3s ease;
}

.todo-section.collapsed {
  flex: 0;
  width: 0;
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
    flex: 0 0 40%;
    min-height: 0;
    padding-top: 1.5rem;
  }

  .todo-section {
    flex: 0 0 60%;
    min-height: 0;
    overflow-y: auto;
    padding-top: env(safe-area-inset-top, 0px);
  }
}
</style>

<style>
/* 主题背景色 - 非scoped确保生效 */
.app-container.standard,
.app-container.light,
.app-container.darker {
  background-color: transparent !important;
}
</style>
