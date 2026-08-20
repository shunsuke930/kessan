import type { ParamKey, Params, Task } from './types'

export const STORAGE_KEY = 'otokomigaki-save-v1'

export const POINTS_PER_TASK = 2

export const PARAM_ORDER: ParamKey[] = [
  'appearance',
  'communication',
  'skill',
  'assets',
]

export const PARAM_META: Record<ParamKey, { label: string; emoji: string; bar: string }> = {
  appearance: { label: '見た目', emoji: '💪', bar: 'bg-pink-400' },
  communication: { label: 'コミュ力', emoji: '💬', bar: 'bg-sky-400' },
  skill: { label: 'スキル', emoji: '📚', bar: 'bg-amber-400' },
  assets: { label: '資産', emoji: '💰', bar: 'bg-emerald-400' },
}

export const INITIAL_PARAMS: Params = {
  appearance: 0,
  communication: 0,
  skill: 0,
  assets: 0,
}

export const TASKS: Task[] = [
  { id: 'workout', label: '筋トレ 30分', emoji: '🏋️', param: 'appearance' },
  { id: 'skincare', label: 'スキンケア', emoji: '🧴', param: 'appearance' },
  { id: 'smalltalk', label: '誰かと雑談する', emoji: '🗣️', param: 'communication' },
  { id: 'thanks', label: '「ありがとう」を伝える', emoji: '🙏', param: 'communication' },
  { id: 'reading', label: '読書 30分', emoji: '📖', param: 'skill' },
  { id: 'course', label: 'オンライン講座を1レッスン', emoji: '🎓', param: 'skill' },
  { id: 'budget', label: '家計簿をつける', emoji: '📝', param: 'assets' },
  { id: 'invest', label: '投資・副業の勉強', emoji: '📈', param: 'assets' },
]

interface RoomGrade {
  level: number
  name: string
  emoji: string
  bg: string
}

export const ROOM_GRADES: RoomGrade[] = [
  { level: 1, name: 'ワンルーム', emoji: '🛏️', bg: 'from-slate-700 to-slate-800' },
  { level: 2, name: '1K', emoji: '🪟', bg: 'from-slate-600 to-blue-900' },
  { level: 3, name: '1LDK', emoji: '🛋️', bg: 'from-blue-700 to-indigo-900' },
  { level: 4, name: 'デザイナーズ', emoji: '🖼️', bg: 'from-indigo-600 to-purple-900' },
  { level: 5, name: 'タワマン', emoji: '🏙️', bg: 'from-amber-500 to-purple-900' },
]

export const CHARACTER_STAGES = ['🧍', '🚶', '🧑‍💼', '🕺', '🤴']
