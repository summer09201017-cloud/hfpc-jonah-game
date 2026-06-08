// 約拿闖關 — 手寫 Service Worker(可安裝 + 離線)
// 策略:核心檔案安裝時預快取;所有 GET 都「網路優先」——線上一律拿最新,
// 順手更新快取;離線時才退回快取。這樣改版不會被舊快取黏住。
// 改版時把 CACHE 版本號 +1,舊快取會在啟用時自動清除。

const CACHE = 'jonah-v2'
const CORE = [
  '/',
  '/index.html',
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
