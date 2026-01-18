/**
 * 音频管理模块
 */

let preloadedAudio = null

/**
 * 预加载音频文件
 * 解决后台标签页无法播放的问题
 */
export function preloadAudio() {
  if (!preloadedAudio) {
    preloadedAudio = new Audio('/Cuckoo.mp3')
    preloadedAudio.load()
  }
}

/**
 * 播放声音
 */
export function playSound(enabled = true) {
  if (!enabled) return

  try {
    if (preloadedAudio) {
      preloadedAudio.currentTime = 0
      preloadedAudio.play()
    } else {
      const audio = new Audio('/Cuckoo.mp3')
      audio.play()
    }
  } catch (error) {
    console.error('Failed to play sound:', error)
  }
}

/**
 * 清理音频资源
 */
export function cleanupAudio() {
  if (preloadedAudio) {
    preloadedAudio.pause()
    preloadedAudio = null
  }
}
