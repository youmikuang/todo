<script setup>
import { ref, computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { usePomodoro } from '@/composables/usePomodoro'
import { useTodo } from '@/composables/useTodo'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps({
  taskId: {
    type: [Number, null],
    default: null
  }
})

const { getStatsData, pomodoroHistory } = usePomodoro()
const { currentTheme } = useTodo()

const activeTimeTab = ref('day')
const activeMetricTab = ref('count')

const timeTabs = [
  { key: 'day', label: '日' },
  { key: 'week', label: '周' },
  { key: 'month', label: '月' }
]

const metricTabs = [
  { key: 'count', label: '次数' },
  { key: 'duration', label: '时长' }
]

// 主题颜色配置
const themeColors = computed(() => {
  const themes = {
    darker: {
      countLine: '#4db8ff',
      countFill: 'rgba(77, 184, 255, 0.2)',
      durationLine: '#ff6b6b',
      durationFill: 'rgba(255, 107, 107, 0.2)',
      text: '#ffdfdb',
      point: '#ffdfdb'
    },
    light: {
      countLine: '#007aff',
      countFill: 'rgba(0, 122, 255, 0.1)',
      durationLine: '#ff3b30',
      durationFill: 'rgba(255, 59, 48, 0.1)',
      text: '#1a150e',
      point: '#1a150e'
    }
  }
  return themes[currentTheme.value] || themes.light
})

const statsResult = computed(() => {
  return getStatsData(activeTimeTab.value, props.taskId)
})

const chartTitle = computed(() => statsResult.value.title)

const chartData = computed(() => {
  const stats = statsResult.value.data
  const isCount = activeMetricTab.value === 'count'

  return {
    labels: stats.map(s => s.label),
    datasets: [
      {
        label: isCount ? '番茄数' : '时长(分钟)',
        data: stats.map(s => isCount ? s.count : s.duration),
        borderColor: isCount ? themeColors.value.countLine : themeColors.value.durationLine,
        backgroundColor: isCount ? themeColors.value.countFill : themeColors.value.durationFill,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: themeColors.value.point,
        pointBorderColor: isCount ? themeColors.value.countLine : themeColors.value.durationLine,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: currentTheme.value === 'light' ? '#333' : 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        label: function(context) {
          const value = context.raw
          if (activeMetricTab.value === 'count') {
            return `${value} 个番茄`
          } else {
            return `${value} 分钟`
          }
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: themeColors.value.text,
        font: {
          size: 12
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        display: false
      },
      ticks: {
        color: themeColors.value.text,
        stepSize: activeMetricTab.value === 'count' ? 1 : undefined,
        font: {
          size: 12
        }
      }
    }
  }
}))

// 强制更新图表当数据变化
const chartKey = ref(0)
watch([pomodoroHistory, activeTimeTab, activeMetricTab, currentTheme, () => props.taskId], () => {
  chartKey.value++
}, { deep: true })
</script>

<template>
  <div class="stats-container">
    <div class="stats-header">
      <div class="metric-tabs">
        <button
          v-for="tab in metricTabs"
          :key="tab.key"
          :class="['metric-btn', { active: activeMetricTab === tab.key }]"
          @click="activeMetricTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="chart-title">{{ chartTitle }}</div>
      <div class="time-tabs">
        <button
          v-for="tab in timeTabs"
          :key="tab.key"
          :class="['tab-btn', { active: activeTimeTab === tab.key }]"
          @click="activeTimeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
    <div class="chart-container">
      <Line :key="chartKey" :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.stats-container {
  width: 100%;
  padding: 1.5rem;
}

.chart-title {
  font-size: 0.9rem;
  opacity: 0.8;
  font-weight: 500;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.metric-tabs {
  display: flex;
  gap: 0.25rem;
}

.metric-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.5;
}

.metric-btn.active {
  opacity: 1;
}

.time-tabs {
  display: flex;
  gap: 0.25rem;
}

.tab-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.5;
}

.tab-btn.active {
  opacity: 1;
}

.chart-container {
  height: 320px;
  width: 100%;
}

@media only screen and (max-width: 768px) {
  .stats-container {
    max-width: 100%;
    padding: 1rem;
  }

  .chart-container {
    height: 200px;
  }

  .stats-header {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
