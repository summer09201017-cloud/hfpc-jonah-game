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
export const STORM = {
  duration: 36, // 撐過這麼多秒 = 風暴過去(過關)
  safeTilt: 0.34, // 傾斜在此之內算安全(約 19°)
  maxTilt: 0.62, // 達到此角度=幾乎翻船(約 36°)
  tip: 2.6, // 失穩力:越傾越容易翻(像平衡桿)
  push: 5.0, // 玩家按方向施加的回正力
  damp: 1.6, // 角速度阻尼
  windBase: 1.4, // 風的基礎強度
  windGrow: 1.9, // 風隨時間增強的幅度
  capsizeRate: 0.85, // 超過安全角時「翻船值」上升速度
  recoverRate: 0.75, // 回到安全角時「翻船值」下降速度
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
