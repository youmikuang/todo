/**
 * 主题配置集中管理
 */

export const THEME_COLORS = {
  darker: {
    progress: {
      start: '#ff6b6b',
      end: '#ffd93d',
      bg: 'rgba(255, 255, 255, 0.1)'
    },
    picker: {
      bg: '#0a3a4a',
      headerBg: '#0a3a4a',
      text: '#ffdfdb',
      subText: 'rgba(255,223,219,0.6)',
      highlight: 'rgba(255,255,255,0.1)',
      border: 'rgba(255,255,255,0.1)',
      confirm: '#4db8ff'
    },
    timer: {
      bg: '#062e3f'
    }
  },
  light: {
    progress: {
      start: '#667eea',
      end: '#764ba2',
      bg: 'rgba(102, 126, 234, 0.15)'
    },
    picker: {
      bg: '#ffffff',
      headerBg: '#f7f7f7',
      text: '#1a150e',
      subText: '#666',
      highlight: 'rgba(0,0,0,0.06)',
      border: '#e0e0e0',
      confirm: '#007aff'
    },
    timer: {
      bg: '#d4f1ff'
    }
  }
}

/**
 * 获取指定主题的配置
 */
export function getThemeConfig(themeName) {
  return THEME_COLORS[themeName] || THEME_COLORS.darker
}

/**
 * 获取进度条渐变色
 */
export function getProgressGradient(themeName, progress) {
  const config = getThemeConfig(themeName)
  const { start, end, bg } = config.progress

  if (progress === 0) {
    return bg
  }

  return `conic-gradient(from 0deg, ${start} 0%, ${end} ${progress}%, ${bg} ${progress}%)`
}

/**
 * 获取选择器主题
 */
export function getPickerTheme(themeName) {
  return getThemeConfig(themeName).picker
}

/**
 * 获取计时器背景色
 */
export function getTimerBg(themeName) {
  return getThemeConfig(themeName).timer.bg
}
