import { Game } from './game.js'
import { UI } from './ui.js'

// 進入點:建立遊戲、啟動。
// ui 由進入點注入（單機用真 UI；嵌入保羅大富翁時改注入空殼 NullUI，見保羅的 MiniGameModal）。
const canvas = document.getElementById('game')
const game = new Game(canvas, { ui: new UI() })
game.boot()

// 試玩捷徑(戰爭闖關原型):網址加 ?level=moses / jehoshaphat / balaam 直接進該關。
// ⚠ 全螢幕只能在「使用者手勢」中觸發,所以不在載入時自動開關卡(否則 requestFullscreen 會被擋,
//   就會「有橫式卻無法全螢幕」)。改成先顯示「點擊開始」大鈕,在那個點擊裡才開關卡 → 全螢幕生效。
//   (正常六關本來就是點標題「開始」才進關,所以一向正常;這裡是補上捷徑缺的那個手勢。)
try {
  const lv = new URLSearchParams(location.search).get('level')
  const starter = { moses: 'startMoses', redsea: 'startRedSea', jehoshaphat: 'startJehoshaphat', balaam: 'startBalaam' }[lv]
  if (starter && typeof game[starter] === 'function') {
    if (game.ui && game.ui.hide) game.ui.hide() // 蓋掉預設的第一關標題
    const gate = document.createElement('div')
    gate.setAttribute('style', 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#0e1726;')
    const btn = document.createElement('button')
    btn.textContent = '點擊開始 ▶'
    btn.setAttribute('style', 'padding:18px 44px;font-size:26px;font-weight:700;color:#fff;background:#c0392b;border:none;border-radius:16px;cursor:pointer;font-family:system-ui;-webkit-tap-highlight-color:transparent;')
    gate.appendChild(btn)
    document.body.appendChild(gate)
    const go = () => {
      window.removeEventListener('keydown', go)
      gate.remove()
      game[starter]() // 在使用者手勢中 → _enterImmersive 的全螢幕+鎖橫向才會被允許
    }
    btn.addEventListener('click', go, { once: true })
    window.addEventListener('keydown', go)
  }
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
