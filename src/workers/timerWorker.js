/**
 * 后台计时 Web Worker
 * 用于在标签页不可见时继续计时
 */

let timer = null

self.onmessage = function(e) {
  if (e.data.type === 'start') {
    if (timer) clearInterval(timer)
    timer = setInterval(() => {
      self.postMessage({ type: 'tick' })
    }, 1000)
  } else if (e.data.type === 'stop') {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
}
