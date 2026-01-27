import { ref, computed } from 'vue'

// 共享状态
const currentTheme = ref('light')
const todos = ref([])
const selectedTaskId = ref(null)

// 解析 todo 名称中的目标番茄钟数 (例如 "mysql * 3" 返回 3)
export function parseTargetPomodoros(text) {
  const match = text.match(/\*\s*(\d+)\s*$/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return null
}

// 获取 todo 的进度百分比
export function getTodoProgress(todo, taskStats) {
  const target = parseTargetPomodoros(todo.text)
  if (!target || target <= 0) return null

  const completed = taskStats?.count || 0
  const progress = Math.min(100, Math.round((completed / target) * 100))
  return progress
}

// 模块加载时初始化数据
function initData() {
  // 加载主题
  const savedTheme = localStorage.getItem('savedTheme')
  currentTheme.value = savedTheme || 'light'
  document.body.className = currentTheme.value
  document.documentElement.className = `${currentTheme.value}-html`

  // 加载 todos
  const savedTodos = localStorage.getItem('todos')
  if (savedTodos) {
    const data = JSON.parse(savedTodos)
    if (Array.isArray(data) && data.length > 0) {
      if (typeof data[0] === 'string') {
        todos.value = data.map((text, index) => ({
          id: Date.now() + index,
          text,
          completed: false,
          falling: false
        }))
      } else {
        todos.value = data.map(t => ({ ...t, falling: false }))
      }
    }
  }

  // 加载选中的任务
  const savedTaskId = localStorage.getItem('selectedTaskId')
  if (savedTaskId) {
    const taskId = parseInt(savedTaskId)
    if (todos.value.some(t => t.id === taskId)) {
      selectedTaskId.value = taskId
    } else {
      localStorage.removeItem('selectedTaskId')
    }
  }
}

initData()

export function useTodo() {
  const inputValue = ref('')
  const currentDateTime = ref('')

  const inputClass = computed(() => `${currentTheme.value}-input`)
  const buttonClass = computed(() => `${currentTheme.value}-button`)
  const titleClass = computed(() => `${currentTheme.value}-title`)

  const selectedTask = computed(() => {
    return todos.value.find(t => t.id === selectedTaskId.value) || null
  })

  function updateDateTime() {
    currentDateTime.value = new Date().toLocaleString()
  }

  function saveTodos() {
    const todoData = todos.value.filter(t => !t.falling).map(t => ({
      id: t.id,
      text: t.text,
      completed: t.completed
    }))
    localStorage.setItem('todos', JSON.stringify(todoData))
  }

  function changeTheme(theme) {
    currentTheme.value = theme
    localStorage.setItem('savedTheme', theme)
    document.body.className = theme
    document.documentElement.className = `${theme}-html`
  }

  function toggleTheme() {
    const themes = ['light', 'standard', 'darker']
    const currentIndex = themes.indexOf(currentTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    changeTheme(themes[nextIndex])
  }

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

  function toggleComplete(todo) {
    todo.completed = !todo.completed
    saveTodos()
  }

  function editTodo(todo, newText) {
    if (!newText.trim()) return false
    todo.text = newText.trim()
    saveTodos()
    return true
  }

  function deleteTodo(todo) {
    todo.falling = true
    if (selectedTaskId.value === todo.id) {
      selectedTaskId.value = null
      localStorage.removeItem('selectedTaskId')
    }
    setTimeout(() => {
      todos.value = todos.value.filter(t => t.id !== todo.id)
      saveTodos()
    }, 800)
  }

  function selectTask(taskId) {
    selectedTaskId.value = selectedTaskId.value === taskId ? null : taskId
    if (selectedTaskId.value !== null) {
      localStorage.setItem('selectedTaskId', selectedTaskId.value.toString())
    } else {
      localStorage.removeItem('selectedTaskId')
    }
  }

  function getTodoClass(todo) {
    return {
      'todo': true,
      [`${currentTheme.value}-todo`]: true,
      'completed': todo.completed,
      'fall': todo.falling
    }
  }

  function init() {
    updateDateTime()
    setInterval(updateDateTime, 1000)
  }

  return {
    todos,
    inputValue,
    currentTheme,
    currentDateTime,
    selectedTaskId,
    selectedTask,
    inputClass,
    buttonClass,
    titleClass,
    changeTheme,
    toggleTheme,
    addTodo,
    toggleComplete,
    editTodo,
    deleteTodo,
    selectTask,
    getTodoClass,
    init,
    parseTargetPomodoros,
    getTodoProgress
  }
}
