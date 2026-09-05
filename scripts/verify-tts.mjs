// verify-tts.mjs —— 驗「遊戲執行時真的會播到 mp3」,不是只驗「檔案在」。
//
// ★ 為什麼需要這支:mp3 有、manifest 有、檔案 200,**但只要 ttsKey 對不上就照樣播機器聲**,
//   而且完全沒有錯誤訊息。0813 之前本站是更前面一步的病:根本沒烤過(0 支 mp3)
//   ⇒ tts/manifest.json 一直 404 ⇒ 六關經文全部用 Web Speech 機器聲唸
//   (使用者 0730 明令禁止的那種)。零錯誤、零紅燈,只有真的按下朗讀鍵的人聽得出來。
//
//   所以這裡不看檔案在不在,而是**重跑 runtime 那條路**:
//     ① 用 scripture.js 真資料 + speak.js 真 spokenRef 組出「實際會唸的字串」
//     ② 用 ttsFix.js 真 ttsKey 算 key(和 runtime 同一支函式)
//     ③ 去 public/tts/manifest.json 查得到,且 mp3 真的在磁碟上、不是空檔
//
// 用法:node scripts/verify-tts.mjs   (exit 0=全綠;非 0=有句子會退回機器聲)
import { readFileSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const imp = (p) => import(pathToFileURL(join(root, p)).href)

const { spokenRef } = await imp('src/speak.js')
const { ttsKey } = await imp('src/ttsFix.js')
const S = await imp('src/scripture.js')

// ⚠ 必須跟 src/game.js 的 call site 一字不差(speak.js:127 的 full 組法):
//   game.js:487/521 speakScripture(LEVELS[lv].verse, { ref: LEVELS[lv].ref })
//   game.js:791/902/1003 同形(LEVEL3/5/6)
//   ⇒ full = `${verse}。${spokenRef(ref)}`
const LEVELS = ['LEVEL1', 'LEVEL2', 'LEVEL3', 'LEVEL4', 'LEVEL5', 'LEVEL6']
const expected = LEVELS.map((k) => ({
  where: `${k}(${S[k].ref})`,
  full: `${S[k].verse}。${spokenRef(S[k].ref)}`,
}))

// ⚠ 讀不到 manifest 要「判紅」而不是拋例外——0813 之前本站正是這個狀態。
let manifest
try {
  manifest = JSON.parse(readFileSync(join(root, 'public', 'tts', 'manifest.json'), 'utf8'))
} catch {
  console.error('  ✗ public/tts/manifest.json 讀不到 ⇒ 六關經文全部會退回機器聲(這正是 0813 修掉的狀態)')
  console.error('✗ verify-tts:未烤製,請跑 node scripts/gen-tts.mjs 直到印「新產 0」')
  process.exit(1)
}

let bad = 0
for (const { where, full } of expected) {
  const key = ttsKey(full)
  const rel = manifest[key]
  if (!rel) { console.error(`  ✗ ${where}:manifest 沒有 key ${key} ⇒ 會退回機器聲`); bad++; continue }
  const fp = join(root, 'public', rel)
  if (!existsSync(fp)) { console.error(`  ✗ ${where}:manifest 指到 ${rel} 但檔案不在`); bad++; continue }
  const kb = statSync(fp).size / 1024
  if (kb < 5) { console.error(`  ✗ ${where}:${rel} 只有 ${kb.toFixed(1)}KB,疑似烤壞`); bad++; continue }
  console.log(`  ✓ ${where}:${key}(${kb.toFixed(0)}KB)`)
}

// 孤兒:manifest 有、但沒有 call site 會唸到(gen-tts 的 manifest 是累加式,改經文後舊 key 會留著)
const wanted = new Set(expected.map((e) => ttsKey(e.full)))
const orphans = Object.keys(manifest).filter((k) => !wanted.has(k))
if (orphans.length) console.error(`  ⚠ 孤兒 ${orphans.length} 支(manifest 有、沒人唸):${orphans.join(', ')}`)

console.log(bad ? `✗ verify-tts:${bad} 句會退回機器聲` : `✓ verify-tts:${expected.length} 句全部對得到 mp3、孤兒 ${orphans.length}`)
process.exitCode = bad ? 1 : 0
