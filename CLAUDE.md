# Todo — 番茄钟待办应用

一个基于 Vue 3 + Vite 的待办与番茄钟组合 Web 应用，支持主题切换、番茄计时、任务进度追踪和数据持久化。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3 (Composition API, `<script setup>`) |
| 构建 | Vite 7 |
| 图表 | Chart.js + vue-chartjs |
| 导出 | xlsx (Excel) |
| 字体 | Font Awesome 5, Work Sans |

## 快速开始

```sh
npm install        # 或 pnpm / yarn
npm run dev        # 开发服务器 → http://localhost:5183
npm run build      # 生产构建
npm run preview    # 预览生产构建
```

Vite 配置了 `host: true`，开发服务器可通过局域网 IP 访问（如 `http://192.168.41.4:5183`）。

## 项目结构

```
src/
├── App.vue                    # 根布局：番茄钟区 + 折叠按钮 + 待办区 + 时钟
├── main.js                    # 入口，挂载 #app
├── components/
│   ├── TodoList.vue           # 待办列表 + 主题切换按钮 + 全屏按钮
│   ├── PomodoroTimer.vue      # 番茄计时器 UI（倒计时圆环 + 控制按钮）
│   ├── PomodoroStats.vue      # 统计图表（Chart.js）
│   └── TimePicker.vue         # iOS 风格时间选择器（可复用）
├── composables/
│   ├── useTodo.js             # 待办 + 主题状态管理（共享状态，localStorage 持久化）
│   └── usePomodoro.js         # 番茄计时状态管理（Web Worker 驱动）
├── utils/
│   ├── themeConfig.js         # 主题颜色/渐变集中配置
│   ├── timeUtils.js           # 时间格式化与转换
│   ├── timerLogic.js          # 计时器核心计算逻辑
│   ├── storageUtils.js        # localStorage 安全读写（带错误处理）
│   ├── audioUtils.js          # 音频预加载与播放
│   └── statsUtils.js          # 统计数据聚合（日/周/月/任务维度）
├── workers/
│   └── timerWorker.js         # 后台计时 Worker（每秒 tick）
└── assets/
    ├── css/main.css           # 全局样式 + 主题变量 + 响应式
    └── fonts/WorkSans-Light.woff2
```

## 核心架构

### 状态共享

`useTodo()` 和 `usePomodoro()` 均使用**模块级共享状态**（Vue 3 `ref` 定义在 composable 函数外部），因此 `App.vue`、`TodoList.vue`、`PomodoroTimer.vue` 等多处调用会获得同一份响应式数据，无需 provide/inject。

### 数据流

```
localStorage ←→ useTodo()/usePomodoro() initData() ←→ Vue 组件
                                  ↕
                          timerWorker.js (后台 tick)
```

- **初始化**：模块加载时自动从 `localStorage` 恢复数据
- **持久化**：数据变更后自动写入 `localStorage`（watch 驱动）
- **番茄计时**：`timerWorker.js` 每秒 postMessage，主线程更新 `seconds`/`minutes`

### 主题系统

- 支持 `light` / `darker` 两种主题
- `themeConfig.js` 集中管理颜色、渐变、进度条样式
- `useTodo()` 提供 `currentTheme`、`toggleTheme()`、`inputClass`/`buttonClass`/`titleClass` computed
- 主题切换通过 `TodoList.vue` 中的 `handleThemeToggle()` 实现圆形扩散/收缩动画（使用 `position: fixed` 覆盖层 + `clip-path`）

### 番茄钟与待办的关联

- 每个待办可指定目标番茄数（格式：`任务名 * N`）
- `getTodoProgress()` 计算每个待办的进度百分比
- 计时完成时自动记录到 `pomodoroHistory`，关联 `taskId`
- `TodoList.vue` 中 watch `pomodoroHistory`，进度达 100% 自动完成待办

## 关键 composable API

### useTodo()

| 导出 | 说明 |
| --- | --- |
| `todos` (ref) | 待办列表 |
| `currentTheme` (ref) | 当前主题 `'light'` / `'darker'` |
| `selectedTaskId` (ref) | 当前选中的待办 ID |
| `toggleTheme()` | 切换主题 |
| `addTodo()` | 添加待办 |
| `toggleComplete(todo)` | 切换完成状态 |
| `deleteTodo(todo)` | 删除待办（带 falling 动画） |
| `editTodo(todo, newText)` | 编辑待办文本 |
| `parseTargetPomodoros(text)` | 解析目标番茄数 |
| `getTodoProgress(todo, taskStats)` | 计算进度百分比 |

### usePomodoro()

| 导出 | 说明 |
| --- | --- |
| `minutes`, `seconds` (ref) | 当前剩余时间 |
| `isRunning` (ref) | 是否运行中 |
| `pomodoroHistory` (ref) | 历史记录数组 |
| `toggleTimer()` | 开始/暂停 |
| `reset(autoStart)` | 重置计时 |
| `setTime(min, sec)` | 设置预设时间 |
| `getTaskStats(taskId)` | 获取任务维度统计 |
| `getStatsData(type, taskId)` | 获取图表统计数据 |

## 注意事项

- **主题切换动画**：当前使用 `position: fixed` 覆盖层 + `clip-path` 过渡替代 View Transitions API，因为 `.app-container` 上的 `transform: translateZ(0)` 会干扰 `::view-transition` 伪元素的坐标映射。
- **深色 → 浅色**：覆盖层从全屏收缩到按钮（左下角先露出浅色）
- **浅色 → 深色**：覆盖层从按钮向外扩散
- **全屏模式**：按 `F` 键或点击全屏按钮，全屏时自动折叠待办区
- **折叠/展开**：按 `C` 键或点击中间折叠按钮
- **空格键**：暂停/继续番茄计时
- **移动端**：使用 `column-reverse` 上下布局，折叠按钮隐藏
- **localStorage**：所有数据自动持久化，存储操作有 try-catch 保护
