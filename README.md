# 約拿闖關 (Jonah Game) — MVP

聖經互動遊戲。第一個可玩切片:**第一關 · 約帕港口**(約拿書 1:1–3)。

## 怎麼執行

```bash
npm install      # 第一次才需要
npm run dev      # 啟動,瀏覽器開 http://localhost:5173/
```

打包正式版:`npm run build`(輸出在 `dist/`)。

## 怎麼玩

- **空白鍵 / ↑ / W / 點擊畫面** = 跳躍
- 躲開障礙(📦🛢️🪵)、撿起船價(🪙)、跑到右邊的船 ⛵ = 過關
- 撞到障礙扣一顆心 ❤️,三顆扣完就要重來

## 程式結構

```
index.html / styles.css   外殼與樣式
src/
  main.js        進入點
  game.js        遊戲主迴圈 + 狀態機(標題/進行/過關/失敗)
  player.js      約拿(跳躍與重力)
  spawner.js     障礙與船價的生成
  renderer.js    所有畫面繪製(Canvas,emoji 當圖示)
  input.js       鍵盤 / 觸控輸入
  ui.js          標題/過關/失敗的覆蓋畫面
  config.js      ★ 所有可調數值(速度、重力、關卡長度…)
  scripture.js   ★ 經文與信息文案
```

> 調手感改 `config.js`,改經文/信息改 `scripture.js`,不必動遊戲邏輯。

## 路線圖

- [x] v0.1 第一關 約帕港口(跑酷)
- [ ] v0.2 音效(Howler.js)+ 手感打磨
- [ ] v0.3 第二關 暴風雨(平衡 + QTE)
- [ ] …約拿書其餘關卡
- [ ] v1.0 之後:多人「大富翁外框」把各關當小遊戲串起來
