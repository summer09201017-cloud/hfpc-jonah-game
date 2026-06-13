import { Game } from './game.js'
import { UI } from './ui.js'

// 進入點:建立遊戲、啟動。
// ui 由進入點注入（單機用真 UI；嵌入保羅大富翁時改注入空殼 NullUI，見保羅的 MiniGameModal）。
const canvas = document.getElementById('game')
const game = new Game(canvas, { ui: new UI() })
game.boot()

// 試玩捷徑(戰爭闖關原型,驗證手感用):網址加 ?level=moses 直接進「摩西舉手之戰」(出 17)。
// 不影響正常六關流程——一般玩家看不到;之後要嵌入保羅大富翁則走 opts.level=7。
try {
  const lv = new URLSearchParams(location.search).get('level')
  if (lv === 'moses' && game.startMoses) game.startMoses()
  else if (lv === 'jehoshaphat' && game.startJehoshaphat) game.startJehoshaphat()
  else if (lv === 'balaam' && game.startBalaam) game.startBalaam()
} catch {}

// Service Worker 策略:
//   - 開發環境(localhost):移除任何已註冊的 SW 並清掉快取,確保永遠載入最新程式
//     (否則「快取優先」的 SW 會一直餵舊檔,改了沒反應)。
//   - 正式環境(Netlify 等):註冊 SW,提供可安裝/離線能力。
const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(location.hostname)

if ('serviceWorker' in navigator) {
  if (isLocalhost) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister())
    })
    if (window.caches) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  }
}
