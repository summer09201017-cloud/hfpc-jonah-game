import { BALAAM as C } from '../src/config.js'
const DT = 1 / 60
function playOne() {
  let time = 0, progress = 0, donkeyY = 0.5
  let angels = [], spawnTimer = 1.0, bumpCool = 0, lives = C.lives ?? 3, bumps = 0
  for (let f = 0; f < Math.ceil(C.duration / DT) + 10; f++) {
    time += DT
    const threats = angels.filter((a) => a.x > C.donkeyX - C.hitBandX && a.x - C.donkeyX < 0.5).map((a) => a.y)
    let desiredY = donkeyY
    if (threats.length) {
      let best = -1
      for (let i = 0; i <= 24; i++) {
        const cand = C.roadTop + (C.roadBot - C.roadTop) * (i / 24)
        let nearest = Infinity
        for (const ty of threats) nearest = Math.min(nearest, Math.abs(cand - ty))
        if (nearest > best) { best = nearest; desiredY = cand }
      }
    }
    const step = C.donkeySpeed * DT
    if (donkeyY < desiredY) donkeyY = Math.min(desiredY, donkeyY + step)
    else if (donkeyY > desiredY) donkeyY = Math.max(desiredY, donkeyY - step)
    donkeyY = Math.max(C.roadTop, Math.min(C.roadBot, donkeyY))
    spawnTimer -= DT
    if (spawnTimer <= 0) {
      const interval = Math.max(0.5, C.spawnInterval - C.spawnRampPerSec * time)
      spawnTimer = interval * (0.7 + Math.random() * 0.6)
      const y = C.roadTop + Math.random() * (C.roadBot - C.roadTop)
      const sp = C.angelSpeedMin + Math.random() * (C.angelSpeedMax - C.angelSpeedMin)
      angels.push({ x: 1.08, y, sp, spent: false })
    }
    bumpCool = Math.max(0, bumpCool - DT)
    let balking = false
    for (const a of angels) {
      a.x -= a.sp * DT
      if (Math.abs(a.x - C.donkeyX) < C.hitBandX && Math.abs(a.y - donkeyY) < C.hitBandY) {
        balking = true
        if (bumpCool <= 0 && !a.spent) {
          a.spent = true; bumpCool = C.bumpCooldown; bumps++; lives -= 1
          if (lives <= 0) return { win: false, time, lives, bumps }
        }
      }
    }
    angels = angels.filter((a) => a.x > -0.12)
    if (balking) progress = Math.max(0, progress - C.backOnBump * DT)
    else progress = Math.min(1, progress + C.advanceSpeed * DT)
    if (progress >= 1) return { win: true, time, lives, bumps }
    if (time >= C.duration) return { win: false, time, lives, bumps, timeout: true }
  }
  return { win: false, time, lives, bumps, timeout: true }
}
const N = 300
let wins = 0, livesSum = 0, timeSum = 0, bumpsSum = 0
for (let i = 0; i < N; i++) { const r = playOne(); if (r.win) { wins++; timeSum += r.time }; livesSum += r.lives; bumpsSum += r.bumps }
console.log(`命${C.lives} 路寬${(C.roadBot - C.roadTop).toFixed(2)} 間隔${C.spawnInterval} 速度${C.angelSpeedMin}-${C.angelSpeedMax}`)
console.log(`通關率 ${(wins / N * 100).toFixed(0)}%  平均剩命 ${(livesSum / N).toFixed(2)}/${C.lives}  平均被擋 ${(bumpsSum / N).toFixed(1)}`)
console.log(wins / N < 0.55 ? '⚠ 偏難(對小孩可能必敗)' : '✅ 難但可過')
