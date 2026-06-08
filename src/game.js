import { VIEW, GROUND_Y, RUN, WALK, PLAYER, LIVES, INVULN_TIME } from './config.js'
import { Player } from './player.js'
import { Spawner } from './spawner.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'
import { UI } from './ui.js'
import { Audio } from './audio.js'
import { Storm } from './storm.js'
import { LEVEL1, LEVEL2 } from './scripture.js'

const STATE = { TITLE: 'title', PLAYING: 'playing', PAUSED: 'paused', WIN: 'win', LOSE: 'lose' }
const STEP = 1 / 60 // 固定時間步長,讓物理在任何更新率下都一致

export class Game {
  constructor(canvas) {
    this.canvas = canvas
    this.renderer = new Renderer(canvas)
    this.input = new Input()
    this.ui = new UI()
    this.player = new Player()
    this.spawner = new Spawner()
    this.storm = new Storm(this)
    this.state = STATE.TITLE
    this.level = 1 // 1=約帕港口(跑酷) / 2=暴風雨(平衡)
    this.mode = 'run' // 'run'=闖關(自動跑) / 'walk'=漫步(自由走、無壓力)
    this.last = 0
    this.acc = 0
    this._resetRun()
  }

  boot() {
    this.input.attach(this.canvas)
    this.renderer.resize()
    window.addEventListener('resize', () => this.renderer.resize())

    this.ui.onStart((mode) => this.start(mode))
    this.ui.onStorm(() => this.startStorm()) // 標題上直接挑第二關
    this.ui.onRestart(() => this.restartCurrent()) // 重玩目前這一關
    this.ui.onNext(() => this.next()) // 進入下一關
    this.ui.onPause(() => this.pause())
    this.ui.onResume(() => this.resume())
    this.ui.onMute(() => this.toggleMute())
    this.ui.setMuteIcon(Audio.muted)
    this.ui.showTitle(LEVEL1)

    requestAnimationFrame((t) => this.loop(t))
  }

  _resetRun() {
    this.player.reset()
    this.player.lives = LIVES
    this.spawner.reset()
    this.distance = 0
    this.speed = RUN.startSpeed
    this.coinsCollected = 0
    this.knockbackLeft = 0 // 漫步模式被敵人撞到後,還要往後退的距離
  }

  start(mode) {
    this.level = 1
    this.mode = mode === 'walk' ? 'walk' : 'run'
    this._resetRun()
    this.ui.hide()
    this.state = STATE.PLAYING
    this.ui.showPauseButton()
    Audio.unlock() // 在使用者手勢(按開始)中解鎖音訊
    Audio.startMusic()
  }

  startStorm() {
    this.level = 2
    this.storm.reset()
    this.ui.hide()
    this.state = STATE.PLAYING
    this.ui.showPauseButton()
    Audio.unlock() // 解鎖音訊(雷聲);暴風雨不放輕快旋律
    Audio.stopMusic()
  }

  // 重玩目前這一關(失敗/暫停→重新開始 用)
  restartCurrent() {
    if (this.level === 2) this.startStorm()
    else this.start(this.mode)
  }

  // 進入下一關
  next() {
    if (this.level === 1) this.startStorm()
    // 第二關之後(大魚肚)尚未製作
  }

  loop(t) {
    if (!this.last) this.last = t
    let dt = (t - this.last) / 1000
    this.last = t
    if (dt > 0.1) dt = 0.1 // 分頁切回時避免一次跳太多

    // 靜音切換(M 鍵)— 任何狀態都可
    if (this.input.consumeMute()) this.toggleMute()

    // 暫停切換(P / Esc / 暫停鈕)— 只在遊戲中或暫停中有效
    if (this.input.consumePause()) {
      if (this.state === STATE.PLAYING) this.pause()
      else if (this.state === STATE.PAUSED) this.resume()
    }

    if (this.state === STATE.PLAYING) {
      this.acc += dt
      while (this.acc >= STEP) {
        this.step(STEP)
        if (this.state !== STATE.PLAYING) break // 本步若結束遊戲就停止累積
        this.acc -= STEP
      }
    } else {
      // 標題/失敗畫面:按跳鍵也能開始/重玩(過關畫面不處理,等按鈕)
      this.input.consumePress() // 清掉覆蓋畫面期間的點擊,避免一開始就誤觸
      this.input.consumeTap()
      if (this.input.consumeJump()) {
        if (this.state === STATE.TITLE) this.start('run')
        else if (this.state === STATE.LOSE) this.restartCurrent()
      }
    }

    this.renderer.draw(this)
    requestAnimationFrame((tt) => this.loop(tt))
  }

