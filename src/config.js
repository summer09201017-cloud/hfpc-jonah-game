// 第一關所有可調整的數值都集中在這裡,方便平衡與微調

// 邏輯解析度(實際畫面會等比縮放填滿視窗,並做黑邊置中)
export const VIEW = { W: 960, H: 540 }

// 地面基準線(約拿的腳底站在這裡)
export const GROUND_Y = VIEW.H - 96

// 物理
export const PHYS = {
  gravity: 2200, // 重力加速度 (px/s^2)
  jumpV: -780, // 起跳初速度 (px/s,負值=向上)
}

// 跑酷節奏
export const RUN = {
  startSpeed: 280, // 起始捲動速度 (px/s)
  maxSpeed: 470, // 最高速度
  rampDistance: 7000, // 在此距離內線性加速到最高速
  goalDistance: 9000, // 跑完這段距離 = 抵達往他施的船
}

// 漫步模式:由玩家控制前進/後退,沒有時間壓力
export const WALK = {
  speed: 240, // 走路速度(按住前進/後退時)
  step: 70, // 一「步」的距離(用於敵人擊退)
  knockback: 210, // 碰到小敵人往後退的距離(= 約 3 步)
  knockbackSpeed: 430, // 擊退時後退的速度
}

// 第二關 暴風雨:平衡穩船。tilt 以弧度計(0=正、正值=向右傾)。
// 難度 2026-06-11 再調短調易(牧師回饋);撐過 duration 後進入「拋約拿入海」結尾(拿 1:15)。
//   想更難 → 調高 windBase / windGrow / capsizeRate / tip,或調低 push / safeTilt / recoverRate。
//   想更簡單 → 反向即可(例:windGrow 再降、push 再升、duration 再短)。
export const STORM = {
  duration: 20, // 撐過這麼多秒 = 進入結尾「拋約拿入海」;越短越容易(原 30)
  safeTilt: 0.37, // 傾斜在此之內算安全(約 21°);越大越寬鬆
  maxTilt: 0.65, // 達到此角度=幾乎翻船(約 37°)
  tip: 2.2, // 失穩力:越傾越容易翻(像平衡桿);越大越難
  push: 6.2, // 玩家按方向施加的回正力;越大越好扶正(越簡單)(原 5.6)
  damp: 2.0, // 角速度阻尼;越大搖晃越穩、越不會甩過頭
  windBase: 1.15, // 風的基礎強度;越大越難
  windGrow: 1.25, // 風隨時間增強的幅度;越大後段越難(原 1.55)
  capsizeRate: 0.52, // 超過安全角時「翻船值」上升速度;越小越有反應時間(越簡單)(原 0.64)
  recoverRate: 1.05, // 回到安全角時「翻船值」下降速度;越大越快脫離危險(越簡單)(原 0.92)
  castTossTime: 1.9, // 結尾:約拿被拋出去到海平靜的動畫秒數
  // 操作方向:預設「按哪邊就把船往那邊推」(船向右倒就按 ← 扶正,最直覺)。
  // 若實測時某群體覺得方向相反,改成 true 即可整個對調 ←/→(畫面提示箭頭也會跟著對調)。
  invertControl: false,
}

