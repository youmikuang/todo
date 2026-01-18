<script setup>
import { ref, nextTick, computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    validator: (val) => 'minutes' in val && 'seconds' in val
  },
  theme: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const selectedMinutes = ref(props.modelValue.minutes)
const selectedSeconds = ref(props.modelValue.seconds)
const minutesRef = ref(null)
const secondsRef = ref(null)

const ITEM_HEIGHT = 40

// 生成分钟列表 0-60
const minutesList = Array.from({ length: 61 }, (_, i) => i)
// 生成秒列表 0-59
const secondsList = Array.from({ length: 60 }, (_, i) => i)

let scrollTimeout = null

// 滚动到选中位置
function scrollToSelected() {
  if (minutesRef.value) {
    minutesRef.value.scrollTop = selectedMinutes.value * ITEM_HEIGHT
  }
  if (secondsRef.value) {
    secondsRef.value.scrollTop = selectedSeconds.value * ITEM_HEIGHT
  }
}

// 处理滚动结束
function handleScrollEnd(type) {
  const ref = type === 'minutes' ? minutesRef.value : secondsRef.value
  if (!ref) return

  const scrollTop = ref.scrollTop
  const index = Math.round(scrollTop / ITEM_HEIGHT)
  const maxIndex = type === 'minutes' ? 60 : 59
  const clampedIndex = Math.max(0, Math.min(index, maxIndex))

  if (type === 'minutes') {
    selectedMinutes.value = clampedIndex
    // 如果是60分钟，秒数强制为0
    if (clampedIndex === 60) {
      selectedSeconds.value = 0
      if (secondsRef.value) {
        secondsRef.value.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  } else {
    // 如果当前是60分钟，秒数不能修改
    if (selectedMinutes.value === 60) {
      selectedSeconds.value = 0
      ref.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    selectedSeconds.value = clampedIndex
  }

  // 平滑滚动到对齐位置
  ref.scrollTo({
    top: clampedIndex * ITEM_HEIGHT,
    behavior: 'smooth'
  })
}

function handleScroll(type) {
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    handleScrollEnd(type)
  }, 100)
}

// 确认选择
function handleConfirm() {
  emit('update:modelValue', {
    minutes: selectedMinutes.value,
    seconds: selectedSeconds.value
  })
  emit('confirm')
}

// 取消编辑
function handleCancel() {
  emit('cancel')
}

// 监听 props 变化
watch(() => props.modelValue, (newVal) => {
  selectedMinutes.value = newVal.minutes
  selectedSeconds.value = newVal.seconds
  nextTick(() => {
    scrollToSelected()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    scrollToSelected()
  })
})
</script>

<template>
  <div class="picker-overlay" @click.self="handleCancel">
    <div
      class="picker-container"
      :style="{
        background: theme.bg,
        color: theme.text
      }"
    >
      <div
        class="picker-header"
        :style="{
          background: theme.headerBg,
          borderColor: theme.border
        }"
      >
        <button
          class="picker-btn cancel"
          @click="handleCancel"
          :style="{ color: theme.subText }"
        >取消</button>
        <span class="picker-title"></span>
        <button
          class="picker-btn confirm"
          @click="handleConfirm"
          :style="{ color: theme.confirm }"
        >确定</button>
      </div>

      <div
        class="picker-content"
        :style="{ background: theme.bg }"
      >
        <div class="picker-column">
          <div
            ref="minutesRef"
            class="picker-scroll"
            @scroll="handleScroll('minutes')"
          >
            <div class="picker-padding"></div>
            <div
              v-for="m in minutesList"
              :key="'m' + m"
              class="picker-item"
              :class="{ active: m === selectedMinutes }"
              :style="{ color: m === selectedMinutes ? theme.text : theme.subText }"
            >
              {{ String(m).padStart(2, '0') }}
            </div>
            <div class="picker-padding"></div>
          </div>
          <div class="picker-label" :style="{ color: theme.subText }">分钟</div>
        </div>

        <div class="picker-separator" :style="{ color: theme.text }">:</div>

        <div class="picker-column">
          <div
            ref="secondsRef"
            class="picker-scroll"
            @scroll="handleScroll('seconds')"
          >
            <div class="picker-padding"></div>
            <div
              v-for="s in secondsList"
              :key="'s' + s"
              class="picker-item"
              :class="{ active: s === selectedSeconds }"
              :style="{ color: s === selectedSeconds ? theme.text : theme.subText }"
            >
              {{ String(s).padStart(2, '0') }}
            </div>
            <div class="picker-padding"></div>
          </div>
          <div class="picker-label" :style="{ color: theme.subText }">秒</div>
        </div>
      </div>

      <div
        class="picker-highlight"
        :style="{ background: theme.highlight }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
  padding-top: env(safe-area-inset-top, 0);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.picker-container {
  background: #f7f7f7;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 500px;
  padding-bottom: env(safe-area-inset-bottom, 20px);
  animation: slideUp 0.3s ease;
  position: relative;
  overflow: hidden;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f7f7f7;
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.picker-btn {
  background: none;
  border: none;
  font-size: 16px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 8px;
}

.picker-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.picker-btn.cancel {
  color: #666;
}

.picker-btn.confirm {
  color: #007aff;
  font-weight: 600;
}

.picker-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 40px;
  height: 200px;
  position: relative;
  background: #f7f7f7;
}

.picker-highlight {
  position: absolute;
  left: 50%;
  top: 57%;
  transform: translate(-50%, -50%);
  width: 220px;
  height: 44px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  pointer-events: none;
  z-index: 0;
}

.picker-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.picker-scroll {
  height: 120px;
  width: 80px;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  text-align: center;
}

.picker-scroll::-webkit-scrollbar {
  display: none;
}

.picker-padding {
  height: 40px;
}

.picker-item {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #999;
  scroll-snap-align: center;
  transition: all 0.15s ease;
  cursor: pointer;
}

.picker-item.active {
  color: #000;
  font-weight: 500;
  font-size: 24px;
}

.picker-label {
  font-size: 13px;
  color: #666;
  margin-top: 8px;
}

.picker-separator {
  font-size: 28px;
  font-weight: 500;
  color: #333;
  margin: 0 8px;
  padding-bottom: 28px;
  z-index: 1;
}

@media (min-width: 769px) {
  .picker-overlay {
    align-items: center;
  }

  .picker-container {
    border-radius: 16px;
    max-width: 320px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .picker-content {
    padding: 30px 20px;
  }
}
</style>
