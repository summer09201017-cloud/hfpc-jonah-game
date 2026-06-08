import { defineConfig } from 'vite'

// 約拿闖關 — 開發伺服器設定。
// PWA(可安裝/離線)改用手寫:public/manifest.webmanifest + public/sw.js,
// 不依賴 vite-plugin-pwa(其 Workbox 在 Node 24 下會崩潰)。
export default defineConfig({
  server: {
    host: true,
    port: 5173,
  },
})