// 戰爭闖關原型 #1「摩西舉手之戰」(出 17:8–13)——重用第二關暴風雨的平衡 loop 換皮。
//   armDrop(0=高舉雙手,1=完全垂下):疲勞像重力把手往下拉(gravity),玩家出力把手舉回(push),
//   呼求亞倫、戶珥來扶手(supportPush,很強但有「可用度」support 會耗盡、需回充)。
//   手垂太低(armDrop>safeDrop)→ 谷中亞瑪力得勢,defeat 值上升;升到 1 = 以色列敗(失敗)。
//   撐到日落(survival>=duration)= 以色列得勝(過關)。這一關「單靠自己撐不到日落」是刻意的——
//   late game gravity 會超過 push,逼玩家學會「在對的時候呼求同工」(依靠值鉤子;亞 4:6)。
//   想更難 → 調高 gravityGrow / defeatRise,或調低 push / supportDrainTime / safeDrop;反之更簡單。
// 操作(2026-06-13 簡化,牧師實測「按左邊也輸」=舊兩區設計是陷阱):
//   按住畫面任意處 / 任意方向鍵 = 出力舉手(armDrop 往 0)。就這一個動作,夠單純。
//   亞倫、戶珥「自動」在手垂下時來扶(supportTriggerDrop),不必玩家自己呼求——
//   依靠值改用「看得見」的方式教:後段你光靠自己撐不住,會親眼看到他們上來扶手。
export const MOSES = {
  duration: 20, // 撐到日落(秒)= 過關;越短越輕鬆(原 75→35→20,牧師回饋)
  safeDrop: 0.5, // 手垂在此之內(armDrop<0.5)算「舉得夠高」,defeat 會回落;超過就上升
  // 平衡心法:你出力舉手是主力,亞倫戶珥是「撐住、不讓它垮」的扶持。
  // 後段疲勞(gravity)會超過你獨力的 push → 必須有扶手;但扶手獨力也不夠(supportPush < 後段 gravity)
  // → 光被動等扶手也會輸。兩者「同工」才撐得住(這就是依靠值)。
  push: 3.0, // 玩家「出力舉手」的回正力(主力)
  supportPush: 2.5, // 亞倫、戶珥扶手時的額外上舉(自動觸發;獨力不足以勝過後段疲勞)
  supportTriggerDrop: 0.45, // 手垂超過這個程度,亞倫戶珥就自動上來扶(若還有可用度)
  damp: 2.2, // 手臂角速度阻尼(越大越穩、不甩過頭)
  gravityBase: 1.0, // 疲勞基礎下垂力
  gravityGrow: 2.6, // 疲勞隨時間增強(後段超過 push,必須加上扶手才撐得住)
  twingeBase: 0.4, // 隨機「手一沉」的抽痛基礎強度
  twingeGrow: 0.8, // 抽痛隨時間增強
  defeatRise: 0.5, // 手垂太低時 defeat(亞瑪力得勢)上升速度
  defeatRecover: 1.3, // 手舉夠高時 defeat 回落速度(越大越有反應時間=越簡單)
  supportDrainTime: 5.0, // 亞倫戶珥連續扶手可持續的秒數(可用度由 1 耗到 0)
  supportRechargeTime: 5.0, // 可用度從 0 回充到滿所需秒數(沒在扶手時回充)
  supportMinToStart: 0.15, // 耗盡後要回充到這個量才能再次扶手(避免在 0 附近閃爍)
}

// 戰爭闖關原型 #2「紅海奔逃」(出 14)——自成一格的場景(level === 8),重用「跑酷/跳躍」手感。
//   phase: stand(站住等候、海漸開)→ cross(過海床、跳障礙、追兵在後)→ closing(海合攏淹追兵)→ done。
//   lead = 領先追兵的距離(px):乾淨奔跑會拉開(gapRecoverPerSec,上限 chaseGapMax),
//   絆到障礙瞬間縮短 chaseCloseOnHit;lead<=0 = 追兵追上(失敗)。跑到 goalDistance = 對岸(過關)。
//   想更難 → 調高 chaseCloseOnHit、調低 chaseGapStart / gapRecoverPerSec / hazardGap;反之更簡單。
export const REDSEA = {
  standTime: 3.0, // 站住等候、海分開的秒數(海全開才能衝)
  runSpeed: 320, // 海床奔跑速度(px/s;世界捲動 = 前進距離)
  goalDistance: 4200, // 紅海有多寬(此岸→對岸的距離;約 13 秒腳程)
  hazardGap: 540, // 海床障礙(礁石/陷坑)之間的距離
  chaseGapStart: 360, // 開跑時領先追兵的距離(px)
  chaseGapMax: 540, // 領先距離上限(拉太開也不超過,維持壓力)
  chaseCloseOnHit: 150, // 絆到一次障礙,追兵逼近的距離
  gapRecoverPerSec: 26, // 乾淨奔跑時每秒拉開的距離
  stumbleTime: 0.5, // 絆到後變慢的秒數
  stumbleSpeedMult: 0.42, // 踉蹌時的速度倍率
  closeTime: 2.2, // 抵達對岸後「海合攏淹追兵」動畫的秒數
}

