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
    this._nineveh = null
    this._quizAction = null
    this._fishAction = null

    // 用事件委派處理卡片內的按鈕
    this.card.addEventListener('click', (e) => {
      const ds = e.target && e.target.dataset ? e.target.dataset : null
      if (!ds) return
      const act = ds.act
      if (act === 'start' && this._start) this._start(ds.mode || 'run')
      else if (act === 'storm' && this._storm) this._storm()
      else if (act === 'nineveh' && this._nineveh) this._nineveh()
      else if (act === 'restart' && this._restart) this._restart()
      else if (act === 'resume' && this._resume) this._resume()
      else if (act === 'next' && this._next) this._next()
      // 所有聖經問答相關按鈕(quiz-start / quiz-choice / quiz-continue / quiz-restart / quiz-home)
      else if (act && act.indexOf('quiz') === 0 && this._quizAction) this._quizAction(act, ds)
      // 第三關大魚肚的按鈕(fish-start / fish-begin / fish-choice / fish-continue)
      else if (act && act.indexOf('fish') === 0 && this._fishAction) this._fishAction(act, ds)
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
  onNineveh(fn) {
    this._nineveh = fn
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

  // 聖經問答的所有按鈕都走這一個回呼:fn(act, dataset)
  onQuizAction(fn) {
    this._quizAction = fn
  }

  // 第三關大魚肚的所有按鈕都走這一個回呼:fn(act, dataset)
  onFishAction(fn) {
    this._fishAction = fn
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
        <button class="btn ghost" data-act="fish-start">🐋 第三關 · 大魚肚</button>
        <button class="btn ghost" data-act="nineveh">🏙️ 第四關 · 上岸往尼尼微</button>
      </div>
      <div class="row">
        <button class="btn ghost" data-act="quiz-start">📖 聖經問答</button>
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

  // ---- 聖經問答 ----
  // 出題:single=true 時只有一題(NPC),不顯示「第幾題」。
  showQuiz(q, index, total, single = false) {
    const choices = q.choices
      .map(
        (c, i) =>
          `<button class="btn ghost choice" data-act="quiz-choice" data-choice="${i}">${c}</button>`
      )
      .join('')
    this.show(`
      <div class="kicker">📖 聖經問答</div>
      ${single ? '' : `<p class="sub">第 ${index + 1} / ${total} 題</p>`}
      <h2 class="qtext">${q.q}</h2>
      <div class="choices">${choices}</div>
    `)
  }

  // 作答後的回饋:對/錯 + 正解 + 經文出處與解說。
  // continueLabel 由 game 決定(「繼續」/「看結果」/「回去走走」)。
  showQuizFeedback(q, chosen, continueLabel) {
    const correct = chosen === q.answer
    this.show(`
      <div class="kicker ${correct ? 'win' : 'lose'}">${correct ? '✓ 答對了!' : '再想想~'}</div>
      <h2>${q.choices[q.answer]}</h2>
      <div class="verse"><span class="ref">${q.ref}</span>${q.explain}</div>
      <button class="btn" data-act="quiz-continue">${continueLabel}</button>
    `)
  }

  // ---- 第三關 大魚肚 ----
  showFishIntro(L) {
    this.show(`
      <div class="kicker">${L.title}</div>
      <p class="sub">${L.subtitle}</p>
      <div class="verse"><span class="ref">${L.ref}</span>${L.verse}</div>
      <p class="body">${L.intro.replace(/\n/g, '<br>')}</p>
      <button class="btn" data-act="fish-begin">🚶 進入魚腹</button>
    `)
  }

  // 出一段禱告的反思問題(idx 從 0 起)
  showFishQuestion(st, idx, total) {
    const choices = st.choices
      .map(
        (c, i) =>
          `<button class="btn ghost choice" data-act="fish-choice" data-choice="${i}">${c}</button>`
      )
      .join('')
    this.show(`
      <div class="kicker">🐋 魚腹中的禱告　${idx + 1} / ${total}</div>
      <h2 class="qtext">${st.q}</h2>
      <div class="choices">${choices}</div>
    `)
  }

  // 答對才揭示這一段禱告(和合本)+ 反思,並點亮這盞燈
  showFishReveal(st, last) {
    this.show(`
      <div class="kicker win">✓ 一同禱告</div>
      <div class="verse"><span class="ref">${st.ref}</span>${st.line}</div>
      <p class="body" style="text-align:center">${st.explain}</p>
      <button class="btn" data-act="fish-continue">${last ? '🌅 浮上水面' : '繼續前行 →'}</button>
    `)
  }

  // 答錯:不點燈、不前進,再想一次
  showFishTryAgain() {
    this.show(`
      <div class="kicker lose">再想想~</div>
      <p class="body" style="text-align:center">這一段禱告還沒答對。再讀一次題目,想想約拿的心,然後再選一次。</p>
      <button class="btn" data-act="fish-retry">再試一次</button>
    `)
  }

  // 長者的題目這趟都答對了:直接放行的提示卡
  showQuizAllDone() {
    this.show(`
      <div class="kicker win">✓ 都答對了!</div>
      <h2>長者笑著點點頭</h2>
      <p class="body" style="text-align:center">你已經把長者的問題都答對了!平安去吧——記得約拿的神,也正在尋找你。</p>
      <button class="btn" data-act="quiz-continue">繼續前進</button>
    `)
  }

  showQuizSummary(correct, total, remark) {
    this.show(`
      <div class="kicker win">問答結束</div>
      <h2>答對 ${correct} / ${total} 題</h2>
      <p class="body" style="text-align:center">${remark}</p>
      <div class="row">
        <button class="btn ghost" data-act="quiz-restart">↻ 再來一輪</button>
        <button class="btn" data-act="quiz-home">回標題</button>
      </div>
    `)
  }
}