  step(dt) {
    // 第二關「暴風雨」自成一格,交給 Storm 場景處理
    if (this.level === 2) {
      this.storm.step(dt)
      return
    }

    // ---- 輸入 → 跳躍 / 前進後退(依模式)----
    const press = this.input.consumePress()
    const tapped = this.input.consumeTap()
    let wantJump = this.input.consumeJump()

    if (this.mode === 'run') {
      // 闖關:點畫面任意處(非暫停區)= 跳;世界自動向前並加速
      if (press) wantJump = true
      const k = Math.min(1, this.distance / RUN.rampDistance)
      this.speed = RUN.startSpeed + (RUN.maxSpeed - RUN.startSpeed) * k
    } else {
      // 漫步:按住 →/畫面右半 = 前進,←/畫面左半 = 後退,輕點 = 跳;無時間壓力
      if (tapped) wantJump = true
      if (this.knockbackLeft > 0) {
        // 被敵人撞到:強制往後退(無視輸入),退完才恢復控制
        this.speed = -WALK.knockbackSpeed
      } else {
        const half = this.input.viewW * 0.5
        const forward =
          this.input.right || (this.input.pointerDown && this.input.pointerX >= half)
        const backward =
          this.input.left || (this.input.pointerDown && this.input.pointerX < half)
        this.speed = forward ? WALK.speed : backward ? -WALK.speed : 0
      }
    }

    if (wantJump && this.player.jump()) Audio.sfx('jump')

    // 位移(漫步擊退時用剩餘距離限制,且不可退到起點之前)
    if (this.mode === 'walk' && this.knockbackLeft > 0) {
      const back = Math.min(this.knockbackLeft, WALK.knockbackSpeed * dt)
      this.distance = Math.max(0, this.distance - back)
      this.knockbackLeft -= back
    } else {
      this.distance += this.speed * dt
      if (this.mode === 'walk') this.distance = Math.max(0, this.distance)
    }

    this.player.update(dt)
    this.spawner.update(dt, this.speed, this.distance, RUN.goalDistance, this.mode === 'walk')

    // 撞到障礙(只有闖關模式會扣命;漫步模式障礙無害,沒有壓力)
    if (this.mode === 'run' && this.player.invuln <= 0) {
      const pb = this.player.hitbox()
      for (const o of this.spawner.obstacles) {
        const ob = { x: o.x - o.w / 2, y: GROUND_Y - o.h, w: o.w, h: o.h }
        if (aabb(pb, ob)) {
          this.player.lives -= 1
          this.player.invuln = INVULN_TIME
          Audio.sfx('hit')
          if (this.player.lives <= 0) {
            this.gameOver()
            return
          }
          break
        }
      }
    }

    // 小敵人:踩頭上=踩扁+加分+彈起;從側面碰到=漫步溫和擋一下(不扣命)、闖關扣命
    const pbe = this.player.hitbox()
    for (const e of this.spawner.enemies) {
      if (e.dead) continue
      const eb = { x: e.x - e.w / 2, y: GROUND_Y - e.h, w: e.w, h: e.h }
      if (!aabb(pbe, eb)) continue
      const stomp = this.player.vy > 0 && this.player.y <= GROUND_Y - e.h + 16
      if (stomp) {
        e.dead = true
        this.player.vy = -460 // 踩一下彈起
        this.coinsCollected += 2
        Audio.sfx('stomp')
      } else if (this.player.invuln <= 0) {
        Audio.sfx('hit')
        if (this.mode === 'run') {
          this.player.lives -= 1
          this.player.invuln = INVULN_TIME
          if (this.player.lives <= 0) {
            this.gameOver()
            return
          }
        } else {
          // 漫步:被撞往後退 3 步(平滑後退),短暫無敵,不扣命
          this.player.invuln = 0.8
          this.knockbackLeft = WALK.knockback
        }
      }
    }

    // 撿空中寶物
    const pb2 = this.player.hitbox()
    for (const c of this.spawner.treasures) {
      if (!c.taken) {
        const cb = { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 }
        if (aabb(pb2, cb)) {
          c.taken = true
          if (c.kind === 'life') {
            // 愛心:補一條命;已滿血則折算 3 分,不浪費
            if (this.player.lives < LIVES) this.player.lives += 1
            else this.coinsCollected += 3
            Audio.sfx('treasure', { life: true })
          } else {
            this.coinsCollected += c.value
            Audio.sfx('treasure', { value: c.value })
          }
        }
      }
    }

    // 抵達終點 = 過關
    if (this.distance >= RUN.goalDistance) this.win()
  }

  // 船從畫面右側滑入(終點前 1000px 開始),回傳 x;尚未出現則回 null
  shipPos(dist) {
    const startAt = RUN.goalDistance - 1000
    if (dist < startAt) return null
    const t = Math.min(1, (dist - startAt) / 1000)
    const fromX = VIEW.W + 100
    const toX = PLAYER.x + 150
    return fromX + (toX - fromX) * t
  }

  toggleMute() {
    Audio.unlock()
    const m = Audio.toggleMute()
    this.ui.setMuteIcon(m)
  }

  pause() {
    if (this.state !== STATE.PLAYING) return
    this.state = STATE.PAUSED
    this.ui.hidePauseButton()
    this.ui.showPaused()
    Audio.pauseAll()
  }

  resume() {
    if (this.state !== STATE.PAUSED) return
    this.ui.hide()
    this.ui.showPauseButton()
    this.state = STATE.PLAYING
    // 第一關恢復輕快音樂;第二關暴風雨只恢復音訊(不放旋律)
    if (this.level === 1) Audio.resumeAll()
    else Audio.unlock()
  }

  win() {
    this.state = STATE.WIN
    this.ui.hidePauseButton()
    Audio.stopMusic()
    Audio.sfx('win')
    if (this.level === 2) {
      // 暴風雨:無寶物分數;下一關(大魚肚)尚未製作
      this.ui.showWin(LEVEL2, null, { showCoins: false, nextLabel: '下一關 · 大魚肚(製作中)', nextEnabled: false })
    } else {
      this.ui.showWin(LEVEL1, this.coinsCollected, {
        showCoins: true,
        nextLabel: '下一關 · 暴風雨',
        nextEnabled: true,
      })
    }
  }

  gameOver() {
    this.state = STATE.LOSE
    this.ui.hidePauseButton()
    Audio.stopMusic()
    Audio.sfx('lose')
    this.ui.showLose(this.level === 2 ? LEVEL2 : LEVEL1)
  }
}

// 軸對齊矩形碰撞
function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
