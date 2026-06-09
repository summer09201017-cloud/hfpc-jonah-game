# CLAUDE.md — 約拿闖關 (Jonah Game)

給接手這個專案的 AI / 開發者讀。**先讀這頁(架構 / 地雷),狀態看 `roadmap.md`(已完成 vs 真正待做),玩法看 `README.md`。** 對齊現況(2026-06-10)。

## 這是什麼

聖經互動遊戲,主題**約拿書**,給教會主日學用(兒童到成人)。純前端、2D Canvas、無框架。
台灣教會場景,介面與經文用**繁體中文 + 和合本**;神學取向改革宗/巴刻。
GitHub: `https://github.com/summer09201017-cloud/hfpc-jonah-game`(branch `main`)。

> 相關專案:**保羅大富翁**(React+Vite 擲骰移動桌遊外框,GitHub `hfpc-paul-game`;本機路徑 `C:\Users\HFP\Downloads\0609\保羅大富翁\保羅大富翁`,**因機器而異**)。
> 兩者現在**有關聯**:保羅大富翁把本遊戲的**第一/二關當小遊戲嵌入**,並新增了一條「約拿宣教之旅」棋盤路線。共用同一套 skill 生態。

## 怎麼跑(開發)

```bash
npm install
npm run dev          # Vite dev server
```
- **這台機器上 5173 常被「保羅大富翁」佔用,約拿會自動跑到 5174**(或更高)。看終端機印的網址為準。
- 一般使用者:**雙擊 `start-game.bat`**(會自動找空埠 + 開瀏覽器;伺服器跑在同一視窗,關掉即停)。
- 用 `web-launch` skill 也可啟動。

## 怎麼建置 / 部署

```bash
npm run build        # 不是 vite build!見下方「重大地雷」
```
- `npm run build` = `node scripts/bundle-static.mjs`,把靜態檔**逐檔複製**到 **`site/`**(不是 `dist/`)。
- 部署:`netlify.toml` 已設好(`command = npm run build`、`publish = site`,並加了 .webmanifest MIME / sw.js no-cache 標頭)。
- **已上線(2026-06-09):連 GitHub repo 自動部署 → https://hfpc-jonah-game.netlify.app/**
  (站名取了 `hfpc-jonah-game`,非原規劃的 `hfpc-jonah`)。之後 push 到 `main` 會自動重新部署。

## ⚠️ 三個重大地雷(這台 Windows + Node 24 機器,務必遵守)

1. **不要用 `vite build` / rollup。** 遞迴 `cpSync`/`rmSync` 會讓行程無聲被殺(exit 127)。
   已改用 `scripts/bundle-static.mjs`(自己 `readdirSync` + 單檔 `copyFileSync`,輸出到未被鎖的 `site/`)。
2. **`.bat` 檔一律純英文 + CRLF 換行。** 中文會亂碼、被當指令;LF 換行會讓 `goto`/標籤解析失敗導致雙擊閃退。
   `.gitattributes` 已鎖定 `*.bat eol=crlf`。寫完用 `LC_ALL=C grep -c '[^ -~\t]' x.bat` 確認非 ASCII 為 0。
3. **Service Worker 在 localhost 會自動 unregister。** `src/main.js`:localhost 移除 SW + 清快取(否則改了碼看不到效果);只有正式環境才註冊 SW。改 SW 後把 `public/sw.js` 的 `CACHE` 版本號 +1。

## 架構(每個檔負責一件事)

```
index.html / styles.css   外殼 + DOM 覆蓋層(選單用 DOM,遊戲畫面用 Canvas)
src/
  main.js        進入點 + Service Worker 註冊/解除
  game.js        主迴圈 + 狀態機(title/playing/paused/win/lose/quiz/fish)+ 關卡協調(L1 跑酷 / L2 暴風雨 / L3 大魚肚默想 + 聖經問答)
  config.js      ★ 所有可調數值(速度、重力、關長、WALK、STORM、FARE 船價、FISH 大魚肚…)
  scripture.js   ★ 各關經文與信息文案(LEVEL1、LEVEL2、LEVEL3 含魚腹禱告 stations)
  quiz.js        ★ 聖經問答題庫(漫步 NPC 長者 + 標題練習,約 22 題,約拿書 1–2)
  player.js      約拿:跳躍/重力/蹲下(crouching)、命中框
  spawner.js     第一關世界:障礙、空中寶物(加權隨機)、小敵人、NPC 長者(漫步問答) 的生成與移動
  storm.js       第二關「暴風雨」整關場景(平衡物理),自成一格
  renderer.js    所有繪製:背景/角色(向量先知,含跳/蹲)/HUD/第二關(_drawStorm)/第三關(_drawFish)
  input.js       原始輸入提供者(鍵盤 held:左右/下蹲 + 跳/暫停/靜音邊緣 + 指標),game 依模式詮釋
  ui.js          DOM 覆蓋層(標題/暫停/過關/失敗 + 聖經問答卡 + 大魚肚卡)+ 右上暫停/靜音鈕
  audio.js       Web Audio 即時合成音效 + 背景音樂(零音檔、可離線)
scripts/
  bundle-static.mjs  「build」= 複製到 site/(無打包器)
  serve-static.mjs   本機預覽 site/
  gen-icons.mjs      由 logo.svg 產生 PWA 圖示(需 sharp)
public/         manifest.webmanifest、手寫 sw.js、favicon、icons/
start-game.bat  一般使用者雙擊啟動(英文 + CRLF)
```

**改東西的原則:** 調手感只改 `config.js`;改經文只改 `scripture.js`;繪製只在 `renderer.js`;
輸入語意在 `game.js`(`input.js` 不懂遊戲規則)。renderer 只讀狀態不改狀態。

## 進度:已完成 vs 真正待做

**完整、對齊現況的清單見 `roadmap.md`。** 摘要:

- ✅ 第一關 約帕港口(跑酷 + 漫步;漫步含 NPC 長者聖經問答、船價門檻)、第二關 暴風雨、
  **第三關 大魚肚(默想:走 / 跳 / 蹲 + 跳起碰蠟燭禱告)**、標題聖經問答、手機橫向全螢幕、音效、PWA、
  **已部署** https://hfpc-jonah-game.netlify.app/;並**已被保羅大富翁桌遊嵌入第一/二關**。
- 🔜 待做:離線煙霧測試;第二 / 三關手感實測微調;第四關 上岸→尼尼微、第五關 尼尼微傳道、第六關 蓖麻樹;
  (可選)真實美術 PNG sprite。

## 相關 skill(`~/.claude/skills/`,**現已存在 6 個遊戲類 skill**)

> 2026-06-10 校對:下列 6 個遊戲類 skill 現已在本機(也服務保羅大富翁)。
> 但原先提到的 `bible-game-studio`、`classroom-game-deploy`、`web-launch` **仍不存在**——遇到引用它們的舊指示,請忽略或改用下列現有 skill。

- `arcade-game-kit` — 做可嵌入、零相依的即時 2D Canvas 小遊戲(本遊戲的藍圖)。
- `embed-minigame` — 把這種小遊戲嵌進 React 桌遊(已用於保羅大富翁)。
- `add-challenge-station` — 在桌遊棋盤加觸發小遊戲的挑戰站。
- `roll-and-move-game` — 大富翁 / 擲骰移動桌遊引擎(保羅大富翁本體)。
- `game-content-validator` — 遊戲內容 JSON 驗證器。
- `real-geography-board` — 用真實經緯度產生棋盤底圖(可用來做「尼尼微→地中海」真實地圖)。
