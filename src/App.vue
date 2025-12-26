<script setup>
import PomodoroTimer from '@/components/PomodoroTimer.vue'
import TodoList from '@/components/TodoList.vue'
import { useTodo } from '@/composables/useTodo'
import '@/assets/css/main.css'

const { currentTheme } = useTodo()
</script>

<template>
  <div class="app-container" :class="currentTheme">
    <div class="pomodoro-section">
      <PomodoroTimer />
    </div>
    <div class="todo-section">
      <TodoList />
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
  border-right: 1px solid rgba(128, 128, 128, 0.2);
}

.todo-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* 手机端上下布局 */
@media only screen and (max-width: 768px) {
  .app-container {
    flex-direction: column-reverse;
  }

  .pomodoro-section {
    border-right: none;
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
