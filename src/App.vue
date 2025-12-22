<script setup>
import { onMounted } from 'vue'
import { useTodo } from '@/composables/useTodo'
import '@/assets/css/main.css'

const {
  todos,
  inputValue,
  currentDateTime,
  inputClass,
  buttonClass,
  titleClass,
  changeTheme,
  addTodo,
  toggleComplete,
  deleteTodo,
  getTodoClass,
  init
} = useTodo()

onMounted(() => {
  init()
})
</script>

<template>
  <div>
    <div id="header">
      <div class="flexrow-container">
        <div class="standard-theme theme-selector" @click="changeTheme('standard')"></div>
        <div class="light-theme theme-selector" @click="changeTheme('light')"></div>
        <div class="darker-theme theme-selector" @click="changeTheme('darker')"></div>
      </div>
      <h1 id="title" :class="titleClass">好好学习，天天向上。</h1>
    </div>

    <div id="form">
      <form @submit.prevent="addTodo">
        <input
          v-model="inputValue"
          :class="inputClass"
          class="todo-input"
          type="text"
          placeholder="添加一条待办"
        >
        <button :class="['todo-btn', buttonClass]" type="submit">保存</button>
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
          :class="getTodoClass(todo)"
        >
          <li class="todo-item">{{ todo.text }}</li>
          <button
            :class="['check-btn', buttonClass]"
            @click="toggleComplete(todo)"
          >
            <i class="fas fa-check"></i>
          </button>
          <button
            :class="['delete-btn', buttonClass]"
            @click="deleteTodo(todo)"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </ul>
    </div>
  </div>
</template>
