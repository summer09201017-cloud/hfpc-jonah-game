# CLAUDE.md — 約拿闖關 (Jonah Game)

給接手這個專案的 AI / 開發者讀。**先讀這頁(架構 / 地雷),狀態看 `roadmap.md`(已完成 vs 真正待做),玩法看 `README.md`。** 對齊現況(2026-06-10)。

## 這是什麼

聖經互動遊戲,主題**約拿書**,給教會主日學用(兒童到成人)。純前端、2D Canvas、無框架。
台灣教會場景,介面與經文用**繁體中文 + 和合本**;神學取向改革宗/巴刻。
GitHub: `https://github.com/summer09201017-cloud/hfpc-jonah-game`(branch `main`)。

> 相關專案:**保羅大富翁**(React+Vite 擲骰移動桌遊外框,GitHub `hfpc-paul-game`;本機路徑 `C:\Users\HFP\Downloads\0609\保羅大富翁\保羅大富翁`,**因機器而異**)。
> 兩者現在**有關聯**:保羅大富翁把本遊戲的**全六關當小遊戲嵌入**(1/2/4 純 Canvas、3/5/6 卡片流程由保羅 EmbedUI 接手),「約拿宣教之旅」棋盤路線 20 站、6 個闖關站。共用同一套 skill 生態。

## ⚓ 嵌入契約(改 `game.js` / `input.js` / `renderer.js` / `main.js` 前必讀)

保羅大富翁直接複製本專案的引擎當嵌入小遊戲。為了讓保羅那邊能**一鍵純複製同步**(`npm run sync:jonah`)、不必每次手動重套改動,本引擎已做成「**嵌入感知且向後相容**」。**加關卡 / 改手感時請守住這份契約**(否則保羅的同步腳本會報錯、或嵌入會壞掉):

1. **`ui` 由外部注入,不要 `import './ui.js'`。** `game.js` 收 `new Game(canvas, opts)`:單機由 `main.js` 傳 `{ ui: new UI() }`;嵌入由保羅傳空殼 `NullUI`。**若你在 `game.js` 重新 `import { UI } from './ui.js'`,同步腳本會中止並報「嵌入契約被破壞」**——請改回注入。
2. **`embed` 旗標**(預設 `false`,所以單機行為完全不變):`opts.embed` 為 true 時跳過標題、直接開 `opts.level`、結束呼叫 `opts.onComplete({won,score,level})`;`loop()` 受 `this.stopped` 控制;`destroy()` 會停迴圈+`input.detach()`+停音樂。
3. **HUD 進度條兩端文字走 `this.hudLabels`**:外層注入存在 `this._hudOverride`,各關 `startX()` 用 `this.hudLabels = this._hudOverride || { ...LEVELx.hud }` 的形式設定(有注入用注入的,否則用該關預設);`renderer.js` 讀 `game.hudLabels`,別寫死地名。
4. **嵌入支援全六關**(`embedLevel` 白名單 `[1..6]`,2026-06-10 起),分兩類:
   - **1/2/4(純 Canvas 關)**:宿主注入空殼 `NullUI` 即可。
   - **3/5/6(卡片流程關)**:卡片走 `ui.showFishIntro/Question/Reveal/TryAgain`、`showPreach*`、`showGourd*`,宿主必須注入**會畫卡片的 EmbedUI**——保羅的 `MiniGameModal.jsx` 用 React 卡片實作了這組方法,按鈕直接呼叫 `game.handleFishAction/handlePreachAction/handleGourdAction(act, ds)`;純 NullUI 會停在 intro 不動。完成點 `_fishWin/_preachWin/_gourdWin` 都有 `if (this.embed) return this._finish(true)`(這三關不會失敗)。
   新關卡要可嵌入:過關/失敗走有嵌入分支的結束函式,把關號加進白名單與 `boot()` 派發;若有卡片流程,同步在保羅 EmbedUI 補對應方法。

> 一句話:**單機照常用 `main.js` 注入 `new UI()`;嵌入相關的分支都用 `this.embed` 守著,預設關閉。** 改完跑 `npm run dev` 確認單機正常即可;保羅那邊跑 `npm run sync:jonah` 就會拿到最新引擎。

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

## 怎麼測試(上課前 / 改完碼跑一次)

```bash
npm test                 # 內容(問答 answer 索引、各關文案齊備)+ 全檔語法 + 狀態機/嵌入契約
npm run test:offline     # 再加:build → PWA 離線就緒(sw 預快取涵蓋整個 app shell、manifest、無外部資產)
```
- 零相依、不需瀏覽器或測試框架(這台 Node 24 友善);失敗會列出問題並 exit 1。
- **加新關 / 改狀態機 / 動 sw.js 後務必跑一次**;改 `sw.js` 的 CORE 清單時 `npm run test:offline` 會檢查是否齊備。
- 這支是跨專案 skill `game-smoke-test` 的活範例(保羅大富翁也可套,主要補它的離線就緒檢查)。
- ⚠ 它是「煙霧測試」,**不會幫你玩**:手感(跳太飄、暴風雨太難)與真實手機離線仍需人工實測。

## 架構(每個檔負責一件事)

