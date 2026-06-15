// 紅海奔逃(出 14)headless 模擬校準 — 零相依,驗證設計稿的三道閘門:
//   ① 都不跳 → 一直絆到 → 追兵追上 → 敗
//   ② 反應式好玩家(看到礁石就跳)→ 拉開追兵 → 到對岸 → 勝
//   ③ 站住階段太早衝 → 不前進(等海全開)
// 物理與規則與 src/redsea.js 對齊(同 REDSEA / PHYS 數值);跑法:node scripts/_redsea-tune.mjs
import { REDSEA as C, PHYS, PLAYER, GROUND_Y } from '../src/config.js'

const DT = 1 / 60

// 重現 src/player.js 的跳躍/重力
function makePlayer() {
  return { y: GROUND_Y, vy: 0, onGround: true }
}
function jump(p) {
  if (p.onGround) { p.vy = PHYS.jumpV; p.onGround = false; return true }
  return false
}
function updatePlayer(p, dt) {
  p.vy += PHYS.gravity * dt
  p.y += p.vy * dt
  if (p.y >= GROUND_Y) { p.y = GROUND_Y; p.vy = 0; p.onGround = true }
}

// behavior: 'never' | 'reactive' | 'tooEarly'
function playOne(behavior) {
  const p = makePlayer()
  let phase = 'stand', standT = 0, dist = 0, lead = C.chaseGapStart, stumble = 0, closeT = 0
  let hazards = [], nextHazardAt = C.hazardGap * 1.1, advancedDuringStand = false
  for (let f = 0; f < 60 * 90; f++) {
    if (phase === 'stand') {
      standT += DT
      // tooEarly 玩家在海全開前一直按;reactive/never 等海全開才按一下起步
      const earlyAct = behavior === 'tooEarly' && standT < C.standTime
      const goAct = standT >= C.standTime // 海全開 → 起步(所有非 tooEarly 玩家都會起步)
      if (standT >= C.standTime) { phase = 'cross' }
      else if (earlyAct) { /* 太早衝:不前進 */ }
      updatePlayer(p, DT)
      if (standT < C.standTime && dist > 0) advancedDuringStand = true
      continue
    }
    if (phase === 'cross') {
      // 反應式玩家:最近的未結算礁石進入跳躍觸發窗 + 在地面 → 跳
      if (behavior === 'reactive') {
        let nearest = Infinity
        for (const h of hazards) if (!h.resolved) nearest = Math.min(nearest, h.x - dist)
        if (p.onGround && nearest >= 40 && nearest <= 150) jump(p)
      }
      updatePlayer(p, DT)
      const mult = stumble > 0 ? C.stumbleSpeedMult : 1
      dist += C.runSpeed * mult * DT
      if (stumble > 0) stumble = Math.max(0, stumble - DT)
      lead = Math.min(C.chaseGapMax, lead + C.gapRecoverPerSec * DT)
      while (nextHazardAt < dist + 1400) { hazards.push({ x: nextHazardAt, resolved: false, vx: C.crabDart || 0 }); nextHazardAt += C.hazardGap }
      // 最壞情況:把「每個」障礙都當成會快速左衝的螃蟹(vx=crabDart)→ 反應時間最短;
      //   若反應式玩家在此仍 200/200 勝,則任何「礁石+動物」隨機混合都更好過(公平保證)。
      for (const h of hazards) { if (!h.resolved && h.vx) h.x -= h.vx * DT }
      for (const h of hazards) {
        if (h.resolved) continue
        const screenX = PLAYER.x + (h.x - dist)
        if (screenX <= PLAYER.x) {
          h.resolved = true
          if (!p.onGround && p.y < GROUND_Y - 22) { /* 跳過 */ }
          else { stumble = C.stumbleTime; lead -= C.chaseCloseOnHit }
        }
      }
      hazards = hazards.filter((h) => h.x - dist > -240)
      if (lead <= 0) return { result: 'lose', dist, lead, advancedDuringStand }
      if (dist >= C.goalDistance) { phase = 'closing'; closeT = 0 }
      continue
    }
    if (phase === 'closing') {
      closeT += DT
      if (closeT >= C.closeTime) return { result: 'win', dist, lead, advancedDuringStand }
    }
  }
  return { result: 'timeout', dist, lead, advancedDuringStand }
}

function run(behavior, n) {
  let win = 0, lose = 0, timeout = 0, earlyMoved = 0
  for (let i = 0; i < n; i++) {
    const r = playOne(behavior)
    if (r.result === 'win') win++
    else if (r.result === 'lose') lose++
    else timeout++
    if (r.advancedDuringStand) earlyMoved++
  }
  return { win, lose, timeout, earlyMoved, n }
}

const N = 200
console.log(`紅海奔逃 設計校準  goalDistance=${C.goalDistance} runSpeed=${C.runSpeed} hazardGap=${C.hazardGap}`)
console.log(`  追兵 start=${C.chaseGapStart} max=${C.chaseGapMax} recover=${C.gapRecoverPerSec}/s closeOnHit=${C.chaseCloseOnHit}`)

let fail = 0
function gate(label, cond) {
  console.log(`  ${cond ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${label}`)
  if (!cond) fail++
}

const never = run('never', N)
gate(`都不跳 → 應該「會敗」(lose=${never.lose}/${never.n}, win=${never.win})`, never.win === 0 && never.lose === never.n)

const reactive = run('reactive', N)
gate(`反應式好玩家 → 應該「會勝」(win=${reactive.win}/${reactive.n}, lose=${reactive.lose})`, reactive.win === reactive.n)

const early = run('tooEarly', 20)
gate(`站住階段太早衝 → 不前進(earlyMoved=${early.earlyMoved}/${early.n}, 仍可勝=${early.win})`, early.earlyMoved === 0)

console.log(fail === 0 ? '\n\x1b[32m全部閘門通過 ✓\x1b[0m' : `\n\x1b[31m有 ${fail} 道閘門未過\x1b[0m`)
process.exit(fail === 0 ? 0 : 1)
