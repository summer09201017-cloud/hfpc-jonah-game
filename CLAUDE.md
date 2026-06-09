# CLAUDE.md — 約拿闖關 (Jonah Game)

給接手這個專案的 AI / 開發者讀。**先讀這頁再動手。** 本檔對齊現況(2026-06-08)。

## 這是什麼

聖經互動遊戲,主題**約拿書**,給教會主日學用(兒童到成人)。純前端、2D Canvas、無框架。
台灣教會場景,介面與經文用**繁體中文 + 和合本**;神學取向改革宗/巴刻。
GitHub: `https://github.com/summer09201017-cloud/hfpc-jonah-game`(branch `main`)。

> 相關但**獨立**的另一個專案:`C:\Users\agape250\Desktop\保羅大富翁`(保羅大富翁,React+Vite 擲骰桌遊)。
> 兩者共用同一套 skill 生態,但程式碼互不相干。

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
  game.js        主迴圈 + 狀態機(title/playing/paused/win/lose)+ 關卡協調(level 1 跑酷 / level 2 暴風雨)
  config.js      ★ 所有可調數值(速度、重力、關長、WALK、STORM…)
  scripture.js   ★ 各關經文與信息文案(LEVEL1、LEVEL2)
  player.js      約拿:跳躍與重力、命中框(jump() 回傳是否真的跳了)
  spawner.js     第一關世界:障礙、空中寶物(加權隨機)、小敵人 的生成與移動
  storm.js       第二關「暴風雨」整關場景(平衡物理),自成一格不動到第一關
  renderer.js    所有繪製:背景/角色(向量先知)/HUD/第二關畫面(_drawStorm)
  input.js       原始輸入提供者(鍵盤 held + 跳/暫停/靜音邊緣 + 指標位置/輕點),game 依模式詮釋
  ui.js          DOM 覆蓋層(標題/暫停/過關/失敗)+ 右上暫停/靜音鈕
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

## 目前已完成(對齊現況)

- **第一關 約帕港口**(拿 1:1–3,橫向跑酷),兩種模式:
  - 🏃 **闖關**:自動向前+加速,障礙扣命(3 條心),撞到有無敵閃爍。
  - 🚶 **漫步**:玩家自控,**可前進(→/右半)也可後退(←/左半)**,無時間壓力;障礙無害;
    小敵人 🐍🦀🐀 可**踩扁加分**,側面撞到**往後退 3 步**(不扣命);跳躍用「輕點」。
  - 空中寶物加權隨機:🪙1 / 🏺3 / 📜5 / 🕊️10 分 + ❤️ 補命(🕊️ 彩蛋=約拿之意「鴿子」)。
  - 約拿是**向量繪製的先知**:白袍+頭巾+鬍子+**手杖**,面向右;後退面向左;有跳躍姿勢、站立姿勢。
  - 背景=**古代近東港城**(平頂、女兒牆、少窗、拱門、偶爾圓頂)。
- **第二關 暴風雨**(拿 1:4–16,`storm.js`):船像平衡桿搖晃,**←/→(或左右半邊)扶正**,
  撐過 `STORM.duration` 秒過關、翻船值滿失敗;下雨/閃電+雷聲/帆船搖晃。
  進入方式:標題「🌊 第二關」鈕,或第一關過關的「下一關」鈕。
- **音效 + 背景音樂**(`audio.js`,Web Audio):跳/撿寶/踩敵/受擊/過關/失敗/雷聲 + 循環旋律;
  🔊 靜音鈕(右上)/ M 鍵,設定存 localStorage;暫停鈕(右上,P/Esc);第二關不放旋律。
- **PWA**:manifest + 手寫 network-first `sw.js`,可安裝/離線;PC localhost 可測安裝。
- **啟動器** `start-game.bat`(自動找空埠 + 開瀏覽器)。
- **git + GitHub** 已建並 push;`site/` 可建置。

## 真正待做(依優先)

1. ✅ **已部署**到 https://hfpc-jonah-game.netlify.app/(連 GitHub 自動部署)。剩**離線煙霧測試**
   (手機安裝→關 Wi-Fi→確認能玩)待做。
2. **第二關難度微調**(等實測):`config.js` 的 `STORM`(`duration`/`push`/`windGrow`)。
3. **第三關 大魚肚內**(拿 1:17–2:10):解謎 + 禱告(可放聖經問答;用 `bible-game-studio` 的問答規範)。
4. 第四關 上岸→尼尼微(跑酷)、第五關 尼尼微傳道(策略+對話)、第六關 蓖麻樹(反思+結局,
   小敵人可用神所安排的**蟲 拿 4:7**)。
5. (可選)用**真實美術**(PNG sprite sheet,**不要 GIF**)替換 emoji/向量。
6. (遠期)多人「大富翁 / Mario-Party 外框」把各關當小遊戲串起來(用 `roll-and-move-game` skill)。

## 相關 skill(放在 `~/.claude/skills/`)

> ⚠️ **2026-06-09 校對:下列遊戲類 skill 目前都不在這台機器的 `~/.claude/skills/`。**
> 本機實際只有 `save-tokens`、`gsheet-write`、`send-email` 三個通用 skill。
> 也就是說以下提到「用 web-launch 啟動 / 用 bible-game-studio 問答規範 / 用 roll-and-move-game」的指示,
> 在這台機器上**暫時無法照做**——需要先把對應 skill 複製/建立到 `~/.claude/skills/` 才能用。
> (同理,本檔開頭提到保羅大富翁在 `C:\Users\agape250\...`,但本機使用者目錄是 `C:\Users\HFP\`;機器/路徑描述可能是在別台寫的,請以實機為準。)

- `arcade-game-kit` — 本遊戲的即時 2D 引擎藍圖(架構/迴圈/輸入/PWA/Node24 地雷)。
- `bible-game-studio` — 聖經遊戲系列規範(關卡對應、先知美術、經文/問答、改革宗口吻)。
- `classroom-game-deploy` — 投影/平板/離線打包上線。
- `web-launch` — 一鍵啟動 dev + 開瀏覽器(自動找空埠)。
- `roll-and-move-game`、`game-content-validator` — 桌遊引擎 / 內容驗證(主要服務保羅大富翁)。
