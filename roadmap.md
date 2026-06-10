# roadmap.md — 約拿闖關 (Jonah Game)

> 對齊現況 **2026-06-10**。給接手的 AI / 開發者:先讀本檔的「已完成 vs 真正待做」,再讀 `CLAUDE.md`(架構與地雷)。
> 線上版:**https://hfpc-jonah-game.netlify.app/** ・ GitHub:`summer09201017-cloud/hfpc-jonah-game`(branch `main`)。

---

## ✅ 已完成

### 第一關 · 約帕港口(橫向跑酷,兩種模式)
- 🏃 **闖關**:自動向前+加速,障礙扣命(3 心),受擊無敵閃爍。
- 🚶 **漫步**:自由前進/後退、無時間壓力;障礙無害;小敵人可踩扁加分。
- **NPC 長者聖經問答(漫步限定)**:走近 🧓 觸發單題;**答對才能過、答錯退 5 步換一題、同一位連錯 3 次仁慈放行**;**答對過的題目不再出現**;題庫 **22 題**(約拿書 1–2 章,和合本+改革宗口吻,在 `quiz.js`)。
- **船價門檻**:要收集足夠「船價 🪙」才能上船 —— **闖關 15 / 漫步 20**(`config.js` 的 `FARE`)。闖關到船邊不足時會**停下、切成可自由移動回頭收集**(不必重跑)。
- 標題另有 **📖 聖經問答** 練習(隨機 5 題 + 結算)。

### 第二關 · 暴風雨(平衡穩船,`storm.js`)
- 操作方向已改直覺(按哪邊船往哪邊;`STORM.invertControl` 可對調)、加**動態大箭頭**指出該按哪邊、危險時轉紅。
- 難度用模擬校準:小孩過關率 5% → 91%(`config.js` 的 `STORM`)。

### 第三關 · 大魚肚內(默想關,`game.js` 的 fish 流程 + `renderer.js` 的 `_drawFish`)
- 黑暗魚腹中**往前走(→)+ 跳(↑/空白/輕點)+ 蹲(↓/畫面左側)**;**跳起來碰到懸空的禱告蠟燭**才開始那一段禱告;途中**蹲下鑽過懸吊的骨頭**。
- 約拿書第 2 章禱告分 **5 段**:答對才點亮一盞「禱告之光」並前進;集滿 → 大魚把約拿吐在旱地(2:10)過關。
- 內容(禱告詞+反思題)在 `scripture.js` 的 `LEVEL3.stations`;可調數值在 `config.js` 的 `FISH`。

### 第四關 · 上岸往尼尼微(神給的第二次機會,`game.js` 的 `startNineveh`)
- **重用第一關跑酷引擎**(同一套 RUN 物理 / 障礙 / 寶物 / 向量先知),只換主題與規則:
  暖色晨光天空 + 遠方沙丘 + 沙地土路(`renderer.js` 的 `_bgNineveh`)、終點是**尼尼微大城門**(`_ninevehGate`)。
- **無船價門檻**:往尼尼微是順服不是買船票,走到城門即過關(`fareEnabled=false`);這關漫步不出 NPC 長者(題庫是 1–2 章)。
- 串接:大魚肚(L3)過關 → 「下一關 · 上岸往尼尼微」;經文/文案在 `scripture.js` 的 `LEVEL4`(拿 2:10–3:3),可調長度在 `config.js` 的 `NINEVEH.goalDistance`。

### 第五關 · 尼尼微傳道(對話 RPG,`game.js` 的 `startPreach`)
- **在大城街道往前走(重用走路手感),走到居民面前停下「對話」**:居民先說話(RPG 台詞),玩家向他宣告神的話(選擇題);**答對 = 那人悔改 🙇(披麻衣)**,再往前走。
- 五位居民:城門守衛 💂、市場商人 🧔、抱孩子的母親 👩‍👧、**尼尼微王 🤴(下寶座、披麻衣、坐灰中)**、坐在灰中禱告的百姓 🙏;全部悔改 = 過關(3:10 神不降災)。答錯不懲罰(同第三關,默想/教導取向)。
- 畫面:白日大城(兩層泥磚城屋顯出「極大的城」拿 3:3)+ 石板街道;頂端 🙇/👤 顯示悔改進度(`renderer._drawPreach`)。
- 內容(台詞+問題+經文)在 `scripture.js` 的 `LEVEL5.stations`;可調數值在 `config.js` 的 `PREACH`(步速 / 每位居民間距)。
- 串接:第四關進了城門 →「下一關 · 尼尼微傳道」;標題也有直達鈕。**這關是 DOM 選單流程,不嵌入保羅大富翁**(嵌入仍夾在第一/二關)。

