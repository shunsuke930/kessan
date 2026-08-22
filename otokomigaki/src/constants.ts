import type { ParamKey } from './types'

export const STORAGE_KEY = 'otokomigaki-save-v2'

export const PACKAGE_COMPLETE_BONUS = 3
export const NEGLECT_DAYS_THRESHOLD = 3
/** 日付が切り替わる時刻（0〜23時）。この時刻より前は前日として扱う */
export const DAY_RESET_HOUR = 4

export const PARAM_META: Record<ParamKey, { label: string; emoji: string; bar: string }> = {
  look: { label: '見た目', emoji: '💪', bar: 'bg-pink-400' },
  mind: { label: '規律', emoji: '🧠', bar: 'bg-violet-400' },
  comm: { label: '対人', emoji: '💬', bar: 'bg-sky-400' },
  skill: { label: '知性', emoji: '📚', bar: 'bg-amber-400' },
}

export const PARAM_ORDER: ParamKey[] = ['look', 'mind', 'comm', 'skill']

export interface RoomGrade {
  level: number
  name: string
  emoji: string
  bg: string
  requiredPt: number
}

export const ROOM_GRADES: RoomGrade[] = [
  { level: 1, name: 'ワンルーム（散らかっている）', emoji: '🧹', bg: 'from-stone-700 to-stone-900', requiredPt: 0 },
  { level: 2, name: 'ワンルーム（片付いている）', emoji: '🛏️', bg: 'from-slate-600 to-slate-800', requiredPt: 50 },
  { level: 3, name: '1LDK', emoji: '🛋️', bg: 'from-blue-700 to-indigo-900', requiredPt: 225 },
  { level: 4, name: 'デザイナーズ', emoji: '🖼️', bg: 'from-indigo-600 to-purple-900', requiredPt: 675 },
  { level: 5, name: '海の見える家', emoji: '🌊', bg: 'from-cyan-600 to-blue-900', requiredPt: 1200 },
  { level: 6, name: 'タワーマンション', emoji: '🏙️', bg: 'from-amber-500 to-purple-900', requiredPt: 1900 },
]

export interface StreakTier {
  minStreak: number
  multiplier: number
}

export const STREAK_TIERS: StreakTier[] = [
  { minStreak: 1, multiplier: 1.0 },
  { minStreak: 7, multiplier: 1.2 },
  { minStreak: 30, multiplier: 1.5 },
  { minStreak: 100, multiplier: 2.0 },
]

/** キャラの段階(1〜5)は「見た目(look)」パラメータで決まる。絵文字は画像未配置時のフォールバック */
export const CHARACTER_STAGES = ['🧍', '🚶', '🧑‍💼', '🕺', '🤴']
export const NEGLECTED_CHARACTER = '😔'

export const LOOK_CHAR_STAGE_THRESHOLDS = [
  { stage: 1, minLook: 0 },
  { stage: 2, minLook: 25 },
  { stage: 3, minLook: 60 },
  { stage: 4, minLook: 120 },
  { stage: 5, minLook: 220 },
]

/** キャラの段階が上がったときに表示するメッセージ */
export const CHAR_STAGE_UP_MESSAGES: Record<number, string> = {
  2: '体が変わってきた',
  3: '引き締まってきた',
  4: '見違えるほど仕上がってきた',
  5: '完成された身体になった',
}

export interface PackageSlotTier {
  minLevel: number
  slots: number
}

/** 同時に有効化できるパッケージ数。レベルに応じて段階解放する */
export const PACKAGE_SLOT_TIERS: PackageSlotTier[] = [
  { minLevel: 0, slots: 3 },
  { minLevel: 5, slots: 4 },
  { minLevel: 15, slots: 5 },
]