```
index.html / styles.css   外殼 + DOM 覆蓋層(選單用 DOM,遊戲畫面用 Canvas)
src/
  main.js        進入點 + Service Worker 註冊/解除
  game.js        主迴圈 + 狀態機(title/playing/paused/win/lose/quiz/fish/preach/gourd)+ 關卡協調(L1 跑酷 / L2 暴風雨 / L3 大魚肚默想 / L4 上岸→尼尼微 跑酷(重用 L1 引擎) / L5 尼尼微傳道 對話 RPG / L6 蓖麻樹 反思結局 + 聖經問答)
  config.js      ★ 所有可調數值(速度、重力、關長、WALK、STORM、FARE 船價、FISH、NINEVEH、PREACH、GOURD…)
  scripture.js   ★ 各關經文與信息文案(LEVEL1~LEVEL6;LEVEL3/5/6 含 stations 站點;LEVEL1/4 含 hud 進度條地名)
  quiz.js        ★ 聖經問答題庫(漫步 NPC 長者 + 標題練習,約 22 題,約拿書 1–2)
  player.js      約拿:跳躍/重力/蹲下(crouching)、命中框
  spawner.js     第一關世界:障礙、空中寶物(加權隨機)、小敵人、NPC 長者(漫步問答) 的生成與移動
  storm.js       第二關「暴風雨」整關場景(平衡物理),自成一格
  renderer.js    所有繪製:背景/角色(向量先知,含跳/蹲)/HUD/第二關(_drawStorm)/第三關(_drawFish)/第四關(_bgNineveh + _ninevehGate;L1/L4 共用跑酷繪製)/第五關(_drawPreach 大城街道)/第六關(_drawGourd 五幕場景:蓖麻生長枯萎/蟲/東風)
  input.js       原始輸入提供者(鍵盤 held:左右/下蹲 + 跳/暫停/靜音邊緣 + 指標),game 依模式詮釋
  ui.js          DOM 覆蓋層(標題/暫停/過關/失敗 + 聖經問答卡 + 大魚肚卡)+ 右上暫停/靜音鈕
  audio.js       Web Audio 即時合成音效 + 背景音樂(零音檔、可離線)
scripts/
  bundle-static.mjs  「build」= 複製到 site/(無打包器)
  serve-static.mjs   本機預覽 site/
  gen-icons.mjs      由 logo.svg 產生 PWA 圖示(需 sharp)
  smoke-test.mjs     「npm test」= 內容/語法/狀態機/離線就緒 煙霧測試(零相依;見下「怎麼測試」)
public/         manifest.webmanifest、手寫 sw.js、favicon、icons/
start-game.bat  一般使用者雙擊啟動(英文 + CRLF)
```

**改東西的原則:** 調手感只改 `config.js`;改經文只改 `scripture.js`;繪製只在 `renderer.js`;
輸入語意在 `game.js`(`input.js` 不懂遊戲規則)。renderer 只讀狀態不改狀態。

## 進度:已完成 vs 真正待做

**完整、對齊現況的清單見 `roadmap.md`。** 摘要:

- ✅ **約拿書六關全數完成(全書完)**:第一關 約帕港口(跑酷 + 漫步;NPC 長者問答、船價門檻)、第二關 暴風雨、
  第三關 大魚肚(默想:走/跳/蹲 + 碰蠟燭禱告)、第四關 上岸→尼尼微(第二次機會,跑酷)、
  第五關 尼尼微傳道(對話 RPG:五位居民對話宣告、悔改披麻衣)、
  **第六關 蓖麻樹(反思結局:五幕場景動畫——棚下/蓖麻/蟲子/東風/神的心,神「安排」玩家只觀看,每幕一題反思,拿 4:1–11)**;
  標題聖經問答、手機橫向全螢幕、音效、PWA(**sw 已預快取整個 app shell,安裝後可直接離線**)、
  **自動化煙霧測試 `npm test`**、**已部署** https://hfpc-jonah-game.netlify.app/;並**已被保羅大富翁桌遊嵌入全六關**(約拿之旅 20 站、6 個闖關站)。
- 🔜 待做:各關手感實測微調;**真實手機離線實測**(自動檢查已綠,仍建議裝一台確認);
  (可選)真實美術 PNG sprite、約拿地圖改真實地理。

## 相關 skill(`~/.claude/skills/`)

- `arcade-game-kit` — 做可嵌入、零相依的即時 2D Canvas 小遊戲(本遊戲的藍圖)。
- `bible-game-studio` — 聖經遊戲系列的內容/神學/慣例知識庫(關卡對應、和合本引用、改革宗口吻)。
- `embed-minigame` — 把這種小遊戲嵌進 React 桌遊(已用於保羅大富翁)。
- `add-challenge-station` — 在桌遊棋盤加觸發小遊戲的挑戰站。
- `roll-and-move-game` — 大富翁 / 擲骰移動桌遊引擎(保羅大富翁本體)。
- `game-content-validator` — 遊戲內容 JSON 驗證器。
- `game-smoke-test` — 跨專案「上課前」煙霧測試(內容/語法/狀態機/PWA 離線就緒);本專案 `npm test` 即其活範例。
- `real-geography-board` — 用真實經緯度產生棋盤底圖(可用來做「尼尼微→地中海」真實地圖)。
- `classroom-game-deploy` — 把成品送上主日學大螢幕 / 平板 / 離線安裝。
- `packer-theology` — 巴刻《認識神》原文查找與改革宗牧養口吻(寫反思/講道用)。