### 其他
- **自動化煙霧測試**:`npm test`(問答 answer 索引、各關文案齊備、全檔語法、狀態機/嵌入契約)、`npm run test:offline`(再加 build + PWA 離線就緒)。零相依,見 `scripts/smoke-test.mjs` / skill `game-smoke-test`。
- **手機橫向全螢幕**:直向蓋「請轉橫向」提示;觸控裝置點開始時請求全螢幕+鎖橫向(Android);iOS 走「加入主畫面」standalone。
- 音效 + 背景音樂(`audio.js`,Web Audio 合成,零音檔)、🔊/⏸ 鈕。
- **PWA**(manifest + 手寫 network-first `sw.js`,可安裝/離線)、`start-game.bat` 啟動器。
- **已部署** Netlify(連 GitHub 自動部署):https://hfpc-jonah-game.netlify.app/(已修正 .webmanifest MIME、sw.js no-cache)。
- **已被「保羅大富翁」桌遊嵌入當小遊戲**(第一關跑酷、第二關暴風雨)——見下方。
- **PWA 已預快取整個 app shell**(`sw.js` 的 `CORE` 含 HTML/CSS/全部 ES 模組/圖示),安裝後可直接離線,不必先線上跑一輪。

---

## 🔜 真正待做(依優先)

1. **真實手機離線實測**:`npm run test:offline` 已自動驗證「build 可離線執行 + sw 預快取齊備」(目前全綠);但仍建議**裝一台手機 → 關 Wi-Fi/行動網路 → 確認第一~五關都能玩**(自動檢查證明「能離線載入」,不證明每關手感都對)。
2. **實機微調**:第二關難度(`STORM`)、第三關手感(`FISH.segment` / `FISH.candleY` / `FISH.boneAt`)、第四關長度(`NINEVEH.goalDistance`)、第五關步調(`PREACH.segment` / `PREACH.walkSpeed`)。
3. **第六關 蓖麻樹**(反思 + 結局;小敵人可用神所安排的蟲 拿 4:7)——做完即全書六關完結。
4. (可選)用**真實美術**(PNG sprite sheet,**不要 GIF**)替換 emoji/向量。
5. (可選)把**第三關大魚肚平台關做成「真嵌入小遊戲」**——目前它在桌遊裡是用棋盤原生問答站呈現(因為禱告問答是 DOM 選單流程,塞進嵌入模式 NullUI 會卡住)。要真嵌入需讓 React 彈窗接手禱告卡。

---

## 🔗 與「保羅大富翁」的關係(大富翁外框)
「把各關用大富翁外框串起來」**已經在 `保羅大富翁` 專案實現**(那是可重用的 roll-and-move 桌遊框架):
- 它的 `src/minigames/jonah/` 是**本遊戲引擎的嵌入版 fork**(第一/二關)。本專案更新後要手動重新同步那份 copy(見 `保羅大富翁/CLAUDE.md` 的「Embedded mini-games」)。
- 已在那邊新增一條 **「約拿宣教之旅」** 路線(他施↔尼尼微,15 站),把第一/二關當挑戰站、大魚肚禱告當棋盤問答。
- 詳見 `保羅大富翁/roadmap.md`。

## 相關 skill(`~/.claude/skills/`,**現已存在**)
`arcade-game-kit`(即時 2D 引擎藍圖)、`bible-game-studio`(內容/神學慣例)、`embed-minigame`(把小遊戲嵌進 React 桌遊)、`add-challenge-station`(棋盤加挑戰站)、`roll-and-move-game`(大富翁引擎)、`game-content-validator`(內容驗證)、`game-smoke-test`(上課前煙霧測試,本專案 `npm test`)、`real-geography-board`(真實經緯度底圖)。
