// age.js —— 約拿闖關「年齡分級三檔(幼稚園/兒童/青少年)」的全局難度係數 + 跨關記憶 + 語音玩法詞。
// 回應兒主老師回饋:「太簡單只適合幼兒、不識字幼兒不會玩」。vanilla 版的 kid-age-modes
//   (對應 hfpc-paul-game 的 src/agePrefs.js + skill kid-age-modes;此為約拿引擎源頭,改完 sync 給 paul 的 fork 關)。
// 全局係數:一組倍率套用到六關共同的難度槓桿——速度(跑酷/走路)、生命、暴風雨強度——不逐關細調(最穩、最低風險)。
// 零相依、可離線;localStorage 讀不到/隱私模式 → 安靜回 'kids'(絕不報錯)。
const KEY = 'hfpc-age-pref'
export const AGES = ['kinder', 'kids', 'teen']

export const AGE = {
  kinder: { id: 'kinder', label: '幼稚園', emoji: '🧸', sub: '慢一點、多一條命、會語音講解', speedMul: 0.82, livesDelta: 2, stormMul: 0.82, speakHowto: true },
  kids:   { id: 'kids',   label: '兒童',   emoji: '🙂', sub: '一般難度（7–12 歲）',          speedMul: 1.0,  livesDelta: 0, stormMul: 1.0,  speakHowto: false },
  teen:   { id: 'teen',   label: '青少年', emoji: '🧑', sub: '更快更難、命少一點',           speedMul: 1.18, livesDelta: -1, stormMul: 1.18, speakHowto: false },
}

// 各關「語音玩法簡介」(給不識字的幼兒聽;這是玩法說明、非經文,口語即可)。鍵 = 關卡編號。
export const HOWTO = {
  1: '點一下畫面就會跳！跳過箱子和小動物，一直跑到船那裡。',
  2: '船在搖晃，用左邊右邊把船扶正，不要讓船翻掉。',
  3: '在大魚肚子裡慢慢往前走，跳起來碰到亮亮的燭光就一起禱告。',
  4: '一直往前跑，跑到尼尼微大城去。',
  5: '走到每一個人面前，把神的話大聲告訴他們。',
  6: '坐下來，看看神為約拿安排的事，再想一想神的心意。',
}

export function getAge(id) {
  return AGE[id] || AGE.kids
}
export function getAgePref() {
  try {
    const v = localStorage.getItem(KEY)
    return AGES.includes(v) ? v : 'kids'
  } catch {
    return 'kids'
  }
}
export function setAgePref(id) {
  try {
    if (AGES.includes(id)) localStorage.setItem(KEY, id)
  } catch {
    /* 隱私模式/不可寫 → 安靜略過 */
  }
}
