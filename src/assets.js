// 真實美術 sprite 載入器(Kenney CC0,見 public/assets/sprites/LICENSE-kenney-cc0.txt)。
// 設計成「漸進增強」:renderer 畫 emoji 前先問這裡有沒有對應的真圖,
// 有且已載入就用 drawImage,否則照舊畫 emoji——圖載入中、404(例如被保羅大富翁
// 嵌入但宿主沒放 /assets/sprites/)都會自動退回 emoji,單機與嵌入行為不會壞。
// 想再換一張圖:只要改這份對照表,不用動 renderer / spawner。

// 牧師審美定案(2026-06-12):只留老鼠與木箱——其餘(金幣/愛心/圓木/岩石/仙人掌)
// emoji 本來就比較好看,已退回。要再試新圖:放 PNG 進 public/assets/sprites/ 後加一行。
const FILES = {
  '📦': 'crate.png', // 港口木箱(障礙)
  '🐀': 'mouse.png', // 港口老鼠(漫步小敵人)
}

const cache = new Map()
for (const [emoji, file] of Object.entries(FILES)) {
  const img = new Image()
  img.src = `/assets/sprites/${file}`
  cache.set(emoji, img)
}

// 回傳已載入完成的圖,否則 null(讓呼叫端退回 emoji)
export function sprite(emoji) {
  const img = cache.get(emoji)
  return img && img.complete && img.naturalWidth > 0 ? img : null
}
