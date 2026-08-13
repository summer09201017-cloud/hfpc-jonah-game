// 約拿闖關 — 手寫 Service Worker(可安裝 + 離線)
// 策略:核心檔案安裝時預快取;所有 GET 都「網路優先」——線上一律拿最新,
// 順手更新快取;離線時才退回快取。這樣改版不會被舊快取黏住。
// 改版時把 CACHE 版本號 +1,舊快取會在啟用時自動清除。

// v7(2026-08-13)：🔊 補上預烤曉臻人聲(tts/)+ 修統計斷流。
//   ★ 由來：本站 speak.js 是從 hfpc-paul-game 複製過來的,**帶了「mp3 優先」的邏輯、
//     卻沒帶「烤 mp3」那一步** ⇒ tts/manifest.json 從上線起就 404
//     ⇒ 六關經文全部用 Web Speech 機器聲唸(使用者 0730 明令禁止的那種)。
//     零錯誤、零紅燈,只有真的按下朗讀鍵的人聽得出來。
//   ★ mp3 進 CORE = 教室沒網路也有人聲(本站賣點就是安裝後馬上離線可玩)。
const CACHE = 'jonah-v7'
// 預快取「整個 app shell」(HTML + CSS + 全部 ES 模組 + 圖示),
// 這樣「安裝後馬上離線」(教室沒網路)也能玩,不必先線上完整跑一輪。
// 仍是 network-first(下方 fetch):線上一律拿最新並更新快取,離線才退回這份預快取。
// ⚠ 新增 src/ 模組時,記得把它加進這份清單(npm test 會提醒未列入預快取的入口 JS)。
const CORE = [
  '/',
  '/index.html',
  '/styles.css',
  '/src/main.js',
  '/src/game.js',
  '/src/config.js',
  '/src/scripture.js',
  '/src/quiz.js',
  '/src/player.js',
  '/src/spawner.js',
  '/src/storm.js',
  '/src/renderer.js',
  '/src/input.js',
  '/src/ui.js',
  '/src/audio.js',
  // 🔊 預烤曉臻人聲（檔名=ttsKey 雜湊；哪一關對哪支見 scripts/verify-tts.mjs 的輸出）
  '/tts/manifest.json',
  '/tts/5e9d2065.mp3', // L1 約拿書 1:1–3
  '/tts/dceb20c1.mp3', // L2 約拿書 1:4–16
  '/tts/3c44ec03.mp3', // L3 約拿書 1:17–2:10
  '/tts/572acf61.mp3', // L4 約拿書 2:10–3:3
  '/tts/8b2b8e79.mp3', // L5 約拿書 3:4–10
  '/tts/15ec2fe4.mp3', // L6 約拿書 4:1–11
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/pwa-192x192.png',
  '/icons/pwa-512x512.png',
  '/icons/apple-touch-icon-180x180.png',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {}))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return

  // 導覽(開啟頁面):網路優先,離線時退回快取首頁
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', copy))
          return res
        })
        .catch(() =>
          caches.match('/index.html').then((r) => r || caches.match('/'))
        )
    )
    return
  }

  // 其他資源:網路優先(線上拿最新並更新快取),離線時退回快取
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(() => caches.match(req))
  )
})
