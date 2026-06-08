// 標題 / 過關 / 失敗的覆蓋畫面,用 DOM 呈現(文字、經文、按鈕排版較容易)。

export class UI {
  constructor() {
    this.overlay = document.getElementById('overlay')
    this.card = document.getElementById('card')
    this.pauseBtn = document.getElementById('pauseBtn')
    this.muteBtn = document.getElementById('muteBtn')
    this._start = null
    this._restart = null
    this._next = null
    this._resume = null
    this._pause = null
    this._mute = null
    this._storm = null

    // 用事件委派處理卡片內的按鈕
    this.card.addEventListener('click', (e) => {
      const ds = e.target && e.target.dataset ? e.target.dataset : null
      if (!ds) return
      const act = ds.act
      if (act === 'start' && this._start) this._start(ds.mode || 'run')
      else if (act === 'storm' && this._storm) this._storm()
      else if (act === 'restart' && this._restart) this._restart()
      else if (act === 'resume' && this._resume) this._resume()
      else if (act === 'next' && this._next) this._next()
    })

    // 右上角暫停按鈕:用 pointerdown(比 click 早,且攔住事件不外漏到 canvas)
    this.pauseBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (this._pause) this._pause()
    })

    // 靜音按鈕(同樣攔住事件,不外漏到 canvas)
    this.muteBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (this._mute) this._mute()
    })
  }

  onStorm(fn) {
    this._storm = fn
  }

  onStart(fn) {
    this._start = fn
  }
  onRestart(fn) {
    this._restart = fn
  }
  onNext(fn) {
    this._next = fn
  }

  onResume(fn) {
    this._resume = fn
  }

  onPause(fn) {
    this._pause = fn
  }

  onMute(fn) {
    this._mute = fn
  }

  setMuteIcon(muted) {
    this.muteBtn.textContent = muted ? '🔇' : '🔊'
    this.muteBtn.title = muted ? '取消靜音 (M)' : '靜音 (M)'
  }

  showPauseButton() {
    this.pauseBtn.classList.add('show')
  }

  hidePauseButton() {
    this.pauseBtn.classList.remove('show')
  }

  show(html) {
    this.card.innerHTML = html
    this.overlay.classList.add('show')
  }
  hide() {
    this.overlay.classList.remove('show')
  }

  showTitle(L) {
    this.show(`
      <div class="kicker">約拿闖關 · MVP</div>
      <h1>${L.title}</h1>
      <p class="sub">${L.subtitle}</p>
      <div class="verse"><span class="ref">${L.ref}</span>${L.verse}</div>
      <div class="row">
        <button class="btn" data-act="start" data-mode="run">🏃 闖關模式</button>
        <button class="btn ghost" data-act="start" data-mode="walk">🚶 漫步模式</button>
      </div>
      <div class="row">
        <button class="btn ghost" data-act="storm">🌊 第二關 · 暴風雨</button>
      </div>
      <p class="hint">
        🏃 <b>闖關</b>:自動向前跑,跳過障礙(撞到會扣命)。
        🚶 <b>漫步</b>:自己控制、可前進後退、沒有壓力。
        🌊 <b>暴風雨</b>:用 ← → 穩住搖晃的船。<br>
        跳:空白鍵/↑/點畫面　|　漫步:→/右半、←/左半、輕點跳　|　暴風雨:←/→ 或左右兩側
      </p>
    `)
  }

  // opts: { showCoins, nextLabel, nextEnabled }
  showWin(L, coins, opts = {}) {
    const showCoins = opts.showCoins !== false
    const nextLabel = opts.nextLabel || '下一關'
    const nextAttr = opts.nextEnabled ? '' : 'disabled'
    this.show(`
      <div class="kicker win">過關!</div>
      <h2>${L.win.head}</h2>
      <p class="body">${L.win.body.replace(/\n/g, '<br>')}</p>
      <div class="verse"><span class="ref">${L.ref}</span>${L.verse}</div>
      ${showCoins ? `<p class="score">收集寶物 🪙 ${coins} 分</p>` : ''}
      <div class="row">
        <button class="btn ghost" data-act="restart">↻ 再玩一次</button>
        <button class="btn" data-act="next" ${nextAttr}>${nextLabel}</button>
      </div>
    `)
  }

  showLose(L) {
    this.show(`
      <div class="kicker lose">${L.lose.head}</div>
      <p class="body" style="text-align:center">${L.lose.body}</p>
      <button class="btn" data-act="restart">↻ 再試一次</button>
    `)
  }

  showPaused() {
    this.show(`
      <div class="kicker">⏸ 暫停</div>
      <p class="sub">深呼吸一下,預備好就繼續。</p>
      <div class="row">
        <button class="btn" data-act="resume">▶ 繼續</button>
        <button class="btn ghost" data-act="restart">↻ 重新開始</button>
      </div>
    `)
  }
}
