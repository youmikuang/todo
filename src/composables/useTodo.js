import { ref, computed } from 'vue'

// 共享状态 - 在所有组件间共享
const currentTheme = ref('light')

export function useTodo() {
  const todos = ref([])
  const inputValue = ref('')
  const currentDateTime = ref('')

  // 计算属性
  const inputClass = computed(() => `${currentTheme.value}-input`)
  const buttonClass = computed(() => `${currentTheme.value}-button`)
  const titleClass = computed(() => currentTheme.value === 'darker' ? 'darker-title' : '')

  // 更新时间
  function updateDateTime() {
    currentDateTime.value = new Date().toLocaleString()
  }

  // 从 localStorage 加载数据
  function loadTodos() {
    const saved = localStorage.getItem('todos')
    if (saved) {
      todos.value = JSON.parse(saved).map((text, index) => ({
        id: Date.now() + index,
        text,
        completed: false,
        falling: false
      }))
    }
  }

  // 保存到 localStorage
  function saveTodos() {
    const todoTexts = todos.value.filter(t => !t.falling).map(t => t.text)
    localStorage.setItem('todos', JSON.stringify(todoTexts))
  }

  // 主题背景色映射
  const themeColors = {
    standard: '#062e3f',
    light: '#d4f1ff',
    darker: '#001f29'
  }

  // 更新背景色
  function updateBackgroundColor(theme) {
    document.documentElement.style.background = themeColors[theme] || themeColors.light
  }

  // 加载主题
  function loadTheme() {
    const saved = localStorage.getItem('savedTheme')
    currentTheme.value = saved || 'light'
    document.body.className = currentTheme.value
    updateBackgroundColor(currentTheme.value)
  }

  // 切换主题
  function changeTheme(theme) {
    currentTheme.value = theme
    localStorage.setItem('savedTheme', theme)
    document.body.className = theme
    updateBackgroundColor(theme)
  }

  // 添加待办
  function addTodo() {
    if (!inputValue.value.trim()) {
      alert('必须输入内容！')
      return
    }
    todos.value.push({
      id: Date.now(),
      text: inputValue.value,
      completed: false,
      falling: false
    })
    saveTodos()
    inputValue.value = ''
  }

  // 切换完成状态
  function toggleComplete(todo) {
    todo.completed = !todo.completed
  }

  // 删除待办
  function deleteTodo(todo) {
    todo.falling = true
    setTimeout(() => {
      todos.value = todos.value.filter(t => t.id !== todo.id)
      saveTodos()
    }, 800)
  }

  // 获取待办项样式类
  function getTodoClass(todo) {
    return {
      'todo': true,
      [`${currentTheme.value}-todo`]: true,
      'completed': todo.completed,
      'fall': todo.falling
    }
  }

  // 初始化
  function init() {
    loadTheme()
    loadTodos()
    updateDateTime()
    setInterval(updateDateTime, 1000)
  }

  return {
    todos,
    inputValue,
    currentTheme,
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
  }
}
