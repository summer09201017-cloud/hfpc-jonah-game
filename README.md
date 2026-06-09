# 約拿闖關 (Jonah Game)

聖經互動遊戲,主題**約拿書**,給教會主日學用(兒童到成人)。純前端、2D Canvas、無框架、零美術檔(emoji + 向量 + Web Audio 合成),可離線安裝(PWA)。

> 接手開發前請先讀 [`CLAUDE.md`](./CLAUDE.md) —— 內含這台 Windows + Node 24 機器的重大地雷與架構說明。

## 怎麼執行

```bash
npm install      # 第一次才需要
npm run dev      # 啟動 Vite dev server(通常是 http://localhost:5173/,被占用會自動跳 5174)
```

- 一般使用者:**雙擊 `start-game.bat`**(自動找空埠 + 開瀏覽器;伺服器跑在同一視窗,關掉即停)。

## 怎麼建置 / 部署

```bash
npm run build    # = node scripts/bundle-static.mjs,輸出到 site/(不是 dist/,也不要用 vite build)
```

- **已上線:https://hfpc-jonah-game.netlify.app/**(連 GitHub repo 自動部署,push 到 `main` 即重新部署)。`netlify.toml` 已設好(`command = npm run build`、`publish = site`)。
- ⚠️ 不要用 `vite build`:這台機器的 Node 24 在遞迴 `cpSync`/`rmSync` 會讓行程無聲被殺。詳見 `CLAUDE.md`。

## 怎麼玩

- **跳躍**:空白鍵 / ↑ / W / 點擊畫面
- **靜音**:M 或右上 🔊 鈕;**暫停**:P / Esc 或右上 ⏸ 鈕

**第一關 · 約帕港口**(約拿書 1:1–3,橫向跑酷),兩種模式:
- 🏃 **闖關**:自動向前+加速,躲障礙,撞到扣一顆心 ❤️(三顆扣完重來),跑到船 ⛵ = 過關。
- 🚶 **漫步**:自己控制前進(→/右半)/後退(←/左半),無時間壓力;障礙無害;小敵人 🐍🦀🐀 可踩扁加分,側面撞到往後退(不扣命)。
- 沿路撿空中寶物:🪙1 / 🏺3 / 📜5 / 🕊️10 分 + ❤️ 補命。

**第二關 · 暴風雨**(約拿書 1:4–16,平衡穩船):用 ←/→(或畫面左右兩側)把搖晃的船扶正,撐過風暴 = 過關,翻船則失敗。

## 程式結構

```
index.html / styles.css   外殼 + DOM 覆蓋層(選單用 DOM,遊戲畫面用 Canvas)
src/
  main.js        進入點 + Service Worker 註冊/解除
  game.js        主迴圈 + 狀態機 + 關卡協調(第一關跑酷 / 第二關暴風雨)
  config.js      ★ 所有可調數值(速度、重力、關長、WALK、STORM…)
  scripture.js   ★ 各關經文與信息文案
  player.js      約拿:跳躍與重力、命中框
  spawner.js     第一關世界:障礙 / 空中寶物 / 小敵人 的生成
  storm.js       第二關「暴風雨」平衡物理(自成一格)
  renderer.js    所有繪製(Canvas;背景、向量先知、HUD、第二關畫面)
  input.js       原始輸入(鍵盤 / 指標),由 game 依模式詮釋
  ui.js          DOM 覆蓋層 + 右上暫停/靜音鈕
  audio.js       Web Audio 即時合成音效 + 背景音樂(零音檔、可離線)
```

> 調手感改 `config.js`,改經文/信息改 `scripture.js`,不必動遊戲邏輯。

## 路線圖

- [x] 第一關 約帕港口(跑酷,闖關 / 漫步雙模式)
- [x] 漫步 NPC 長者聖經問答 + 船價門檻;標題「📖 聖經問答」練習(題庫 22 題)
- [x] 第二關 暴風雨(平衡穩船,難度已校準)
- [x] 第三關 大魚肚內(默想:走 / 跳 / 蹲 + 跳起碰蠟燭禱告,拿 1:17–2:10)
- [x] 音效 + 背景音樂、手機橫向全螢幕、PWA、啟動器 `start-game.bat`
- [x] 部署到 Netlify → https://hfpc-jonah-game.netlify.app/
- [x] 大富翁外框:已在「保羅大富翁」新增「約拿宣教之旅」路線(嵌入第一 / 二關)
- [ ] 離線煙霧測試(手機安裝 → 關網路 → 確認能玩)
- [ ] 第四~六關:上岸尼尼微、傳道、蓖麻樹
- [ ] 約拿路線地圖改真實「尼尼微 → 地中海」(用 real-geography-board)
- 完整清單見 [`roadmap.md`](./roadmap.md)
