import { VIEW, GROUND_Y } from './config.js'

// 生成障礙與空中寶物,並讓它們隨世界往左移動。
// 障礙間距會依當前速度動態調整,保證一定跳得過去(公平性)。

const OBSTACLES = ['📦', '🛢️', '🪵', '🧺', '🪜']

// 小敵人(馬力歐式):從右邊爬過來,可跳過或踩扁。crawl=自身向左爬行速度。
const ENEMIES = [
  { emoji: '🐍', w: 38, h: 26, size: 38, crawl: 75 }, // 蛇
  { emoji: '🦀', w: 34, h: 28, size: 34, crawl: 60 }, // 螃蟹
  { emoji: '🐀', w: 34, h: 26, size: 34, crawl: 95 }, // 老鼠
]

// 空中寶物:跳起來收集。
//   value = 分數;kind 'points'=加分 / 'life'=補一條命;weight = 相對出現機率(越大越常見)。
const TREASURES = [
  { emoji: '🪙', kind: 'points', value: 1, weight: 50, r: 16, size: 30 }, // 船價(最常見)
  { emoji: '🏺', kind: 'points', value: 3, weight: 22, r: 17, size: 32 }, // 陶罐
  { emoji: '📜', kind: 'points', value: 5, weight: 14, r: 17, size: 30 }, // 經卷
  { emoji: '🕊️', kind: 'points', value: 10, weight: 8, r: 17, size: 32 }, // 鴿子(約拿之名)
  { emoji: '❤️', kind: 'life', value: 0, weight: 6, r: 16, size: 30 }, // 補一條命
]
const TREASURE_WEIGHT = TREASURES.reduce((s, t) => s + t.weight, 0)

function rand(a, b) {
  return a + Math.random() * (b - a)
}

// 依 weight 加權隨機挑一種寶物
function pickTreasure() {
  let r = Math.random() * TREASURE_WEIGHT
  for (const t of TREASURES) {
    if (r < t.weight) return t
    r -= t.weight
  }
  return TREASURES[0]
}

export class Spawner {
  constructor() {
    this.reset()
  }

  reset() {
    this.obstacles = []
    this.treasures = []
    this.enemies = []
    this.distSinceObstacle = 0
    this.nextObstacleGap = 520
    this.distSinceTreasure = 0
    this.nextTreasureGap = 820
    this.distSinceEnemy = 0
    this.nextEnemyGap = 1400
  }

  update(dt, speed, distanceTraveled, goalDistance, enemiesOn = false) {
    const dx = speed * dt

    // 接近終點時不再生成障礙,留一段乾淨跑道讓約拿跑向船
    const spawning = distanceTraveled < goalDistance - 1000

    // ---- 障礙 ----
    this.distSinceObstacle += dx
    if (spawning && this.distSinceObstacle >= this.nextObstacleGap) {
      this.distSinceObstacle = 0
      // 依速度決定最小安全間距(速度越快,間距越大)
      const minGap = speed * 0.95 + 230
      this.nextObstacleGap = rand(minGap, minGap + 300)
      const w = rand(34, 48)
      const h = rand(34, 52)
      this.obstacles.push({
        x: VIEW.W + 60,
        w,
        h,
        emoji: OBSTACLES[Math.floor(rand(0, OBSTACLES.length))],
        size: Math.max(w, h) + 10,
      })
    }

    // ---- 空中寶物 ----
    this.distSinceTreasure += dx
    if (spawning && this.distSinceTreasure >= this.nextTreasureGap) {
      this.distSinceTreasure = 0
      this.nextTreasureGap = rand(700, 1300)
      const t = pickTreasure()
      this.treasures.push({
        x: VIEW.W + 60,
        y: GROUND_Y - rand(55, 135), // 跳起來才撿得到的高度
        r: t.r,
        size: t.size,
        emoji: t.emoji,
        kind: t.kind,
        value: t.value,
        taken: false,
      })
    }

    // ---- 小敵人(目前只在漫步模式)----
    if (enemiesOn) {
      this.distSinceEnemy += dx
      if (spawning && this.distSinceEnemy >= this.nextEnemyGap) {
        this.distSinceEnemy = 0
        this.nextEnemyGap = rand(1200, 2200)
        const e = ENEMIES[Math.floor(rand(0, ENEMIES.length))]
        this.enemies.push({
          x: VIEW.W + 60,
          w: e.w,
          h: e.h,
          size: e.size,
          emoji: e.emoji,
          crawl: e.crawl,
          dead: false,
        })
      }
    }

    // ---- 移動 + 移除出界 ----
    for (const o of this.obstacles) o.x -= dx
    for (const c of this.treasures) c.x -= dx
    // 敵人:除了世界捲動,還會自己向左爬(站著不動牠也會靠近)
    for (const e of this.enemies) e.x -= dx + e.crawl * dt
    this.obstacles = this.obstacles.filter((o) => o.x > -80)
    this.treasures = this.treasures.filter((c) => c.x > -80 && !c.taken)
    this.enemies = this.enemies.filter((e) => e.x > -80 && !e.dead)
  }
}