// 衝刺(跑酷撿到 ⚡ 寶物):短暫跑得更快——「速度出於耶和華」(王上 18:46 以利亞束腰奔跑)
export const BOOST = {
  duration: 4, // 衝刺持續秒數
  mult: 1.45, // 速度倍率(跑酷世界速度 / 漫步前進速度都乘上它)
}

// 主動衝刺(闖關模式):手指「按住螢幕不放」或按住 →/D = 持續加速,放開恢復。
// (輕點仍然是跳——按住要超過 holdDelay 秒才算衝刺,所以快速點跳不會誤觸。)
export const SPRINT = {
  mult: 1.3, // 按住時的速度倍率(比 ⚡ 的 1.45 溫和;兩者同時只取較大值,不疊乘)
  holdDelay: 0.22, // 按住超過這麼多秒才開始衝刺(區隔「點一下跳」)
}

// 玩家(約拿)
export const PLAYER = {
  x: 190, // 約拿固定在畫面左側這個 x
  w: 40, // 命中框寬
  h: 58, // 命中框高
  emoji: '🏃',
}

export const LIVES = 3 // 生命(撞到障礙會扣)
export const INVULN_TIME = 1.1 // 受擊後無敵秒數(閃爍)

// 船價門檻:收集足夠的「船價」🪙 才上得了船、過第一關。
// 呼應「約拿…給了船價,上了船」(拿 1:3),讓沿路的金幣有了意義。
export const FARE = {
  run: 15, // 闖關模式:不能自動回頭,門檻較低;不足時可暫時自由移動回頭收集
  walk: 20, // 漫步模式:可自由探索,門檻較高
}

// 第四關 上岸→尼尼微:重用第一關跑酷引擎(同一套物理 RUN / 障礙 / 寶物),
// 只換主題(曠野路 → 尼尼微大城)、不需船價;這裡放它可獨立微調的數值。
export const NINEVEH = {
  goalDistance: 9000, // 旱地→尼尼微的旅程長度(與第一關相當;想更長更累就調大)
}

// 第五關 尼尼微傳道(對話 RPG):在大城街道往前走,走到居民面前停下對話、宣告神的話;
// 答對 = 那人悔改(披麻衣),五位(含王)都悔改 = 過關。這一關不會失敗(答錯重想,如第三關)。
export const PREACH = {
  walkSpeed: 185, // 在城中行走的速度
  segment: 520, // 每位居民之間要走的距離
}

// 第六關 蓖麻樹(反思結局):五幕場景動畫(棚下/蓖麻/蟲子/東風/神的心),
// 蓖麻、蟲、東風都是神「安排」的——玩家不操控,只觀看與回答反思題(這正是這關的信息)。
export const GOURD = {
  sceneTime: 3.4, // 每一幕場景動畫的長度(秒);輕點/跳鍵可跳過
}

// 第三關 大魚肚:在黑暗中往前走,跳起來碰到懸空的禱告蠟燭就禱告;途中蹲下鑽過骨頭。
export const FISH = {
  walkSpeed: 175, // 站著往前走的速度
  crouchSpeed: 95, // 蹲著鑽行的速度(較慢)
  segment: 560, // 每段要走的距離(中間放骨頭、底端放蠟燭)
  candleY: GROUND_Y - 105, // 禱告蠟燭懸空的高度(要跳起來才碰得到)
  boneAt: 0.5, // 骨頭出現在這一段的比例位置(站著過不去,要蹲下鑽過)
}
