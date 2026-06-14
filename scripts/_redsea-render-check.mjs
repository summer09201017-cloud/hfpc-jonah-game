// 紅海關 headless 渲染煙霧檢查(零相依,不需瀏覽器):
// 用「假 canvas / 假 2D context」驅動「真的」RedSea 場景 + Renderer._drawRedSea,
// 走過 stand / 太早衝 / cross(含跳礁石、絆到)/ closing / win / lose 各狀態,
// 確認繪製與 step 在每個階段都「不丟錯」——抓 node --check 抓不到的執行期錯誤
// (呼叫到不存在的 helper、ctx 用法錯誤等)。這台機器沒裝 Playwright,用這支替代截圖驗收。
import { Renderer } from '../src/renderer.js'
import { RedSea } from '../src/redsea.js'
import { Player } from '../src/player.js'
import { Input } from '../src/input.js'
import { REDSEA, PLAYER, GROUND_Y } from '../src/config.js'

const DT = 1 / 60
let drawErrors = 0, draws = 0

// 假 2D context:任何方法都 no-op;漸層/量測回傳合理 stub。
const ctx = new Proxy({}, {
  get(target, prop) {
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
      return () => ({ addColorStop() {} })
    if (prop === 'measureText') return () => ({ width: 50 })
    if (prop in target) return target[prop]
    return () => {}
  },
  set(target, prop, v) { target[prop] = v; return true },
})
const canvas = {
  getContext: () => ctx,
  style: {},
  parentElement: { clientWidth: 960, clientHeight: 540 },
  getBoundingClientRect: () => ({ width: 960, height: 540, left: 0, top: 0 }),
  addEventListener() {}, removeEventListener() {},
}

const renderer = new Renderer(canvas)
let won = null
const game = {
  level: 8,
  player: new Player(),
  input: new Input(),
  hudLabels: { start: '紅海西岸', goal: '紅海東岸 🌊' },
  win() { won = true },
  gameOver() { won = false },
}
game.redsea = new RedSea(game)

function draw() {
  draws++
  try { renderer.draw(game) } catch (e) { drawErrors++; console.log('  ✗ draw 丟錯:', e.message) }
}

// behavior: 'never' | 'reactive' ;earlyPokes=true 代表在 stand 階段亂按(測太早衝)
function play(behavior, earlyPokes) {
  won = null
  game.redsea.reset()
  let earlyAdvance = false
  for (let f = 0; f < 60 * 80 && won === null; f++) {
    const r = game.redsea
    if (r.phase === 'stand') {
      if (earlyPokes && r.standT < REDSEA.standTime) game.input.jumpQueued = true
      if (r.standT >= REDSEA.standTime) game.input.jumpQueued = true // 海全開 → 起步
    } else if (r.phase === 'cross' && behavior === 'reactive') {
      let nearest = Infinity
      for (const h of r.hazards) if (!h.resolved) nearest = Math.min(nearest, h.x - r.dist)
      if (game.player.onGround && nearest >= 40 && nearest <= 150) game.input.jumpQueued = true
    }
    game.redsea.step(DT)
    if (r.phase === 'stand' && r.dist > 0) earlyAdvance = true
    if (f % 8 === 0) draw() // 每 8 幀畫一次,涵蓋各階段
  }
  draw() // 結束畫面也畫一張
  return { won, earlyAdvance }
}

console.log('紅海關 headless 渲染煙霧檢查')
const a = play('reactive', false)
console.log(`  ${a.won === true ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} 反應式玩家:過關(won=${a.won})`)
const b = play('never', false)
console.log(`  ${b.won === false ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} 都不跳:失敗(won=${b.won})`)
const c = play('reactive', true)
console.log(`  ${c.earlyAdvance === false ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} 太早衝:站住階段不前進(earlyAdvance=${c.earlyAdvance})`)
console.log(`  ${drawErrors === 0 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} 繪製 ${draws} 幀,${drawErrors} 個執行期錯誤`)

const fail = !(a.won === true && b.won === false && c.earlyAdvance === false && drawErrors === 0)
console.log(fail ? '\n\x1b[31m有問題\x1b[0m' : '\n\x1b[32m紅海關渲染 + 規則 全部通過 ✓\x1b[0m')
process.exit(fail ? 1 : 0)
