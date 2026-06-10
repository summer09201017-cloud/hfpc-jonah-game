// 約拿闖關 — 煙霧測試(零相依、可離線跑,不需瀏覽器或測試框架)
//
// 為什麼有這支:這個遊戲沒有自動化測試,會在主日學課堂上爆掉的錯(答案索引寫錯、
// 少了某關文案、改壞狀態機、離線裝不起來)只能靠手動玩才發現。這支腳本把這些
// 「上課前必檢查」的事變成一個指令。
//
// 跑法:
//   npm test                 內容 + 語法 + 狀態機/嵌入契約(快,不 build)
//   npm test -- --offline    再加:build → 檢查 PWA 離線就緒(sw 預快取 / manifest / 資產齊備)
//   npm run test:offline      同上(已在 package.json 設好)
//
// 跨專案:這支是「可攜的」——換到同類遊戲只要改最上面的 CONFIG(見 skill: game-smoke-test)。

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, extname } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// ───────────────────────── 專案設定(換專案改這裡)─────────────────────────
const CONFIG = {
  srcDir: 'src',
  syntaxExts: ['.js', '.mjs'], // 要做 node --check 語法檢查的副檔名

  // 換到「內容不是 ESM export」的專案(如保羅大富翁的 JSON 棋盤,已有 game-content-validator)
  // 可把對應階段關掉,只用語法 + PWA 離線檢查:
  skipContent: false, // 關掉「問答題庫 / 各關經文」(ESM 內容)驗證
  skipRouting: false, // 關掉 game.js 狀態機/嵌入契約靜態檢查

  // 內容模組(純 ESM 資料、不碰 DOM),會被 import 後逐項驗證
  quizModule: 'src/quiz.js', // 需 export QUESTIONS[]
  scriptureModule: 'src/scripture.js', // 需 export LEVEL1..n
  levels: ['LEVEL1', 'LEVEL2', 'LEVEL3', 'LEVEL4', 'LEVEL5', 'LEVEL6'],

  // 狀態機 / 嵌入契約:對 game.js 原始碼做字串斷言
  gameModule: 'src/game.js',
  routingMustInclude: [
    'startNineveh', // 第四關進入點存在
    'startPreach', // 第五關進入點存在
    'startGourd', // 第六關進入點存在
    'goalPos', // 終點目標座標(已從 shipPos 一般化)
    'LEVEL4', // win/lose 有接第四關文案
    'LEVEL5', // win 有接第五關文案
    'LEVEL6', // win 有接第六關文案
  ],
  routingMustMatch: [
    // 關卡鏈:L3 過關→L4;L4 過關→L5;L5 過關→L6(全書六關串起來)
    /this\.level === 3\)\s*this\.startNineveh/,
    /this\.level === 4\)\s*this\.startPreach/,
    /this\.level === 5\)\s*this\.startGourd/,
  ],
  // 嵌入契約:game.js 不可自己 import UI(ui 必須由外部注入,見 CLAUDE.md「嵌入契約」)
  embedForbid: [/from ['"]\.\/ui\.js['"]/],

  // PWA / 離線(--offline 時才檢查)
  buildCmd: 'npm run build',
  siteDir: 'site',
  entryHtml: 'index.html',
  swFile: 'sw.js', // 相對 siteDir
  manifestFile: 'manifest.webmanifest', // 相對 siteDir
}
// ─────────────────────────────────────────────────────────────────────────

const WANT_OFFLINE = process.argv.includes('--offline')
let pass = 0
let fail = 0
const fails = []
const warns = []

function ok(msg) {
  pass++
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`)
}
function bad(msg) {
  fail++
  fails.push(msg)
  console.log(`  \x1b[31m✗\x1b[0m ${msg}`)
}
function warn(msg) {
  warns.push(msg)
  console.log(`  \x1b[33m!\x1b[0m ${msg}`)
}
function check(cond, msg) {
  cond ? ok(msg) : bad(msg)
  return cond
}
function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`)
}
const isStr = (v) => typeof v === 'string' && v.trim().length > 0

// 走訪目錄(只用單檔 readdir,避開這台機器 Node 24 的遞迴 fs 地雷)
function walk(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

async function importLocal(rel) {
  return import(pathToFileURL(join(root, rel)).href)
}

// 驗證一題選擇題(問答 / 禱告站共用):answer 必須是 choices 的合法索引(最常見、最致命的錯)
function validateMCQ(item, label) {
  if (!isStr(item.q)) return bad(`${label}:缺 q(題目)`)
  if (!Array.isArray(item.choices) || item.choices.length < 2)
    return bad(`${label}:choices 需至少 2 個選項`)
  if (!item.choices.every(isStr)) return bad(`${label}:choices 內含空字串`)
  if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.choices.length)
    return bad(`${label}:answer=${item.answer} 超出 0..${item.choices.length - 1} 範圍`)
  if (!isStr(item.explain ?? item.ref) && !isStr(item.ref))
    return bad(`${label}:缺 explain/ref(教導/出處)`)
  return ok(`${label}:OK(${item.choices.length} 選項,answer=${item.answer})`)
}

// ── 1. 內容:問答題庫 ──────────────────────────────────────────────
async function checkQuiz() {
  section('1. 問答題庫 (quiz.js)')
  let mod
  try {
    mod = await importLocal(CONFIG.quizModule)
  } catch (e) {
    return bad(`無法 import ${CONFIG.quizModule}:${e.message}`)
  }
  const Q = mod.QUESTIONS
  if (!check(Array.isArray(Q) && Q.length > 0, `QUESTIONS 是非空陣列(${Q?.length ?? 0} 題)`)) return
  Q.forEach((q, i) => validateMCQ(q, `第 ${i + 1} 題`))
  // pickQuestions 應存在且能抽題(供標題練習用)
  if (typeof mod.pickQuestions === 'function') {
    const picked = mod.pickQuestions(5)
    check(Array.isArray(picked) && picked.length === Math.min(5, Q.length), 'pickQuestions(5) 正常抽題')
  }
}

// ── 2. 內容:各關經文 / 文案 ────────────────────────────────────────
async function checkScripture() {
  section('2. 各關經文 / 文案 (scripture.js)')
  let mod
  try {
    mod = await importLocal(CONFIG.scriptureModule)
  } catch (e) {
    return bad(`無法 import ${CONFIG.scriptureModule}:${e.message}`)
  }
  for (const name of CONFIG.levels) {
    const L = mod[name]
    if (!check(L && typeof L === 'object', `${name} 存在`)) continue
    check(isStr(L.title) && isStr(L.subtitle) && isStr(L.ref) && isStr(L.verse), `${name}:title/subtitle/ref/verse 齊備`)
    check(L.win && isStr(L.win.head) && isStr(L.win.body), `${name}:win.head/body 齊備`)
    if (L.lose) check(isStr(L.lose.head) && isStr(L.lose.body), `${name}:lose.head/body 齊備`)
    if (L.hud) check(isStr(L.hud.start) && isStr(L.hud.goal), `${name}:hud.start/goal 齊備(進度條兩端)`)
    if (Array.isArray(L.stations)) {
      check(L.stations.length > 0, `${name}:stations 非空(${L.stations.length} 段)`)
      L.stations.forEach((st, i) => {
        if (!isStr(st.ref) || !isStr(st.line)) bad(`${name} 第 ${i + 1} 段:缺 ref/line(經文)`)
        else validateMCQ(st, `${name} 禱告站 ${i + 1}`)
      })
    }
  }
}

// ── 3. 語法:所有原始碼都能被解析 ───────────────────────────────────
function checkSyntax() {
  section('3. 原始碼語法 (node --check)')
  const files = walk(join(root, CONFIG.srcDir)).filter((f) => CONFIG.syntaxExts.includes(extname(f)))
  if (!check(files.length > 0, `找到 ${files.length} 個原始檔`)) return
  for (const f of files) {
    try {
      execSync(`node --check "${f}"`, { stdio: 'pipe' })
      ok(`解析 OK:${f.slice(root.length + 1)}`)
    } catch (e) {
      bad(`語法錯誤:${f.slice(root.length + 1)} — ${String(e.stderr || e.message).split('\n')[0]}`)
    }
  }
}

// ── 4. 狀態機 / 嵌入契約(對 game.js 做靜態斷言)──────────────────────
function checkRouting() {
  section('4. 狀態機路由 + 嵌入契約 (game.js)')
  let src
  try {
    src = readFileSync(join(root, CONFIG.gameModule), 'utf8')
  } catch (e) {
    return bad(`讀不到 ${CONFIG.gameModule}:${e.message}`)
  }
  for (const tok of CONFIG.routingMustInclude) check(src.includes(tok), `包含關鍵字「${tok}」`)
  for (const re of CONFIG.routingMustMatch) check(re.test(src), `符合路由規則 ${re}`)
  for (const re of CONFIG.embedForbid)
    check(!re.test(src), `嵌入契約:game.js 未自行 import UI(${re})`)
}

// ── 5. PWA / 離線就緒(--offline)──────────────────────────────────
function checkOffline() {
  section('5. PWA 離線就緒(build → 檢查 site/)')
  try {
    console.log(`  · 執行 ${CONFIG.buildCmd} …`)
    execSync(CONFIG.buildCmd, { cwd: root, stdio: 'pipe' })
    ok(`build 成功`)
  } catch (e) {
    return bad(`build 失敗:${String(e.stderr || e.message).split('\n')[0]}`)
  }
  const site = join(root, CONFIG.siteDir)
  if (!check(existsSync(site), `產生了 ${CONFIG.siteDir}/`)) return

  const allFiles = walk(site).map((f) => f.slice(site.length + 1).replace(/\\/g, '/'))
  const inSite = (p) => {
    const rel = p.replace(/^\//, '') || CONFIG.entryHtml
    return allFiles.includes(rel === '' ? CONFIG.entryHtml : rel)
  }

  // 入口 HTML 在
  check(inSite('/' + CONFIG.entryHtml), `${CONFIG.entryHtml} 已輸出`)

  // index.html 參照的本地資產都在(script/link),且沒有外部 http(s) 資產(離線會掛)
  const html = readFileSync(join(site, CONFIG.entryHtml), 'utf8')
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1])
  const external = refs.filter((r) => /^https?:\/\//.test(r))
  check(external.length === 0, `index.html 無外部資產參照(離線安全)${external.length ? ':' + external.join(', ') : ''}`)
  for (const r of refs.filter((r) => r.startsWith('/'))) {
    check(inSite(r), `index.html 參照存在:${r}`)
  }

  // styles.css 不靠外部字型 / @import(離線安全)
  const cssRel = refs.find((r) => r.endsWith('.css'))
  if (cssRel && inSite(cssRel)) {
    const css = readFileSync(join(site, cssRel.replace(/^\//, '')), 'utf8')
    check(!/@import|https?:\/\//.test(css), `${cssRel} 無外部字型/@import(離線安全)`)
  }

  // manifest 有效 + 圖示齊備
  const manRel = CONFIG.manifestFile
  if (check(inSite('/' + manRel), `${manRel} 已輸出`)) {
    try {
      const man = JSON.parse(readFileSync(join(site, manRel), 'utf8'))
      check(isStr(man.name) && isStr(man.start_url) && isStr(man.display), 'manifest 有 name/start_url/display')
      check(Array.isArray(man.icons) && man.icons.length > 0, `manifest 有 icons(${man.icons?.length ?? 0})`)
      for (const ic of man.icons || []) check(inSite(ic.src), `圖示存在:${ic.src}`)
    } catch (e) {
      bad(`manifest 不是合法 JSON:${e.message}`)
    }
  }

  // service worker:有版本號 + 預快取清單(CORE)的檔都在
  const swRel = CONFIG.swFile
  if (check(inSite('/' + swRel), `${swRel} 已輸出`)) {
    const sw = readFileSync(join(site, swRel), 'utf8')
    check(/CACHE\s*=\s*['"][^'"]+['"]/.test(sw), 'sw.js 有 CACHE 版本號(改版用)')
    const coreBlock = sw.match(/CORE\s*=\s*\[([\s\S]*?)\]/)
    if (check(!!coreBlock, 'sw.js 有 CORE 預快取清單')) {
      const core = [...coreBlock[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])
      for (const c of core) check(inSite(c), `預快取檔存在:${c}`)
    }
    // 入口 JS 沒被預快取也沒關係(此 SW 是 network-first、首次線上載入時會即時快取),提醒一下即可
    const jsRefs = refs.filter((r) => r.endsWith('.js'))
    const coreList = coreBlock ? coreBlock[1] : ''
    if (jsRefs.some((j) => !coreList.includes(j)))
      warn('入口 JS 未列入 CORE 預快取(此 SW 為 network-first,首次線上載入後才離線可用——建議裝好後先線上完整玩一輪)')
  }
}

// ── 跑 ──────────────────────────────────────────────────────────────
console.log('\x1b[1m約拿闖關 · 煙霧測試\x1b[0m' + (WANT_OFFLINE ? '(含離線就緒)' : ''))
if (!CONFIG.skipContent) {
  await checkQuiz()
  await checkScripture()
}
checkSyntax()
if (!CONFIG.skipRouting) checkRouting()
if (WANT_OFFLINE) checkOffline()
else console.log('\n\x1b[2m(略過 PWA 離線檢查;加 --offline 可一併檢查 build + sw + manifest)\x1b[0m')

section('結果')
console.log(`  通過 ${pass}　失敗 ${fail}　提醒 ${warns.length}`)
if (fail > 0) {
  console.log('\n\x1b[31m有失敗項目:\x1b[0m')
  fails.forEach((f) => console.log('  · ' + f))
  process.exit(1)
}
console.log('\n\x1b[32m全部通過 ✓\x1b[0m')
