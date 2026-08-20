import type { ParamKey } from './types'

export const STORAGE_KEY = 'otokomigaki-save-v2'

export const POINTS_PER_TASK = 1
export const PACKAGE_COMPLETE_BONUS = 3
export const MAX_ACTIVE_PACKAGES = 2
export const NEGLECT_DAYS_THRESHOLD = 3

export const PARAM_META: Record<ParamKey, { label: string; emoji: string; bar: string }> = {
  look: { label: '見た目', emoji: '💪', bar: 'bg-pink-400' },
  comm: { label: 'コミュ力', emoji: '💬', bar: 'bg-sky-400' },
  skill: { label: 'スキル', emoji: '📚', bar: 'bg-amber-400' },
  asset: { label: '資産', emoji: '💰', bar: 'bg-emerald-400' },
}

export const PARAM_ORDER: ParamKey[] = ['look', 'comm', 'skill', 'asset']

export interface RoomGrade {
  level: number
  name: string
  emoji: string
  bg: string
  requiredPt: number
}

export const ROOM_GRADES: RoomGrade[] = [
  { level: 1, name: 'ワンルーム（散らかっている）', emoji: '🧹', bg: 'from-stone-700 to-stone-900', requiredPt: 0 },
  { level: 2, name: 'ワンルーム（片付いている）', emoji: '🛏️', bg: 'from-slate-600 to-slate-800', requiredPt: 35 },
  { level: 3, name: '1LDK', emoji: '🛋️', bg: 'from-blue-700 to-indigo-900', requiredPt: 150 },
  { level: 4, name: 'デザイナーズ', emoji: '🖼️', bg: 'from-indigo-600 to-purple-900', requiredPt: 450 },
  { level: 5, name: 'タワマン', emoji: '🏙️', bg: 'from-amber-500 to-purple-900', requiredPt: 900 },
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

export const CHARACTER_STAGES = ['🧍', '🚶', '🧑‍💼', '🕺', '🤴']
export const NEGLECTED_CHARACTER = '😔'
