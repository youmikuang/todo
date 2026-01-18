# todo

This Todo List should help get you started developing with Vue 3 in Vite.

## Project Setup

> you can use pnpm/npm/yarn build your website. Below is an example of using yarn.

```sh
yarn
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Compile and Minify for Production

```sh
yarn build
```

### 1. 工具模块 (`src/utils/`)

#### `timeUtils.js` - 时间工具集合

- `formatDisplayTime()` - 格式化显示时间 MM:SS
- `formatTotalTime()` - 格式化总时间 (小时和分钟)
- `parseTimeString()` - 解析时间字符串
- `validateTimeRange()` - 验证和限制时间范围
- `minutesSecondsToSeconds()` / `secondsToMinutesSeconds()` - 单位转换

#### `themeConfig.js` - 主题配置集中管理

- 所有主题颜色定义在一个地方
- `getThemeConfig()` - 获取主题配置
- `getProgressGradient()` - 计算进度条渐变
- `getPickerTheme()` - 获取选择器主题

#### `storageUtils.js` - 存储操作（带错误处理）

- `loadFromStorage()` - 安全读取
- `saveToStorage()` - 安全保存
- `validateStorageData()` - 数据验证

#### `audioUtils.js` - 音频管理

- `preloadAudio()` - 预加载音频
- `playSound()` - 播放声音
- `cleanupAudio()` - 清理资源

#### `timerLogic.js` - 计时器核心逻辑

- `calculateRemainingTime()` - 计算剩余时间
- `calculateElapsedSeconds()` - 计算已过时间
- `isTimerComplete()` - 检查是否完成
- `shouldResumeTimer()` - 检查是否需要恢复

#### `statsUtils.js` - 统计数据计算

- `getDayStats()` - 日统计
- `getWeekStats()` - 周统计
- `getMonthStats()` - 月统计
- `getTaskStats()` - 任务统计

### 2. Web Worker文件 (`src/workers/`)

#### `timerWorker.js` - 独立的Web Worker

- 从内联Blob提取为独立文件
- 更易维护和测试
- 支持模块化加载

### 3. 组件 (`src/components/`)

#### `TimePicker.vue` - 提取的时间选择器组件

- 从PomodoroTimer中分离出来
- 接收主题配置作为props
- 使用v-model进行双向绑定
- 可复用的iOS风格选择器

### 4. 重构的组合式函数

#### `usePomodoro.js` - 精简后的组合式函数

- 从509行减少到368行（减少28%）
- 职责清晰：只负责状态管理和业务逻辑
- 所有工具函数都从专门模块导入
- 添加了Web Worker降级方案
- 改进的错误处理

### 5. 重构的组件

#### `PomodoroTimer.vue` - 精简后的组件

- 从750+行减少到370行（减少50%+）
- 移除了复杂的时间选择器逻辑
- 使用TimePicker组件替代
- 使用themeConfig工具函数
- 代码更清晰，职责单一

## 架构改进

### 关注点分离 (Separation of Concerns)

```bash
src/
├── components/          # UI组件
│   ├── PomodoroTimer.vue    # 计时器显示和控制
│   ├── TimePicker.vue       # 时间选择器（可复用）
│   ├── TodoList.vue
│   └── PomodoroStats.vue
├── composables/         # 业务逻辑
│   ├── usePomodoro.js       # 计时器状态管理
│   └── useTodo.js
├── utils/              # 工具函数
│   ├── timeUtils.js         # 时间工具
│   ├── themeConfig.js       # 主题配置
│   ├── storageUtils.js      # 存储操作
│   ├── audioUtils.js        # 音频管理
│   ├── timerLogic.js        # 计时逻辑
│   └── statsUtils.js        # 统计计算
└── workers/            # Web Workers
    └── timerWorker.js       # 后台计时
```

## 代码质量改进

### 1. 可维护性

- 每个模块职责单一
- 函数功能明确，易于理解
- 代码重复度降低

### 2. 可测试性

- 工具函数纯函数化，易于单元测试
- 存储操作集中，便于mock
- 计时逻辑独立，可单独测试

### 3. 可复用性

- TimePicker组件可在其他项目使用
- 工具函数可独立导入使用
- 主题配置易于扩展

### 4. 错误处理

- localStorage操作添加try-catch
- Web Worker创建失败有降级方案
- 数据验证防止损坏数据

### 5. 性能

- Web Worker从Blob改为文件加载
- 模块化加载，按需导入
- 减少不必要的计算
