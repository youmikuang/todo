<script setup>
import PomodoroTimer from '@/components/PomodoroTimer.vue'
import TodoList from '@/components/TodoList.vue'
import '@/assets/css/main.css'
</script>

<template>
  <div class="app-container">
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
  }

  .todo-section {
    flex: 0 0 60%;
    min-height: 0;
    overflow-y: auto;
  }
}
</style>
